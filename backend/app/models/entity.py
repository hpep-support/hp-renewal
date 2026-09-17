from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Entity(Base):
    __tablename__ = "entities"
    __table_args__ = (
        UniqueConstraint('community_id', 'name', name='uix_community_id_name'),
    )

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    entity_type = Column(String, default="person") # "person", "project", "organization", "unknown"
    degree = Column(Integer, default=0)
    merged_into_id = Column(Integer, nullable=True) # for alias resolution

    # Hermes Agent Extensions
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    info_date = Column(DateTime(timezone=True), nullable=True)
    confidence = Column(Float, default=1.0)
    external_enrichment_opt_in = Column(Boolean, default=False)

    community = relationship("Community")
