from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class AgentProposal(Base):
    __tablename__ = "agent_proposals"

    id = Column(Integer, primary_key=True, index=True)
    agent_type = Column(String(50), nullable=False) # "time_resolver", "error_corrector", "discovery_crawler"
    proposal_type = Column(String(50), nullable=False) # "update_date", "fix_entity", "fix_link", "add_context", "add_entity"
    target_entity_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    target_context_id = Column(Integer, ForeignKey("contexts.id"), nullable=True)
    affects_person_id = Column(Integer, ForeignKey("entities.id"), nullable=True)
    
    current_value = Column(Text, nullable=True) # JSON
    proposed_value = Column(Text, nullable=False) # JSON
    reasoning = Column(Text, nullable=False)
    evidence_urls = Column(Text, nullable=True) # JSON array of URLs
    
    status = Column(String(20), default="pending") # "pending", "approved", "rejected", "auto_applied"
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    target_entity = relationship("Entity", foreign_keys=[target_entity_id])
    target_context = relationship("Context")
    affects_person = relationship("Entity", foreign_keys=[affects_person_id])
    reviewer = relationship("User")
