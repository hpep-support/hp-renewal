from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_owner, get_current_user
from app.core.llm import extract_entities
from app.models.context import Context
from app.models.user import User
from app.schemas.context import ContextCreate, ContextResponse, EntityRename
import json
from .upsert_helper import upsert_entities_from_json


router = APIRouter()

@router.post("", response_model=ContextResponse)
def create_context(
    context_in: ContextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entities = extract_entities(context_in.body, context_in.image_base64)
    
    db_context = Context(
        community_id=context_in.community_id,
        owner_id=current_user.id,
        body=context_in.body,
        context_type=context_in.context_type,
        resource_url=context_in.resource_url,
        extracted_entities=entities
    )
    db.add(db_context)
    db.commit()
    db.refresh(db_context)
    
    upsert_entities_from_json(db, entities, context_in.community_id)
    
    return db_context

@router.get("", response_model=List[ContextResponse])
def get_contexts(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contexts = db.query(Context).filter(Context.community_id == community_id).all()
    return contexts

@router.put("/{context_id}", response_model=ContextResponse)
def update_context(
    context_id: int,
    context_in: ContextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_context = db.query(Context).filter(Context.id == context_id).first()
    if not db_context:
        raise HTTPException(status_code=404, detail="Context not found")
    
    entities = extract_entities(context_in.body, context_in.image_base64)
    
    db_context.community_id = context_in.community_id
    db_context.body = context_in.body
    db_context.context_type = context_in.context_type
    db_context.resource_url = context_in.resource_url
    db_context.extracted_entities = entities
    
    db.commit()
    db.refresh(db_context)
    
    upsert_entities_from_json(db, entities, context_in.community_id)
    
    return db_context

@router.delete("/{context_id}")
def delete_context(
    context_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_context = db.query(Context).filter(Context.id == context_id).first()
    if not db_context:
        raise HTTPException(status_code=404, detail="Context not found")
    
    db.delete(db_context)
    db.commit()
    return {"message": "Context deleted"}

@router.put("/entities/rename", response_model=dict)
def rename_entity(
    community_id: int,
    rename_in: EntityRename,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contexts = db.query(Context).filter(
        Context.community_id == community_id,
        Context.extracted_entities.isnot(None)
    ).all()
    updated_count = 0
    
    for ctx in contexts:
        if ctx.extracted_entities and ctx.extracted_entities != "[]":
            try:
                relationships = json.loads(ctx.extracted_entities)
                changed = False
                for rel in relationships:
                    if rel.get("source") == rename_in.old_name:
                        rel["source"] = rename_in.new_name
                        changed = True
                    if rel.get("target") == rename_in.old_name:
                        rel["target"] = rename_in.new_name
                        changed = True
                
                if changed:
                    ctx.extracted_entities = json.dumps(relationships, ensure_ascii=False)
                    updated_count += 1
            except Exception:
                pass
                
    db.commit()
    return {"message": "Success", "updated_contexts": updated_count}

@router.delete("/entities/{entity_name}", response_model=dict)
def delete_entity(
    community_id: int,
    entity_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contexts = db.query(Context).filter(
        Context.community_id == community_id,
        Context.extracted_entities.isnot(None)
    ).all()
    updated_count = 0
    
    for ctx in contexts:
        if ctx.extracted_entities and ctx.extracted_entities != "[]":
            try:
                relationships = json.loads(ctx.extracted_entities)
                new_relationships = [
                    rel for rel in relationships 
                    if rel.get("source") != entity_name and rel.get("target") != entity_name
                ]
                
                if len(new_relationships) != len(relationships):
                    ctx.extracted_entities = json.dumps(new_relationships, ensure_ascii=False)
                    updated_count += 1
            except Exception:
                pass
                
    db.commit()
    return {"message": "Success", "updated_contexts": updated_count}
