from datetime import timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, hash_password, create_access_token, get_current_user, require_owner
from app.models.user import User
from app.models.invite import InviteCode
from app.schemas.user import UserCreate, UserResponse, InviteCodeResponse
from app.schemas.token import Token

router = APIRouter()

@router.post("/login", response_model=Token)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=1440)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/invite", response_model=UserResponse)
def register_with_invite(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Verify invite code
    invite = db.query(InviteCode).filter(InviteCode.code == user_in.invite_code).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if invite.used_by is not None:
        raise HTTPException(status_code=400, detail="Invite code already used")
    
    # Create user
    user = User(
        email=user_in.email,
        display_name=user_in.display_name,
        password_hash=hash_password(user_in.password),
        role="member"  # Owner account must be created manually or with a special code for MVP
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Mark invite as used
    invite.used_by = user.id
    db.commit()

    return user

@router.post("/admin/invite", response_model=InviteCodeResponse)
def create_invite_code(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_owner)
):
    code = secrets.token_urlsafe(16)
    invite = InviteCode(
        code=code,
        created_by=current_user.id
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user
