from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.agent_proposal import AgentProposal
from app.models.entity import Entity
from app.models.context import Context
from app.models.user import User
from app.api.dependencies import get_current_user
import json
from datetime import datetime, timezone

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/proposals")
def get_proposals(
    status: str = "pending",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AgentProposal).filter(AgentProposal.status == status)
    # Could filter by community if we link proposals to communities, 
    # but for MVP we just return all for the admin.
    proposals = query.order_by(AgentProposal.created_at.desc()).all()
    
    result = []
    for p in proposals:
        target_name = None
        if p.target_entity:
            target_name = p.target_entity.name
        elif p.target_context:
            target_name = f"Context #{p.target_context.id}"
            
        result.append({
            "id": p.id,
            "agent_type": p.agent_type,
            "proposal_type": p.proposal_type,
            "target_name": target_name,
            "current_value": json.loads(p.current_value) if p.current_value else None,
            "proposed_value": json.loads(p.proposed_value) if p.proposed_value else None,
            "reasoning": p.reasoning,
            "evidence_urls": json.loads(p.evidence_urls) if p.evidence_urls else [],
            "status": p.status,
            "created_at": p.created_at
        })
    return result

@router.post("/proposals/{proposal_id}/approve")
def approve_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposal = db.query(AgentProposal).filter(AgentProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.status != "pending":
        raise HTTPException(status_code=400, detail=f"Proposal is already {proposal.status}")
        
    # Apply the logic based on proposal_type
    proposed_val = json.loads(proposal.proposed_value)
    
    try:
        if proposal.proposal_type == "fix_entity":
            # merge_into action
            src_entity = db.query(Entity).filter(Entity.id == proposal.target_entity_id).first()
            tgt_id = proposed_val.get("canonical_entity_id")
            if src_entity and tgt_id:
                src_entity.merged_into_id = tgt_id
                db.add(src_entity)
                
        elif proposal.proposal_type == "update_date":
            context = db.query(Context).filter(Context.id == proposal.target_context_id).first()
            if context:
                date_str = proposed_val.get("info_date")
                if date_str:
                    if date_str.endswith('Z'):
                        date_str = date_str[:-1] + '+00:00'
                    context.info_date = datetime.fromisoformat(date_str)
                context.info_date_source = proposed_val.get("info_date_source")
                db.add(context)
                
        # Other types would be implemented here...
        
        proposal.status = "approved"
        proposal.reviewed_at = datetime.now(timezone.utc)
        proposal.reviewed_by = current_user.id
        
        db.commit()
        return {"status": "success", "message": "Proposal approved and applied"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to apply proposal: {str(e)}")

@router.post("/proposals/{proposal_id}/reject")
def reject_proposal(
    proposal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proposal = db.query(AgentProposal).filter(AgentProposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.status != "pending":
        raise HTTPException(status_code=400, detail=f"Proposal is already {proposal.status}")
        
    proposal.status = "rejected"
    proposal.reviewed_at = datetime.now(timezone.utc)
    proposal.reviewed_by = current_user.id
    
    db.commit()
    return {"status": "success", "message": "Proposal rejected"}
