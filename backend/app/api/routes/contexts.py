from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_owner
from app.models.user import User
from app.models.context import Context
from app.schemas.context import ContextCreate, ContextUpdate, ContextResponse

router = APIRouter()

@router.post("/", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
def create_context(
    context_in: ContextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    context = Context(
        owner_id=current_user.id,
        body=context_in.body,
        context_type=context_in.context_type
    )
    db.add(context)
    db.commit()
    db.refresh(context)
    return context

@router.get("/", response_model=List[ContextResponse])
def get_contexts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    contexts = db.query(Context).filter(Context.owner_id == current_user.id).order_by(Context.created_at.desc()).all()
    return contexts

@router.patch("/{context_id}", response_model=ContextResponse)
def update_context(
    context_id: int,
    context_in: ContextUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    context = db.query(Context).filter(Context.id == context_id).first()
    if not context:
        raise HTTPException(status_code=404, detail="Context not found")
    if context.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if context_in.body is not None:
        context.body = context_in.body
    if context_in.context_type is not None:
        context.context_type = context_in.context_type
        
    db.commit()
    db.refresh(context)
    return context

@router.delete("/{context_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_context(
    context_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    context = db.query(Context).filter(Context.id == context_id).first()
    if not context:
        raise HTTPException(status_code=404, detail="Context not found")
    if context.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(context)
    db.commit()
    return None
