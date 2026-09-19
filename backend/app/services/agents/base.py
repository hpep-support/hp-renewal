import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.agent_proposal import AgentProposal
from app.models.entity import Entity
from app.models.context import Context
from app.models.triple import Triple

logger = logging.getLogger(__name__)

def apply_proposal_to_db(db: Session, proposal: AgentProposal, reviewer_id: Optional[int] = None) -> bool:
    """承認または自動適用された提案を実際のDBテーブルに反映する"""
    try:
        if proposal.proposal_type == "update_date":
            if proposal.target_context_id:
                ctx = db.query(Context).filter(Context.id == proposal.target_context_id).first()
                if ctx:
                    val = json.loads(proposal.proposed_value)
                    date_str = val.get("info_date")
                    if date_str:
                        if date_str.endswith('Z'):
                            date_str = date_str[:-1] + '+00:00'
                        ctx.info_date = datetime.fromisoformat(date_str)
                    ctx.info_date_source = val.get("info_date_source", "explicit")
                    ctx.source_agent = f"hermes.{proposal.agent_type}"
                    ctx.revision = (ctx.revision or 1) + 1
                    db.add(ctx)

        elif proposal.proposal_type == "fix_entity":
            # Merge entity into canonical entity
            val = json.loads(proposal.proposed_value)
            canonical_id = val.get("canonical_entity_id")
            src_id = proposal.target_entity_id
            if canonical_id and src_id and canonical_id != src_id:
                src_entity = db.query(Entity).filter(Entity.id == src_id).first()
                tgt_entity = db.query(Entity).filter(Entity.id == canonical_id).first()
                if src_entity and tgt_entity:
                    # Update triples referencing src_id
                    db.query(Triple).filter(Triple.subject_id == src_id).update({Triple.subject_id: canonical_id})
                    db.query(Triple).filter(Triple.object_id == src_id).update({Triple.object_id: canonical_id})
                    src_entity.merged_into_id = canonical_id
                    db.add(src_entity)

        elif proposal.proposal_type == "add_context":
            val = json.loads(proposal.proposed_value)
            body = val.get("body", "")
            resource_url = val.get("resource_url")
            info_date_str = val.get("info_date")
            info_date = None
            if info_date_str:
                try:
                    if info_date_str.endswith('Z'):
                        info_date_str = info_date_str[:-1] + '+00:00'
                    info_date = datetime.fromisoformat(info_date_str)
                except Exception:
                    pass

            # Context requires owner_id; use reviewer_id or 1 (admin/owner)
            owner_id = reviewer_id or 1
            new_ctx = Context(
                owner_id=owner_id,
                body=body,
                context_type="asis",
                resource_url=resource_url,
                info_date=info_date,
                info_date_source="explicit" if info_date else "unknown",
                source_agent=f"hermes.{proposal.agent_type}"
            )
            db.add(new_ctx)
            db.flush()

            # Automatically extract triples for the new context
            try:
                from app.services.agents.triple_extractor import extract_triples_from_context
                extract_triples_from_context(db, new_ctx)
            except Exception as e:
                logger.warning(f"Failed to auto-extract triples for proposal context: {e}")

        elif proposal.proposal_type == "match_pooling":
            # Handled via synergy candidate or pooling tags
            pass

        proposal.status = "approved" if proposal.status != "auto_applied" else "auto_applied"
        proposal.reviewed_at = datetime.now()
        if reviewer_id:
            proposal.reviewed_by = reviewer_id
        db.add(proposal)
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Error applying proposal {proposal.id}: {e}")
        db.rollback()
        return False


class BaseAgent:
    agent_type: str = "base_agent"
    
    def __init__(self, db: Session):
        self.db = db
        
    def run(self):
        """メインの実行ループ"""
        targets = self.gather_targets()
        created_proposals = []
        for target in targets:
            proposals = self.analyze(target)
            for proposal_data in proposals:
                p = self.submit_proposal(proposal_data)
                if p:
                    created_proposals.append(p)
        return created_proposals
                
    def gather_targets(self) -> List[Any]:
        """処理対象を収集"""
        raise NotImplementedError("Subclasses must implement gather_targets")
        
    def analyze(self, target: Any) -> List[Dict[str, Any]]:
        """対象を分析し、提案データ(dict)のリストを生成する"""
        raise NotImplementedError("Subclasses must implement analyze")
        
    def submit_proposal(self, proposal_data: Dict[str, Any]) -> Optional[AgentProposal]:
        """提案をDBに保存、自動適用条件を判定。"""
        confidence = proposal_data.pop("confidence", 0.0)
        
        proposal = AgentProposal(
            agent_type=self.agent_type,
            proposal_type=proposal_data.get("proposal_type"),
            target_entity_id=proposal_data.get("target_entity_id"),
            target_context_id=proposal_data.get("target_context_id"),
            affects_person_id=proposal_data.get("affects_person_id"),
            current_value=proposal_data.get("current_value"),
            proposed_value=proposal_data.get("proposed_value"),
            reasoning=proposal_data.get("reasoning", ""),
            evidence_urls=proposal_data.get("evidence_urls", "[]")
        )
        
        # 自動適用の基準: 
        # Time Resolverのエージェントかつ、確信度が0.9以上 (明示的な日付) なら自動適用
        if self.agent_type == "time_resolver" and confidence >= 0.9:
            proposal.status = "auto_applied"
            self.db.add(proposal)
            self.db.commit()
            self.db.refresh(proposal)
            apply_proposal_to_db(self.db, proposal)
        else:
            proposal.status = "pending"
            self.db.add(proposal)
            self.db.commit()
            self.db.refresh(proposal)
            
        # 本人への通知判定 (affects_person_id がある場合)
        if proposal.affects_person_id:
            self.notify_subject(proposal.affects_person_id, proposal.id)
            
        return proposal
        
    def notify_subject(self, person_entity_id: int, proposal_id: int):
        """対象人物への通知 (MVPではログ出力)"""
        logger.info(f"🔔 [Notification] To Entity ID {person_entity_id}: New Hermes proposal ({proposal_id}) affects you.")
