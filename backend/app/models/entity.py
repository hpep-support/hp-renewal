from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
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

    community = relationship("Community")
