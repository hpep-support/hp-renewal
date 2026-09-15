import json
from sqlalchemy.orm import Session
from app.models.entity import Entity

def upsert_entities_from_json(db: Session, json_str: str):
    if not json_str or json_str == "[]":
        return
    try:
        relationships = json.loads(json_str)
        for rel in relationships:
            src_name = rel.get("source")
            src_type = rel.get("source_type")
            tgt_name = rel.get("target")
            tgt_type = rel.get("target_type")

            if src_name:
                src_entity = db.query(Entity).filter(Entity.name == src_name).first()
                if not src_entity:
                    src_entity = Entity(name=src_name, entity_type=src_type or "person")
                    db.add(src_entity)
                elif src_type:
                    src_entity.entity_type = src_type

            if tgt_name:
                tgt_entity = db.query(Entity).filter(Entity.name == tgt_name).first()
                if not tgt_entity:
                    tgt_entity = Entity(name=tgt_name, entity_type=tgt_type or "project")
                    db.add(tgt_entity)
                elif tgt_type:
                    tgt_entity.entity_type = tgt_type
        
        db.commit()
    except Exception as e:
        print("Failed to upsert entities:", e)
        db.rollback()
