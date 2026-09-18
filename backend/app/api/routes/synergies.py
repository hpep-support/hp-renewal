from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db, SessionLocal
from app.core.security import get_current_user, require_owner
from app.models.user import User
from app.models.record import Record
from app.models.context import Context
from app.models.synergy import SynergyCandidate
from app.schemas.synergy import SynergyCandidateResponse, SynergyReview
from app.services.llm import calculate_synergy_score

router = APIRouter()

@router.get("/", response_model=List[SynergyCandidateResponse])
def get_synergies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    synergies = db.query(SynergyCandidate).order_by(SynergyCandidate.score.desc()).all()
    return synergies

@router.post("/{synergy_id}/review", response_model=SynergyCandidateResponse)
def review_synergy(
    synergy_id: int,
    review_in: SynergyReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    synergy = db.query(SynergyCandidate).filter(SynergyCandidate.id == synergy_id).first()
    if not synergy:
        raise HTTPException(status_code=404, detail="Synergy not found")
    
    synergy.review_result = review_in.review_result
    db.commit()
    db.refresh(synergy)
    return synergy

import time

def generate_synergies_task(delay_ms: int = 0):
    db = SessionLocal()
    try:
        contexts = db.query(Context).all()
        
        threshold = 0.7
        for i in range(len(contexts)):
            for j in range(i + 1, len(contexts)):
                
                # Check if pair already evaluated
                existing = db.query(SynergyCandidate).filter(
                    ((SynergyCandidate.context_a_id == contexts[i].id) & (SynergyCandidate.context_b_id == contexts[j].id)) |
                    ((SynergyCandidate.context_a_id == contexts[j].id) & (SynergyCandidate.context_b_id == contexts[i].id))
                ).first()
                if existing:
                    continue
                    
                result = calculate_synergy_score(contexts[i].body, contexts[j].body, "")
                if result["score"] >= threshold:
                    synergy = SynergyCandidate(
                        context_a_id=contexts[i].id,
                        context_b_id=contexts[j].id,
                        score=result["score"],
                        agent_type=result["agent_type"],
                        reason=result["reason"]
                    )
                    db.add(synergy)
                    db.commit()
                    
                    if delay_ms > 0:
                        time.sleep(delay_ms / 1000.0)
    finally:
        db.close()

@router.post("/batch", status_code=status.HTTP_202_ACCEPTED)
def run_synergy_batch(
    background_tasks: BackgroundTasks,
    delay_ms: int = 0,
    current_user: User = Depends(require_owner)
):
    background_tasks.add_task(generate_synergies_task, delay_ms)
    return {"message": "Synergy batch started"}

@router.delete("/all", status_code=status.HTTP_204_NO_CONTENT)
def clear_all_synergies(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    db.query(SynergyCandidate).delete()
    db.commit()
    return None
