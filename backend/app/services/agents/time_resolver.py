import json
import logging
from typing import List, Dict, Any
from app.models.context import Context
from app.services.agents.base import BaseAgent
from app.services.llm import call_llm

logger = logging.getLogger(__name__)

class TimeResolverAgent(BaseAgent):
    agent_type = "time_resolver"
    
    def gather_targets(self) -> List[Any]:
        # Target: Contexts where info_date is NULL
        contexts = self.db.query(Context).filter(Context.info_date == None).all()
        return contexts
        
    def analyze(self, target: Context) -> List[Dict[str, Any]]:
        logger.info(f"TimeResolver analyzing Context #{target.id}: {target.body[:50]}...")
            
        prompt = f"""
        Analyze the following text and extract any explicit DATE or DATE-TIME mentioned in the text.
        If you find a date, return it in ISO 8601 format (e.g., 2026-08-25T08:32:00Z or 2026-08-25T00:00:00Z).
        If no explicit date is mentioned, return the string "NONE".
        Do not explain, just return the ISO 8601 string or "NONE".
        
        Text:
        {target.body}
        """
        
        try:
            result = call_llm(prompt)
            if not result:
                return []
            result = result.strip().strip('"').strip("'")
            if result.startswith("```"):
                result = result.split("\n")[1].strip()
            
            if result and result != "NONE" and "T" in result:
                return [{
                    "proposal_type": "update_date",
                    "target_context_id": target.id,
                    "current_value": json.dumps({"info_date": None}),
                    "proposed_value": json.dumps({"info_date": result, "info_date_source": "explicit"}),
                    "reasoning": f"本文中に明示的な日付表現を検出しました: {result}",
                    "confidence": 0.95
                }]
        except Exception as e:
            logger.error(f"Error in TimeResolver LLM call: {e}")
            
        return []
