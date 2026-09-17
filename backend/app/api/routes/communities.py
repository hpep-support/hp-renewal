from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.community import Community
from app.schemas.community import CommunityCreate, CommunityResponse

router = APIRouter()

@router.post("", response_model=CommunityResponse)
def create_community(
    community_in: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    community = Community(
        name=community_in.name,
        owner_id=current_user.id
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return community

@router.get("", response_model=List[CommunityResponse])
def get_communities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # MVP: Currently returning communities owned by the user
    # Later this can be expanded to communities the user is a member of
    communities = db.query(Community).filter(Community.owner_id == current_user.id).all()
    return communities
