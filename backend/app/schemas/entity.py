from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.context import ContextResponse

class EntityBase(BaseModel):
    name: str
    type: Optional[str] = None
    context_id: int

class EntityCreate(EntityBase):
    pass

class EntityResponse(EntityBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TripleBase(BaseModel):
    subject_id: int
    predicate: str
    object_id: int
    context_id: int

class TripleCreate(TripleBase):
    pass

class TripleResponse(TripleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Extended response for graph rendering
class EntityGraphResponse(EntityResponse):
    context_body: Optional[str] = None
