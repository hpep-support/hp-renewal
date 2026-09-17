from pydantic import BaseModel
from datetime import datetime

from typing import Optional

class ContextBase(BaseModel):
    body: str
    context_type: str # 'asis' or 'tobe'
    resource_url: Optional[str] = None
    extracted_entities: Optional[str] = None

class ContextCreate(ContextBase):
    community_id: int
    image_base64: Optional[str] = None

class ContextResponse(ContextBase):
    id: int
    community_id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EntityRename(BaseModel):
    old_name: str
    new_name: str
