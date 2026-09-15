import re

with open('backend/app/api/routes/contexts.py', 'r') as f:
    content = f.read()

import_statement = "from .upsert_helper import upsert_entities_from_json\n"
if "upsert_helper" not in content:
    content = content.replace("import json", "import json\n" + import_statement)

# Update create_context
create_replacement = """
    db_context = Context(
        owner_id=current_user.id,
        body=context_in.body,
        context_type=context_in.context_type,
        resource_url=context_in.resource_url,
        extracted_entities=entities
    )
    db.add(db_context)
    db.commit()
    db.refresh(db_context)
    
    upsert_entities_from_json(db, entities)
    
    return db_context
"""
content = re.sub(r'\n    db_context = Context\(.*?\n    return db_context\n', create_replacement.replace('\\', '\\\\'), content, flags=re.DOTALL)

# Update update_context
update_replacement = """
    db_context.body = context_in.body
    db_context.context_type = context_in.context_type
    db_context.resource_url = context_in.resource_url
    db_context.extracted_entities = entities
    
    db.commit()
    db.refresh(db_context)
    
    upsert_entities_from_json(db, entities)
    
    return db_context
"""
content = re.sub(r'\n    db_context.body = context_in.body.*?\n    return db_context\n', update_replacement.replace('\\', '\\\\'), content, flags=re.DOTALL)


with open('backend/app/api/routes/contexts.py', 'w') as f:
    f.write(content)

