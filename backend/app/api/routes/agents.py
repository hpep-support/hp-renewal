from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.agent_proposal import AgentProposal
from app.models.entity import Entity
from app.services.agents.base import apply_proposal_to_db
from app.services.agents.time_resolver import TimeResolverAgent
from app.services.agents.error_corrector import ErrorCorrectorAgent
from app.services.agents.discovery_crawler import DiscoveryCrawlerAgent
from app.services.agents.pooling import PoolingAgent

router = APIRouter()

class ReviewRequest(BaseModel):
    action: str # "approve" or "reject"

class RunAgentRequest(BaseModel):
    agent_type: str = "all" # "time_resolver", "error_corrector", "discovery_crawler", "pooling", "all"

@router.get("/proposals")
def list_proposals(
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AgentProposal)
    if status:
        query = query.filter(AgentProposal.status == status)
    
    proposals = query.order_by(AgentProposal.created_at.desc()).offset(offset).limit(limit).all()
    
    res = []
    for p in proposals:
        target_name = None
        if p.target_entity_id:
            ent = db.query(Entity).filter(Entity.id == p.target_entity_id).first()
            if ent:
                target_name = ent.name
                
        res.append({
            "id": p.id,
            "agent_type": p.agent_type,
            "proposal_type": p.proposal_type,
            "target_entity_id": p.target_entity_id,
            "target_entity_name": target_name,
            "target_context_id": p.target_context_id,
            "affects_person_id": p.affects_person_id,
            "current_value": p.current_value,
            "proposed_value": p.proposed_value,
            "reasoning": p.reasoning,
            "evidence_urls": p.evidence_urls,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "reviewed_at": p.reviewed_at.isoformat() if p.reviewed_at else None
        })
    return res

@router.post("/proposals/{proposal_id}/review")
def review_proposal(
    proposal_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposal = db.query(AgentProposal).filter(AgentProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if req.action == "approve":
        success = apply_proposal_to_db(db, proposal, reviewer_id=current_user.id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to apply proposal to database")
    elif req.action == "reject":
        proposal.status = "rejected"
        proposal.reviewed_at = datetime.now()
        proposal.reviewed_by = current_user.id
        db.add(proposal)
        db.commit()
    else:
        raise HTTPException(status_code=400, detail="Invalid review action. Use 'approve' or 'reject'.")
        
    db.refresh(proposal)
    return {"status": proposal.status, "id": proposal.id}

@router.post("/run")
def run_agents(
    req: RunAgentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created = []
    agent_map = {
        "time_resolver": TimeResolverAgent,
        "error_corrector": ErrorCorrectorAgent,
        "discovery_crawler": DiscoveryCrawlerAgent,
        "pooling": PoolingAgent,
    }
    
    if req.agent_type == "all":
        for atype, acls in agent_map.items():
            agent = acls(db)
            proposals = agent.run()
            created.extend([p.id for p in proposals if p])
    elif req.agent_type in agent_map:
        agent = agent_map[req.agent_type](db)
        proposals = agent.run()
        created.extend([p.id for p in proposals if p])
    else:
        raise HTTPException(status_code=400, detail=f"Unknown agent type: {req.agent_type}")
        
    return {"message": "Agent execution completed", "created_proposals_count": len(created), "proposal_ids": created}

@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    pending_count = db.query(AgentProposal).filter(AgentProposal.status == "pending").count()
    approved_count = db.query(AgentProposal).filter(AgentProposal.status == "approved").count()
    auto_applied_count = db.query(AgentProposal).filter(AgentProposal.status == "auto_applied").count()
    rejected_count = db.query(AgentProposal).filter(AgentProposal.status == "rejected").count()
    
    return {
        "pending": pending_count,
        "approved": approved_count,
        "auto_applied": auto_applied_count,
        "rejected": rejected_count,
        "total": pending_count + approved_count + auto_applied_count + rejected_count
    }
