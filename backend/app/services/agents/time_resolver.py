import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.context import Context
from app.services.agents.base import BaseAgent
from google import genai
from app.core.config import get_settings
from datetime import datetime

class TimeResolverAgent(BaseAgent):
    agent_type = "time_resolver"
    
    def gather_targets(self) -> List[Any]:
        # Target: Contexts where info_date is NULL
        contexts = self.db.query(Context).filter(Context.info_date == None).all()
        return contexts
        
    def analyze(self, target: Context) -> List[Dict[str, Any]]:
        settings = get_settings()
        api_key = settings.gemini_api_key
        if not api_key or api_key == "your-gemini-api-key-here":
            return []
            
        print(f"TimeResolver analyzing Context #{target.id}: {target.body[:50]}...")
            
        client = genai.Client(api_key=api_key)
        prompt = f"""
        Analyze the following text and extract any explicit DATE mentioned in the text.
        If you find a date, return it in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ).
        If no explicit date is mentioned, return the string "NONE".
        Do not explain, just return the ISO 8601 string or "NONE".
        
        Text: {target.body}
        """
        
        try:
            model_name = settings.gemini_model or "gemini-2.5-flash"
            response = client.models.generate_content(
                model=model_name,
                contents=[prompt],
            )
            result = response.text.strip()
            
            if result and result != "NONE" and "T" in result:
                return [{
                    "proposal_type": "update_date",
                    "target_context_id": target.id,
                    "current_value": json.dumps({"info_date": None}),
                    "proposed_value": json.dumps({"info_date": result, "info_date_source": "explicit"}),
                    "reasoning": f"Found explicit date in text: {result}",
                    "confidence": 0.95
                }]
        except Exception as e:
            print(f"Error in TimeResolver LLM call: {e}")
            
        return []

    def _apply_proposal(self, proposal):
        # Auto-apply logic
        if proposal.proposal_type == "update_date" and proposal.target_context_id:
            context = self.db.query(Context).filter(Context.id == proposal.target_context_id).first()
            if context:
                val = json.loads(proposal.proposed_value)
                date_str = val.get("info_date")
                if date_str:
                    try:
                        # Handle ISO format with Z
                        if date_str.endswith('Z'):
                            date_str = date_str[:-1] + '+00:00'
                        context.info_date = datetime.fromisoformat(date_str)
                    except ValueError as e:
                        print(f"Error parsing date {date_str}: {e}")
                        return
                
                context.info_date_source = val.get("info_date_source")
                context.source_agent = "hermes.time_resolver"
                self.db.add(context)
                self.db.commit()
                print(f"✅ Auto-applied date {context.info_date} to Context #{context.id}")
