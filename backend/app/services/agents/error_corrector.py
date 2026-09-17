import json
from typing import List, Dict, Any
from app.models.entity import Entity
from app.services.agents.base import BaseAgent
from google import genai
from app.core.config import get_settings

class ErrorCorrectorAgent(BaseAgent):
    agent_type = "error_corrector"
    
    def gather_targets(self) -> List[Any]:
        # Gather all active entities
        entities = self.db.query(Entity).filter(Entity.merged_into_id == None).all()
        # Group by community (we'll just pass all for MVP if it's small, or group them)
        return [entities] # target is a list of all entities
        
    def analyze(self, target: List[Entity]) -> List[Dict[str, Any]]:
        if len(target) < 2:
            return []
            
        settings = get_settings()
        api_key = settings.gemini_api_key
        if not api_key or api_key == "your-gemini-api-key-here":
            return []
            
        # We only pass names and IDs to the LLM
        entity_list = [{"id": e.id, "name": e.name, "type": e.entity_type} for e in target]
        
        print(f"ErrorCorrector analyzing {len(entity_list)} entities for variants...")
            
        client = genai.Client(api_key=api_key)
        prompt = f"""
        Analyze the following list of entities and find any obvious duplicates or name variants.
        Examples of variants:
        - "山田 太郎" and "山田太郎" (spacing)
        - "東京大学" and "東大" (abbreviation)
        - "Keiko Kimura" and "木村恵子" (English/Japanese)
        
        Return ONLY a JSON array of objects representing merge proposals.
        Do not include markdown formatting or backticks.
        Each object must have:
        - "source_id": The ID of the entity that should be merged (usually the less formal or abbreviated one).
        - "target_id": The ID of the canonical entity it should be merged INTO.
        - "reason": A short explanation of why they are the same.
        
        If no duplicates are found, return exactly "[]".
        
        Entities:
        {json.dumps(entity_list, ensure_ascii=False)}
        """
        
        try:
            model_name = settings.gemini_model or "gemini-2.5-flash"
            response = client.models.generate_content(
                model=model_name,
                contents=[prompt],
            )
            result = response.text.strip()
            if result.startswith("```json"):
                result = result[7:]
            if result.endswith("```"):
                result = result[:-3]
            result = result.strip()
            
            if result and result != "[]":
                proposals_json = json.loads(result)
                proposals = []
                for p in proposals_json:
                    src_id = p.get("source_id")
                    tgt_id = p.get("target_id")
                    if src_id and tgt_id and src_id != tgt_id:
                        src_entity = next((e for e in target if e.id == src_id), None)
                        tgt_entity = next((e for e in target if e.id == tgt_id), None)
                        if src_entity and tgt_entity:
                            proposals.append({
                                "proposal_type": "fix_entity",
                                "target_entity_id": src_id,
                                "current_value": json.dumps({"name": src_entity.name, "entity_type": src_entity.entity_type}),
                                "proposed_value": json.dumps({"action": "merge_into", "canonical_entity_id": tgt_id, "canonical_name": tgt_entity.name}),
                                "reasoning": p.get("reason", "同一エンティティと推定されるため"),
                                "confidence": 0.8
                            })
                return proposals
        except Exception as e:
            print(f"Error in ErrorCorrector LLM call: {e}")
            
        return []

    def _apply_proposal(self, proposal):
        # Error Corrector proposals are NOT auto-applied. They require human review.
        pass
