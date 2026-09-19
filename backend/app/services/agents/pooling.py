import json
import logging
from typing import List, Dict, Any
from app.models.entity import Entity
from app.models.context import Context
from app.models.triple import Triple
from app.services.agents.base import BaseAgent
from app.services.llm import call_llm

logger = logging.getLogger(__name__)

class PoolingAgent(BaseAgent):
    agent_type = "pooling"

    def gather_targets(self) -> List[Any]:
        # Gather active entities with their associated context info
        entities = self.db.query(Entity).filter(Entity.merged_into_id == None).all()
        if len(entities) < 2:
            return []
        return [entities]

    def analyze(self, target: List[Entity]) -> List[Dict[str, Any]]:
        if len(target) < 2:
            return []

        entity_list = [{"id": e.id, "name": e.name, "type": e.type or "Concept"} for e in target]
        logger.info(f"PoolingAgent analyzing {len(entity_list)} entities for resource & synergy pooling...")

        prompt = f"""
        You are the Hermes Pooling Engine.
        Your role is to discover complementary skills, shared problem areas, or resource pooling opportunities between members and projects.
        
        Analyze the following entities:
        {json.dumps(entity_list, ensure_ascii=False)}
        
        Identify up to 2 high-potential pooling or collaboration matches between distinct entities.
        
        Return ONLY a JSON array of objects with:
        - "entity_a_id": ID of first entity
        - "entity_b_id": ID of second entity
        - "pool_theme": A concise theme in Japanese (e.g. "ものづくり教育と探究実践の連携", "地域健康経営イニシアチブ")
        - "reason": A detailed reason why pooling their resources/capabilities produces synergy.
        
        If no strong pooling matches are found, return "[]".
        """

        try:
            result = call_llm(prompt)
            if not result or result.strip() == "[]":
                return []
            result = result.strip()
            if result.startswith("```json"):
                result = result[7:]
            if result.endswith("```"):
                result = result[:-3]
            result = result.strip()

            matches = json.loads(result)
            proposals = []
            for m in matches:
                a_id = m.get("entity_a_id")
                b_id = m.get("entity_b_id")
                if a_id and b_id and a_id != b_id:
                    ent_a = next((e for e in target if e.id == a_id), None)
                    ent_b = next((e for e in target if e.id == b_id), None)
                    if ent_a and ent_b:
                        theme = m.get("pool_theme", "協業・プーリング候補")
                        reason = m.get("reason", "補完的な強みとシナジーが期待されるため")
                        affects_person = ent_a.id if ent_a.type == "Person" else (ent_b.id if ent_b.type == "Person" else None)
                        proposals.append({
                            "proposal_type": "match_pooling",
                            "target_entity_id": ent_a.id,
                            "affects_person_id": affects_person,
                            "current_value": "null",
                            "proposed_value": json.dumps({
                                "entity_a_id": ent_a.id,
                                "entity_a_name": ent_a.name,
                                "entity_b_id": ent_b.id,
                                "entity_b_name": ent_b.name,
                                "theme": theme
                            }, ensure_ascii=False),
                            "reasoning": f"【プーリング提案: {theme}】{reason}",
                            "evidence_urls": "[]",
                            "confidence": 0.85
                        })
            return proposals
        except Exception as e:
            logger.error(f"Error in PoolingAgent: {e}")
            return []
