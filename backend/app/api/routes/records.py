from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.record import Record
from app.schemas.record import RecordCreate, RecordUpdate, RecordResponse
from app.models.context import Context

from app.services.postiz import publish_to_postiz
from app.api.routes.synergies import generate_synergies_task

router = APIRouter()

@router.post("/", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    record_in: RecordCreate,
    background_tasks: BackgroundTasks,
    delay_ms: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = Record(
        user_id=current_user.id,
        body=record_in.body,
        disclosure_level=record_in.disclosure_level
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # Create corresponding Context
    context = Context(
        owner_id=current_user.id,
        record_id=record.id,
        body=record.body,
        context_type="record_sync"
    )
    db.add(context)
    db.commit()

    # If disclosure level is SNS (3), send to Postiz
    if record.disclosure_level == 3:
        await publish_to_postiz(record.body)
        
    # Automatically trigger synergy generation
    background_tasks.add_task(generate_synergies_task, delay_ms)
        
    return record

@router.get("/", response_model=List[RecordResponse])
def get_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Members can only see their own records.
    # Owners might see all, but for MVP let's stick to seeing own records in this endpoint
    records = db.query(Record).filter(Record.user_id == current_user.id).order_by(Record.created_at.desc()).all()
    return records

@router.patch("/{record_id}", response_model=RecordResponse)
def update_record(
    record_id: int,
    record_in: RecordUpdate,
    background_tasks: BackgroundTasks,
    delay_ms: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this record")
    
    if record_in.body is not None:
        record.body = record_in.body
        # Update corresponding Context if exists
        context = db.query(Context).filter(Context.record_id == record.id).first()
        if context:
            context.body = record_in.body
            
    if record_in.disclosure_level is not None:
        record.disclosure_level = record_in.disclosure_level
        
    db.commit()
    db.refresh(record)
    
    # Automatically trigger synergy generation on update
    background_tasks.add_task(generate_synergies_task, delay_ms)
    
    return record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")
    
    # Also delete corresponding Context if exists
    context = db.query(Context).filter(Context.record_id == record.id).first()
    if context:
        db.delete(context)
        
    db.delete(record)
    db.commit()
    return None
