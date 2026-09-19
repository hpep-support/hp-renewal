import json
from datetime import datetime
from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.models.context import Context
from app.models.entity import Entity
from app.models.triple import Triple
from app.models.agent_proposal import AgentProposal
from app.services.agents.base import BaseAgent, apply_proposal_to_db
from app.services.agents.time_resolver import TimeResolverAgent
from app.services.agents.error_corrector import ErrorCorrectorAgent
from app.services.agents.discovery_crawler import DiscoveryCrawlerAgent
from app.services.agents.pooling import PoolingAgent

def run_tests():
    db = SessionLocal()
    print("=== Starting Hermes Agents Verification Tests ===")

    try:
        # 1. Setup Test User
        user = db.query(User).filter(User.email == "test_hermes@example.com").first()
        if not user:
            user = User(display_name="Hermes Tester", email="test_hermes@example.com", password_hash="dummy", role="owner")
            db.add(user)
            db.commit()
            db.refresh(user)
        print(f"1. Verified test user: {user.id}")

        # 2. Test Time Resolver
        ctx_date = Context(
            owner_id=user.id,
            body="2026年9月15日に株式会社Edge Creatorsの定例ミーティングを開催しました。",
            context_type="asis"
        )
        db.add(ctx_date)
        db.commit()
        db.refresh(ctx_date)

        # Directly test TimeResolver proposal creation & auto-apply
        time_proposal_data = {
            "proposal_type": "update_date",
            "target_context_id": ctx_date.id,
            "current_value": json.dumps({"info_date": None}),
            "proposed_value": json.dumps({"info_date": "2026-09-15T10:00:00Z", "info_date_source": "explicit"}),
            "reasoning": "Explicit date found in text",
            "confidence": 0.95
        }
        tr_agent = TimeResolverAgent(db)
        prop_tr = tr_agent.submit_proposal(time_proposal_data)
        assert prop_tr.status == "auto_applied", f"Expected auto_applied, got {prop_tr.status}"
        
        # Verify Context was updated in DB
        db.refresh(ctx_date)
        assert ctx_date.info_date is not None, "Context info_date was not updated"
        print(f"2. Time Resolver test PASSED: Auto-applied date {ctx_date.info_date}")

        # 3. Test Error Corrector & Entity Merge
        ent1 = Entity(name="東京大学", type="Organization", context_id=ctx_date.id)
        ent2 = Entity(name="東大", type="Organization", context_id=ctx_date.id)
        db.add_all([ent1, ent2])
        db.commit()
        db.refresh(ent1)
        db.refresh(ent2)

        # Create a triple referencing ent2 (the duplicate)
        triple = Triple(subject_id=ent2.id, predicate="研究提携", object_id=ent1.id, context_id=ctx_date.id)
        db.add(triple)
        db.commit()
        db.refresh(triple)

        error_proposal_data = {
            "proposal_type": "fix_entity",
            "target_entity_id": ent2.id,
            "current_value": json.dumps({"name": ent2.name, "entity_type": ent2.type}),
            "proposed_value": json.dumps({"action": "merge_into", "canonical_entity_id": ent1.id, "canonical_name": ent1.name}),
            "reasoning": "東大は東京大学の略称",
            "confidence": 0.85
        }
        ec_agent = ErrorCorrectorAgent(db)
        prop_ec = ec_agent.submit_proposal(error_proposal_data)
        assert prop_ec.status == "pending", f"Expected pending, got {prop_ec.status}"

        # Approve proposal
        success = apply_proposal_to_db(db, prop_ec, reviewer_id=user.id)
        assert success is True, "Failed to apply fix_entity proposal"
        db.refresh(ent2)
        assert ent2.merged_into_id == ent1.id, "Entity merged_into_id not set"
        
        db.refresh(triple)
        assert triple.subject_id == ent1.id, f"Triple subject was not merged: {triple.subject_id}"
        print("3. Error Corrector & Entity Merge test PASSED")

        # 4. Test Discovery Crawler Privacy Guardrail (Opt-in)
        p_no_optin = Entity(name="プライベート太郎", type="Person", external_enrichment_opt_in=False, context_id=ctx_date.id)
        p_optin = Entity(name="パブリック次郎", type="Person", external_enrichment_opt_in=True, context_id=ctx_date.id)
        org = Entity(name="オープンAIラボ", type="Organization", context_id=ctx_date.id)
        db.add_all([p_no_optin, p_optin, org])
        db.commit()

        crawler = DiscoveryCrawlerAgent(db)
        targets = crawler.gather_targets()
        target_ids = [t.id for t in targets]

        assert p_no_optin.id not in target_ids, "Privacy breach: Person without opt-in was targeted!"
        assert p_optin.id in target_ids, "Opt-in person was not targeted"
        assert org.id in target_ids, "Organization was not targeted"
        print("4. Discovery Crawler Privacy Guardrail (Opt-in) test PASSED")

        # 5. Test Pooling Agent
        pooling_agent = PoolingAgent(db)
        targets = pooling_agent.gather_targets()
        assert len(targets) > 0, "No targets gathered for pooling"
        print("5. Pooling Agent target gathering test PASSED")

        print("=== ALL HERMES TESTS PASSED SUCCESSFULLY! ===")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
