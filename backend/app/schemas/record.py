from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class RecordBase(BaseModel):
    body: str
    disclosure_level: int

class RecordCreate(RecordBase):
    pass

class RecordUpdate(BaseModel):
    body: Optional[str] = None
    disclosure_level: Optional[int] = None

class RecordResponse(RecordBase):
    id: int
    user_id: int
    tags: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
