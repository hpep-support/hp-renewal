from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Context(Base):
    __tablename__ = "contexts"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    context_type = Column(String(20), nullable=False) # 'asis' or 'tobe'
    resource_url = Column(String(500), nullable=True)
    extracted_entities = Column(String(1000), nullable=True)
    
    # Hermes Agent Extensions
    info_date = Column(DateTime(timezone=True), nullable=True)
    info_date_source = Column(String(50), default="unknown")
    revision = Column(Integer, default=1)
    source_agent = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User")
    community = relationship("Community")
