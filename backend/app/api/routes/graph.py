from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.entity import Entity
from app.models.triple import Triple
from app.models.synergy import SynergyCandidate

router = APIRouter()

@router.get("/")
def get_graph_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only return active entities (not merged into another)
    entities = db.query(Entity).filter(Entity.merged_into_id == None).all()
    triples = db.query(Triple).all()
    synergies = db.query(SynergyCandidate).all()
    
    nodes = []
    active_entity_ids = {ent.id for ent in entities}
    
    for ent in entities:
        nodes.append({
            "id": ent.id,
            "name": ent.name,
            "type": ent.type or "Concept",
            "context_body": ent.context.body if ent.context else "",
            "created_by_agent": ent.created_by_agent,
            "info_date": ent.info_date.isoformat() if ent.info_date else None,
            "confidence": ent.confidence
        })
        
    links = []
    # Add triples as links (ensuring both ends are in active entities)
    for t in triples:
        if t.subject_id in active_entity_ids and t.object_id in active_entity_ids:
            links.append({
                "id": f"t_{t.id}",
                "source": t.subject_id,
                "target": t.object_id,
                "label": t.predicate,
                "type": "triple",
                "source_agent": t.source_agent,
                "info_date": t.info_date.isoformat() if t.info_date else None
            })
        
    syn_data = []
    for s in synergies:
        if s.entity_a_id in active_entity_ids and s.entity_b_id in active_entity_ids:
            syn_data.append({
                "id": s.id,
                "source": s.entity_a_id,
                "target": s.entity_b_id,
                "score": s.score,
                "agent_type": s.agent_type,
                "reason": s.reason,
                "type": "synergy"
            })
        
    return {
        "nodes": nodes,
        "triples": links,
        "synergies": syn_data
    }
