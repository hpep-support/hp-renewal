from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.record import Record
from app.models.user import User
from app.schemas.record import RecordCreate, RecordResponse, RecordUpdate
from app.services.postiz import post_to_sns_via_postiz
import asyncio

router = APIRouter()

def background_sns_delivery(content: str):
    # Run the async postiz service from sync context
    asyncio.run(post_to_sns_via_postiz(content))

@router.post("/", response_model=RecordResponse)
def create_record(
    record_in: RecordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_record = Record(
        user_id=current_user.id,
        body=record_in.body,
        disclosure_level=record_in.disclosure_level
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    # Trigger Multi-SNS delivery if disclosure_level is 3 (Multi-SNS)
    if db_record.disclosure_level == 3:
        background_tasks.add_task(background_sns_delivery, db_record.body)

    return db_record

@router.get("/", response_model=List[RecordResponse])
def get_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(Record).filter(Record.user_id == current_user.id).all()
    return records
