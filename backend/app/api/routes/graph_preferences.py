from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.graph_preference import GraphPreference
from app.schemas.graph_preference import GraphPreferenceResponse, GraphPreferenceUpdate

router = APIRouter()

@router.get("/", response_model=GraphPreferenceResponse)
def get_graph_preference(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get current user's graph preferences.
    """
    pref = db.query(GraphPreference).filter(GraphPreference.user_id == current_user.id).first()
    if not pref:
        # Create default preference if none exists
        pref = GraphPreference(user_id=current_user.id, theme="dark", layout_type="radial")
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref

@router.put("/", response_model=GraphPreferenceResponse)
def update_graph_preference(
    pref_in: GraphPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update current user's graph preferences.
    """
    pref = db.query(GraphPreference).filter(GraphPreference.user_id == current_user.id).first()
    if not pref:
        pref = GraphPreference(user_id=current_user.id)
        db.add(pref)
        db.commit()
        db.refresh(pref)
    
    if pref_in.theme is not None:
        pref.theme = pref_in.theme
    if pref_in.layout_type is not None:
        pref.layout_type = pref_in.layout_type
        
    db.commit()
    db.refresh(pref)
    return pref
