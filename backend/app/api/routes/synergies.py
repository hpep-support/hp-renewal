from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.synergy import SynergyCandidate
from app.models.user import User
from app.schemas.synergy import SynergyCandidateResponse

router = APIRouter()

@router.get("/", response_model=List[SynergyCandidateResponse])
def get_synergy_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For MVP, allow any member to see synergy candidates
    candidates = db.query(SynergyCandidate).order_by(SynergyCandidate.generated_at.desc()).limit(50).all()
    return candidates
