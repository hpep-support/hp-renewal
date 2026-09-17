from pydantic import BaseModel
from datetime import datetime

class CommunityBase(BaseModel):
    name: str

class CommunityCreate(CommunityBase):
    pass

class CommunityResponse(CommunityBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
