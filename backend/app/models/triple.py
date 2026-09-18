from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Triple(Base):
    __tablename__ = "triples"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    predicate = Column(String(255), nullable=False)
    object_id = Column(Integer, ForeignKey("entities.id", ondelete="CASCADE"), nullable=False)
    context_id = Column(Integer, ForeignKey("contexts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Entity", foreign_keys=[subject_id])
    object = relationship("Entity", foreign_keys=[object_id])
    context = relationship("Context")
