from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class GraphPreference(Base):
    __tablename__ = "graph_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, index=True)
    theme = Column(String, default="dark")
    layout_type = Column(String, default="radial")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=func.now())
