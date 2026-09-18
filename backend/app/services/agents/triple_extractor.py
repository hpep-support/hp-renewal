import json
import logging
from sqlalchemy.orm import Session
from app.models.context import Context
from app.models.entity import Entity
from app.models.triple import Triple
from app.services.llm import call_llm

logger = logging.getLogger(__name__)

TRIPLE_EXTRACTION_PROMPT = """You are an advanced knowledge graph extraction agent.
Your task is to extract Entities (Subjects and Objects) and their Relationships (Predicates) from the given text.

Extract the information as a list of Triples.
A Triple consists of:
- subject: The name of the entity acting as the subject.
- subject_type: The type of the subject entity (e.g. Person, Organization, Concept, Event, Location).
- predicate: The relationship or action connecting the subject and object (keep it concise, e.g. "participates in", "founded", "is a").
- object: The name of the entity acting as the object.
- object_type: The type of the object entity.

Return ONLY a valid JSON object in the following format, with no markdown formatting or extra text:
{{
    "triples": [
        {{
            "subject": "John Doe",
            "subject_type": "Person",
            "predicate": "works at",
            "object": "Acme Corp",
            "object_type": "Organization"
        }}
    ]
}}

Text to analyze:
"{text}"
"""

def extract_triples_from_context(db: Session, context: Context):
    try:
        prompt = TRIPLE_EXTRACTION_PROMPT.format(text=context.body)
        response_text = call_llm(prompt)
        
        # Clean up response if it has markdown formatting
        if response_text.startswith("```json"):
            response_text = response_text[7:-3].strip()
        elif response_text.startswith("```"):
            response_text = response_text[3:-3].strip()
            
        data = json.loads(response_text)
        triples_data = data.get("triples", [])
        
        # Keep track of created entities to avoid duplicates within the same context run
        # Wait, if we want a global knowledge graph, we should ideally reuse entities across contexts if names match.
        # For this MVP, let's just reuse within the DB by name.
        
        for t in triples_data:
            subj_name = t.get("subject", "").strip()
            subj_type = t.get("subject_type", "").strip()
            pred = t.get("predicate", "").strip()
            obj_name = t.get("object", "").strip()
            obj_type = t.get("object_type", "").strip()
            
            if not subj_name or not pred or not obj_name:
                continue
                
            # Get or create subject
            subj_entity = db.query(Entity).filter(Entity.name == subj_name).first()
            if not subj_entity:
                subj_entity = Entity(name=subj_name, type=subj_type, context_id=context.id)
                db.add(subj_entity)
                db.flush()
                
            # Get or create object
            obj_entity = db.query(Entity).filter(Entity.name == obj_name).first()
            if not obj_entity:
                obj_entity = Entity(name=obj_name, type=obj_type, context_id=context.id)
                db.add(obj_entity)
                db.flush()
                
            # Create triple
            triple = Triple(
                subject_id=subj_entity.id,
                predicate=pred,
                object_id=obj_entity.id,
                context_id=context.id
            )
            db.add(triple)
            
        db.commit()
        logger.info(f"Extracted {len(triples_data)} triples from Context ID {context.id}")
        
    except Exception as e:
        logger.error(f"Error extracting triples for context {context.id}: {str(e)}")
        db.rollback()
