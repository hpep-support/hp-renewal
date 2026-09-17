from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Triple(Base):
    __tablename__ = "triples"

    id = Column(Integer, primary_key=True, index=True)
    context_id = Column(Integer, ForeignKey("contexts.id"), nullable=False)
    
    subject_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=False)
    predicate = Column(String(100), nullable=False)
    
    object_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    object_literal = Column(String(255), nullable=True)
    
    info_date = Column(DateTime(timezone=True), nullable=True)
    confidence = Column(Float, default=1.0)
    source_agent = Column(String(50), nullable=False, default="user")
    revision = Column(Integer, default=1)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    context = relationship("Context")
    subject_entity = relationship("Entity", foreign_keys=[subject_entity_id])
    object_entity = relationship("Entity", foreign_keys=[object_entity_id])
