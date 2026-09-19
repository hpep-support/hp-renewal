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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    info_date: Optional[datetime] = None
    info_date_source: Optional[str] = None
    source_agent: Optional[str] = None
    resource_url: Optional[str] = None

    class Config:
        from_attributes = True
