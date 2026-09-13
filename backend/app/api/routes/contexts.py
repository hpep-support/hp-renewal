from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import require_owner, get_current_user
from app.models.context import Context
from app.models.user import User
from app.schemas.context import ContextCreate, ContextResponse

router = APIRouter()

@router.post("/", response_model=ContextResponse)
def create_context(
    context_in: ContextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    db_context = Context(
        owner_id=current_user.id,
        body=context_in.body,
        context_type=context_in.context_type
    )
    db.add(db_context)
    db.commit()
    db.refresh(db_context)
    return db_context

@router.get("/", response_model=List[ContextResponse])
def get_contexts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Depending on visibility rules, we might want everyone to see contexts or just the owner.
    # For MVP, let's say anyone can read contexts (as it's a shared community)
    contexts = db.query(Context).all()
    return contexts
