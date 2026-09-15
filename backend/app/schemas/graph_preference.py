from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GraphPreferenceBase(BaseModel):
    theme: Optional[str] = "dark"
    layout_type: Optional[str] = "radial"

class GraphPreferenceCreate(GraphPreferenceBase):
    pass

class GraphPreferenceUpdate(GraphPreferenceBase):
    pass

class GraphPreferenceResponse(GraphPreferenceBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True
