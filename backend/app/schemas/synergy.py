from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.record import RecordResponse

class SynergyCandidateResponse(BaseModel):
    id: int
    record_a_id: int
    record_b_id: int
    score: float
    review_result: Optional[str] = None
    generated_at: datetime
    
    # Optional nested records for rich display
    record_a: Optional[RecordResponse] = None
    record_b: Optional[RecordResponse] = None

    class Config:
        from_attributes = True
