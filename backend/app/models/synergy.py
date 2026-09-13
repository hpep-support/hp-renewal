from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class SynergyCandidate(Base):
    __tablename__ = "synergy_candidates"

    id = Column(Integer, primary_key=True, index=True)
    record_a_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    record_b_id = Column(Integer, ForeignKey("records.id"), nullable=False)
    score = Column(Float, nullable=False)
    review_result = Column(String(50), nullable=True) # e.g., 'useful', 'not_useful'
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    record_a = relationship("Record", foreign_keys=[record_a_id])
    record_b = relationship("Record", foreign_keys=[record_b_id])
