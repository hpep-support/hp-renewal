import json
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.agent_proposal import AgentProposal
from app.models.entity import Entity
from app.models.context import Context

class BaseAgent:
    agent_type: str = "base_agent"
    
    def __init__(self, db: Session):
        self.db = db
        
    def run(self):
        """メインの実行ループ"""
        targets = self.gather_targets()
        for target in targets:
            proposals = self.analyze(target)
            for proposal_data in proposals:
                self.submit_proposal(proposal_data)
                
    def gather_targets(self) -> List[Any]:
        """処理対象を収集"""
        raise NotImplementedError("Subclasses must implement gather_targets")
        
    def analyze(self, target: Any) -> List[Dict[str, Any]]:
        """
        対象を分析し、提案データ(dict)のリストを生成する
        返すべき形式の例:
        {
            "proposal_type": "update_date",
            "target_entity_id": 42, # optional
            "target_context_id": 1, # optional
            "affects_person_id": 42, # optional
            "current_value": json.dumps({"info_date": None}),
            "proposed_value": json.dumps({"info_date": "2026-08-25T08:32:00+09:00", "info_date_source": "explicit"}),
            "reasoning": "本文中に 'August 25 at 8:32 AM' という日付表現を検出しました。",
            "evidence_urls": "[]",
            "confidence": 0.95
        }
        """
        raise NotImplementedError("Subclasses must implement analyze")
        
    def submit_proposal(self, proposal_data: Dict[str, Any]):
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
            reasoning=proposal_data.get("reasoning"),
            evidence_urls=proposal_data.get("evidence_urls", "[]")
        )
        
        # 自動適用の基準: 
        # Time Resolverのエージェントかつ、確信度が0.9以上 (明示的な日付) なら自動適用
        if self.agent_type == "time_resolver" and confidence >= 0.9:
            proposal.status = "auto_applied"
            # TODO: 自動適用の場合は即座に対象モデル（Context等）を更新するロジックを呼ぶ
            self._apply_proposal(proposal)
        else:
            proposal.status = "pending"
            
        self.db.add(proposal)
        self.db.commit()
        self.db.refresh(proposal)
        
        # 本人への通知判定 (affects_person_id がある場合)
        if proposal.affects_person_id:
            self.notify_subject(proposal.affects_person_id, proposal.id)
            
        return proposal
        
    def _apply_proposal(self, proposal: AgentProposal):
        """自動適用された提案を実際のDBモデルに反映させる（サブクラスまたは専用サービスで処理）"""
        pass
        
    def notify_subject(self, person_entity_id: int, proposal_id: int):
        """対象人物への通知 (MVPではログ出力のみ)"""
        print(f"🔔 [Notification] To Entity ID {person_entity_id}: New Hermes proposal ({proposal_id}) affects you.")
