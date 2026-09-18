from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SynergyCandidate(Base):
    __tablename__ = "synergy_candidates"

    id = Column(Integer, primary_key=True, index=True)
    context_a_id = Column(Integer, ForeignKey("contexts.id"), nullable=False)
    context_b_id = Column(Integer, ForeignKey("contexts.id"), nullable=False)
    score = Column(Float, nullable=False)
    agent_type = Column(String(100), nullable=True)
    reason = Column(String, nullable=True)
    review_result = Column(String(50), nullable=True) # e.g., 'useful', 'not_useful'
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    context_a = relationship("Context", foreign_keys=[context_a_id])
    context_b = relationship("Context", foreign_keys=[context_b_id])
