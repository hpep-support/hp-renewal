from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text, Boolean, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    type = Column(String(50), nullable=True) # e.g. "Person", "Organization", "Concept"
    context_id = Column(Integer, ForeignKey("contexts.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Hermes agent fields
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    info_date = Column(DateTime(timezone=True), nullable=True)
    confidence = Column(Float, default=1.0)
    external_enrichment_opt_in = Column(Boolean, default=False)
    created_by_agent = Column(String(50), nullable=True)
    merged_into_id = Column(Integer, ForeignKey("entities.id", ondelete="SET NULL"), nullable=True)

    context = relationship("Context")
    merged_into = relationship("Entity", remote_side=[id], foreign_keys=[merged_into_id])

    @property
    def entity_type(self):
        return self.type

    @entity_type.setter
    def entity_type(self, val):
        self.type = val
