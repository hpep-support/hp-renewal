from sqlalchemy import Column, Integer, Text, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Context(Base):
    __tablename__ = "contexts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    record_id = Column(Integer, ForeignKey("records.id"), nullable=True)
    body = Column(Text, nullable=False)
    context_type = Column(String(20), nullable=False) # 'asis' or 'tobe'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Hermes fields
    info_date = Column(DateTime(timezone=True), nullable=True)
    info_date_source = Column(String(50), nullable=True) # 'explicit', 'inferred', 'post_date', 'unknown'
    revision = Column(Integer, default=1)
    source_agent = Column(String(50), nullable=True)
    resource_url = Column(String(512), nullable=True)

    owner = relationship("User")
    record = relationship("Record")
