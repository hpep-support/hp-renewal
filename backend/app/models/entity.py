from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Entity(Base):
    __tablename__ = "entities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    entity_type = Column(String, default="person") # "person", "project", "organization", "unknown"
    degree = Column(Integer, default=0)
    merged_into_id = Column(Integer, nullable=True) # for alias resolution
