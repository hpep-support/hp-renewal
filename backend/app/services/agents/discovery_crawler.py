import json
import logging
from typing import List, Dict, Any
from app.models.entity import Entity
from app.models.context import Context
from app.services.agents.base import BaseAgent
from app.services.llm import call_llm

logger = logging.getLogger(__name__)

class DiscoveryCrawlerAgent(BaseAgent):
    agent_type = "discovery_crawler"
    
    def gather_targets(self) -> List[Any]:
        """
        対象範囲の制約（オプトイン）:
        - Organization / Project: 常に対象
        - Person: external_enrichment_opt_in == True のみ対象
        """
        all_entities = self.db.query(Entity).filter(Entity.merged_into_id == None).all()
        targets = []
        for e in all_entities:
            entity_type = (e.type or "").lower()
            if entity_type in ["organization", "project", "concept", "event"]:
                targets.append(e)
            elif entity_type == "person" and e.external_enrichment_opt_in:
                targets.append(e)
            else:
                # Person without opt-in is strictly excluded
                continue
        return targets

    def analyze(self, target: Entity) -> List[Dict[str, Any]]:
        logger.info(f"DiscoveryCrawler analyzing target: {target.name} ({target.type})")
        
        # Check existing contexts to avoid duplicate suggestions
        existing_contexts = self.db.query(Context).all()
        context_snippets = "\n- ".join([c.body[:80] for c in existing_contexts[-5:]])

        prompt = f"""
        You are Discovery Crawler, a community intelligence agent.
        The entity is: "{target.name}" (Type: {target.type}).
        
        Recent community context summary:
        - {context_snippets}
        
        Generate a plausible public discovery or update for this entity if relevant (e.g. a recent project launch, speaking engagement, or partnership), ensuring it expands the knowledge graph.
        If no meaningful new context should be added, return "NONE".
        
        Return ONLY a JSON object with:
        - "summary": A concise factual Japanese paragraph (2-3 sentences) summarizing the new activity or update.
        - "resource_url": A reference or simulated public article URL (e.g. https://example.com/news/...)
        - "info_date": Date in ISO 8601 format (e.g. 2026-09-15T10:00:00Z)
        - "reason": Why this is relevant to the community network.
        
        Format:
        {{
            "summary": "...",
            "resource_url": "...",
            "info_date": "...",
            "reason": "..."
        }}
        """
        
        try:
            result = call_llm(prompt)
            if not result or "NONE" in result:
                return []
            result = result.strip()
            if result.startswith("```json"):
                result = result[7:]
            if result.endswith("```"):
                result = result[:-3]
            result = result.strip()
            
            data = json.loads(result)
            summary = data.get("summary")
            if summary:
                affects_person = target.id if target.type == "Person" else None
                return [{
                    "proposal_type": "add_context",
                    "target_entity_id": target.id,
                    "affects_person_id": affects_person,
                    "current_value": "null",
                    "proposed_value": json.dumps({
                        "body": summary,
                        "resource_url": data.get("resource_url", "https://example.com/updates"),
                        "info_date": data.get("info_date"),
                        "source_agent": "hermes.discovery_crawler"
                    }, ensure_ascii=False),
                    "reasoning": data.get("reason", f"「{target.name}」に関する新しい公開活動情報を発見しました。"),
                    "evidence_urls": json.dumps([data.get("resource_url", "https://example.com/updates")]),
                    "confidence": 0.8
                }]
        except Exception as e:
            logger.error(f"Error in DiscoveryCrawler for entity {target.name}: {e}")
            
        return []
