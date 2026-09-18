from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SynergyCandidateBase(BaseModel):
    context_a_id: int
    context_b_id: int
    score: float
    agent_type: Optional[str] = None
    reason: Optional[str] = None

class SynergyCandidateResponse(SynergyCandidateBase):
    id: int
    review_result: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True

class SynergyReview(BaseModel):
    review_result: str # "useful", "not_useful"
