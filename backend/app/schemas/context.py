from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ContextBase(BaseModel):
    body: str
    context_type: str # 'asis' or 'tobe'

class ContextCreate(ContextBase):
    pass

class ContextUpdate(BaseModel):
    body: Optional[str] = None
    context_type: Optional[str] = None

class ContextResponse(ContextBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
