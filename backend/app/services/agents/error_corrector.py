import json
import logging
from typing import List, Dict, Any
from app.models.entity import Entity
from app.services.agents.base import BaseAgent
from app.services.llm import call_llm

logger = logging.getLogger(__name__)

class ErrorCorrectorAgent(BaseAgent):
    agent_type = "error_corrector"
    
    def gather_targets(self) -> List[Any]:
        # Gather all active entities (not already merged)
        entities = self.db.query(Entity).filter(Entity.merged_into_id == None).all()
        if not entities:
            return []
        return [entities] # Pass list of entities as single batch
        
    def analyze(self, target: List[Entity]) -> List[Dict[str, Any]]:
        if len(target) < 2:
            return []
            
        entity_list = [{"id": e.id, "name": e.name, "type": e.type or "Concept"} for e in target]
        logger.info(f"ErrorCorrector analyzing {len(entity_list)} entities for variants/duplicates...")
            
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
        - "reason": A short explanation in Japanese of why they are the same.
        
        If no duplicates are found, return exactly "[]".
        
        Entities:
        {json.dumps(entity_list, ensure_ascii=False)}
        """
        
        try:
            result = call_llm(prompt)
            if not result:
                return []
            result = result.strip()
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
                            affects_person = src_entity.id if src_entity.type == "Person" else None
                            proposals.append({
                                "proposal_type": "fix_entity",
                                "target_entity_id": src_id,
                                "affects_person_id": affects_person,
                                "current_value": json.dumps({"name": src_entity.name, "entity_type": src_entity.type}),
                                "proposed_value": json.dumps({"action": "merge_into", "canonical_entity_id": tgt_id, "canonical_name": tgt_entity.name}),
                                "reasoning": p.get("reason", f"「{src_entity.name}」は「{tgt_entity.name}」の別名・表記揺れと推定されます。"),
                                "evidence_urls": "[]",
                                "confidence": 0.85
                            })
                return proposals
        except Exception as e:
            logger.error(f"Error in ErrorCorrector LLM call: {e}")
            
        return []
