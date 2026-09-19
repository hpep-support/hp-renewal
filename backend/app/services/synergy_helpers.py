import logging
import re
from typing import Dict, Set, Tuple
from sqlalchemy.orm import Session
from app.models.entity import Entity
from app.models.triple import Triple

logger = logging.getLogger(__name__)

PROJECT_LIKE_TYPES = {"project", "organization", "company", "community", "dao", "group", "team"}
PERSON_LIKE_TYPES = {"person", "member", "individual", "user"}
NON_SYNERGY_TYPES = {"document", "event", "activity"}

def normalize_name(name: str) -> str:
    if not name:
        return ""
    # Strip spaces (half-width and full-width) and lowercase
    return re.sub(r"[\s\u3000]+", "", name).strip().lower()

def is_person_entity(e: Entity) -> bool:
    return (e.type or "").strip().lower() in PERSON_LIKE_TYPES

def is_project_entity(e: Entity) -> bool:
    return (e.type or "").strip().lower() in PROJECT_LIKE_TYPES

def build_graph_adjacency(db: Session) -> Tuple[Dict[int, Set[int]], Dict[int, int], Dict[int, Entity]]:
    """
    Builds canonical map, entity lookup, and bidirectional adjacency graph.
    Considers both explicit merged_into_id and normalized name matches.
    """
    all_entities = db.query(Entity).all()
    canonical_map: Dict[int, int] = {}
    
    # 1. Explicit merges
    for e in all_entities:
        if e.merged_into_id:
            canonical_map[e.id] = e.merged_into_id
            
    # 2. Normalized name matches (aliases)
    name_map: Dict[Tuple[str, str], int] = {}
    for e in all_entities:
        norm_name = normalize_name(e.name)
        norm_type = (e.type or "").strip().lower()
        key = (norm_name, norm_type)
        if norm_name:
            if key not in name_map:
                name_map[key] = canonical_map.get(e.id, e.id)
            else:
                canonical_map[e.id] = name_map[key]
                
    entity_dict = {e.id: e for e in all_entities}
    
    # 3. Adjacency graph
    triples = db.query(Triple).all()
    adj: Dict[int, Set[int]] = {}
    
    for t in triples:
        u = canonical_map.get(t.subject_id, t.subject_id)
        v = canonical_map.get(t.object_id, t.object_id)
        adj.setdefault(u, set()).add(v)
        adj.setdefault(v, set()).add(u)
        
    return adj, canonical_map, entity_dict

def are_entities_connected(
    ent_a: Entity,
    ent_b: Entity,
    adj: Dict[int, Set[int]],
    canonical_map: Dict[int, int],
    entity_dict: Dict[int, Entity]
) -> bool:
    """
    Checks whether two entities are already connected in the knowledge graph:
    1. Same entity / duplicate / alias.
    2. Direct connection (Triple exists between canonical IDs).
    3. 2-hop connection between Person and Project (e.g. Person <-> Document/Activity/Context <-> Project).
    """
    a_id = canonical_map.get(ent_a.id, ent_a.id)
    b_id = canonical_map.get(ent_b.id, ent_b.id)
    
    if a_id == b_id:
        return True
        
    # Same normalized name
    if normalize_name(ent_a.name) and normalize_name(ent_a.name) == normalize_name(ent_b.name):
        return True
        
    # 1. Direct connection
    if b_id in adj.get(a_id, set()) or a_id in adj.get(b_id, set()):
        return True
        
    # 2. Check Person <-> Project/Organization 2-hop connection
    is_a_person = is_person_entity(ent_a)
    is_b_person = is_person_entity(ent_b)
    is_a_proj = is_project_entity(ent_a)
    is_b_proj = is_project_entity(ent_b)
    
    if (is_a_person and is_b_proj) or (is_b_person and is_a_proj):
        person_id = a_id if is_a_person else b_id
        proj_id = b_id if is_a_person else a_id
        
        # Check 2-hop via Document, Context, Activity, Event
        for neighbor_id in adj.get(person_id, set()):
            neighbor = entity_dict.get(neighbor_id)
            if neighbor and (neighbor.type or "").strip().lower() not in PERSON_LIKE_TYPES:
                if proj_id in adj.get(neighbor_id, set()):
                    return True
                    
    return False

def is_valid_synergy_candidate(
    ent_a: Entity,
    ent_b: Entity,
    adj: Dict[int, Set[int]],
    canonical_map: Dict[int, int],
    entity_dict: Dict[int, Entity]
) -> bool:
    """
    Validates whether a pair of entities should be evaluated for synergy:
    - Excludes merged entities
    - Excludes self-referential / alias pairs
    - Excludes non-collaboration types (Document, Event, Activity)
    - Excludes pairs that are already connected (especially Person and Project/Organization)
    """
    if ent_a.merged_into_id is not None or ent_b.merged_into_id is not None:
        return False
        
    # Self or duplicate check
    if ent_a.id == ent_b.id or normalize_name(ent_a.name) == normalize_name(ent_b.name):
        return False
        
    type_a = (ent_a.type or "").strip().lower()
    type_b = (ent_b.type or "").strip().lower()
    
    # Non-collaboration types (Document, Event, Activity)
    if type_a in NON_SYNERGY_TYPES or type_b in NON_SYNERGY_TYPES:
        return False
        
    # Exclude already connected entities
    if are_entities_connected(ent_a, ent_b, adj, canonical_map, entity_dict):
        return False
        
    return True
