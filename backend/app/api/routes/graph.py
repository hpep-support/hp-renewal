from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
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
    entities = db.query(Entity).all()
    triples = db.query(Triple).all()
    synergies = db.query(SynergyCandidate).all()
    
    # Format entities to include context text for the tooltip
    nodes = []
    for ent in entities:
        nodes.append({
            "id": ent.id,
            "name": ent.name,
            "type": ent.type,
            "context_body": ent.context.body if ent.context else ""
        })
        
    links = []
    # Add triples as links
    for t in triples:
        links.append({
            "source": t.subject_id,
            "target": t.object_id,
            "label": t.predicate,
            "type": "triple"
        })
        
    # Add synergies as links (or Reason Nodes)
    # The frontend SynergyGraph will handle Reason Nodes logic, we just pass the synergy data
    syn_data = []
    for s in synergies:
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
