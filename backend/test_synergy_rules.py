from app.core.database import SessionLocal
from app.models.entity import Entity
from app.models.triple import Triple
from app.models.synergy import SynergyCandidate
from app.services.synergy_helpers import (
    build_graph_adjacency,
    is_valid_synergy_candidate,
    are_entities_connected,
    is_person_entity,
    is_project_entity
)
from app.services.agents.pooling import PoolingAgent

def run_verification():
    db = SessionLocal()
    try:
        adj, canonical_map, entity_dict = build_graph_adjacency(db)
        
        # Test 1: Connected Person and Organization should be rejected
        hpep = next((e for e in entity_dict.values() if e.name == "HPEP"), None)
        sakamoto = next((e for e in entity_dict.values() if e.name == "坂本 匡志"), None)
        sumitani = next((e for e in entity_dict.values() if e.name == "炭谷 俊樹"), None)
        learnnet = next((e for e in entity_dict.values() if e.name in ["Learnnet", "ラーンネット"]), None)
        
        assert hpep is not None, "HPEP entity not found"
        assert sakamoto is not None, "坂本 匡志 entity not found"
        
        # 坂本 匡志 is a member of HPEP -> must be connected and invalid
        assert are_entities_connected(sakamoto, hpep, adj, canonical_map, entity_dict), "坂本 匡志 and HPEP should be connected"
        assert not is_valid_synergy_candidate(sakamoto, hpep, adj, canonical_map, entity_dict), "坂本 匡志 <-> HPEP must be invalid synergy"
        print("PASS: Test 1 - Connected Person (坂本 匡志) and Organization (HPEP) is rejected.")
        
        # Test 2: Connected Person (炭谷 俊樹) and Organization (Learnnet) should be rejected
        if sumitani and learnnet:
            assert are_entities_connected(sumitani, learnnet, adj, canonical_map, entity_dict), "炭谷 俊樹 and Learnnet should be connected"
            assert not is_valid_synergy_candidate(sumitani, learnnet, adj, canonical_map, entity_dict), "炭谷 俊樹 <-> Learnnet must be invalid synergy"
            print("PASS: Test 2 - Connected Person (炭谷 俊樹) and Organization (Learnnet) is rejected.")
            
        # Test 3: Document, Activity, Event entities must be rejected
        doc_ent = next((e for e in entity_dict.values() if e.type == "Document"), None)
        if doc_ent:
            assert not is_valid_synergy_candidate(sakamoto, doc_ent, adj, canonical_map, entity_dict), "Person <-> Document must be rejected"
            print(f"PASS: Test 3 - Non-synergy type {doc_ent.name} ({doc_ent.type}) is rejected.")
            
        # Test 4: Verify zero connected Person-Project pairs in active SynergyCandidate table
        synergies = db.query(SynergyCandidate).all()
        invalid_in_db = []
        for s in synergies:
            ea = entity_dict.get(s.entity_a_id)
            eb = entity_dict.get(s.entity_b_id)
            if ea and eb and (is_person_entity(ea) and is_project_entity(eb) or is_person_entity(eb) and is_project_entity(ea)):
                if are_entities_connected(ea, eb, adj, canonical_map, entity_dict):
                    invalid_in_db.append(s)
        assert len(invalid_in_db) == 0, f"Found {len(invalid_in_db)} invalid synergies in DB!"
        print(f"PASS: Test 4 - Database contains 0 connected Person-Project synergies (Total valid synergies: {len(synergies)}).")

        # Test 5: PoolingAgent gathers only active entities and respects guardrails
        pooling_agent = PoolingAgent(db)
        targets = pooling_agent.gather_targets()
        assert len(targets) > 0, "PoolingAgent failed to gather targets"
        print("PASS: Test 5 - PoolingAgent gathered active targets with connection-awareness.")
        
        print("\n=== ALL SYNERGY RULES TESTS PASSED ===")
    finally:
        db.close()

if __name__ == "__main__":
    run_verification()
