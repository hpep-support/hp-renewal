import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.services.agents.base import BaseAgent
from app.models.agent_proposal import AgentProposal
import json

class DummyAgent(BaseAgent):
    agent_type = "dummy_agent"
    
    def gather_targets(self):
        # Return a dummy target list
        return [{"id": 999, "text": "This is a dummy context."}]
        
    def analyze(self, target):
        print(f"Analyzing target: {target['id']}")
        # Create a dummy proposal
        return [{
            "proposal_type": "update_date",
            "current_value": json.dumps({"info_date": None}),
            "proposed_value": json.dumps({"info_date": "2026-10-01T10:00:00Z", "info_date_source": "explicit"}),
            "reasoning": "Dummy analysis found a date.",
            "confidence": 0.5
        }]

def test_db_and_agent():
    print("Testing DB and BaseAgent...")
    db = SessionLocal()
    try:
        agent = DummyAgent(db)
        agent.run()
        
        # Verify the proposal was created
        proposals = db.query(AgentProposal).filter(AgentProposal.agent_type == "dummy_agent").all()
        print(f"Found {len(proposals)} proposals in DB.")
        for p in proposals:
            print(f" - ID: {p.id}, Type: {p.proposal_type}, Status: {p.status}, Reasoning: {p.reasoning}")
            
        print("Success! Phase 1 DB models and BaseAgent are working correctly.")
        
        # Cleanup
        db.query(AgentProposal).filter(AgentProposal.agent_type == "dummy_agent").delete()
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    test_db_and_agent()
