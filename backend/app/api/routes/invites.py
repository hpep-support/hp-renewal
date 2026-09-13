from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import secrets
from datetime import datetime, timedelta, timezone

from app.core.database import get_db
from app.core.security import require_owner
from app.models.invite import InviteCode
from app.models.user import User
from app.schemas.user import InviteCodeResponse

router = APIRouter()

@router.post("/", response_model=InviteCodeResponse)
def create_invite_code(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    code = secrets.token_urlsafe(16)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7) # Default 7 days
    
    db_invite = InviteCode(
        code=code,
        created_by=current_user.id,
        expires_at=expires_at
    )
    db.add(db_invite)
    db.commit()
    db.refresh(db_invite)
    return db_invite

@router.get("/", response_model=List[InviteCodeResponse])
def get_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    invites = db.query(InviteCode).order_by(InviteCode.created_at.desc()).all()
    return invites
