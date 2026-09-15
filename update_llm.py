import re

with open('backend/app/core/llm.py', 'r') as f:
    content = f.read()

prompt_update = """
        Return ONLY a raw JSON array of objects representing these relationships. Do not include markdown formatting or backticks.
        Each object must have exactly six keys: "source", "source_type", "target", "target_type", "type", and "event".
        - "source": The FULL name of the Person/Organization
        - "source_type": The type of the source entity. MUST be one of "person", "project", "organization", "other".
        - "target": The FULL name of the Project, Organization, or other Person they are related to
        - "target_type": The type of the target entity. MUST be one of "person", "project", "organization", "other".
        - "type": MUST be one of "actual", "potential", or "bridge". 
            - "actual": They have explicitly collaborated, actually worked together, or belong to the same specific project/organization.
            - "potential": They share similar roles, have common themes, or represent a potential synergy/resonance without explicit past collaboration.
            - "bridge": The "source" person explicitly introduced, connected, or bridged the "target" person to someone else or to a project. (e.g. if C introduces A and B, output {source: C, target: A, type: bridge} and {source: C, target: B, type: bridge}).
        - "event": If the relationship or bridge was triggered by a specific event, meeting, or context mentioned in the text (e.g., "Web3 Conference", "Weekly Sync"), include it here. Otherwise, use null or an empty string.
        
        Example output format:
        [
          {{"source": "Alice", "source_type": "person", "target": "DAOプロジェクト", "target_type": "project", "type": "actual", "event": ""}},
          {{"source": "Bob", "source_type": "person", "target": "Ethereum財団", "target_type": "organization", "type": "actual", "event": ""}},
          {{"source": "Alice", "source_type": "person", "target": "Charlie", "target_type": "person", "type": "potential", "event": ""}},
          {{"source": "Mateo Rios", "source_type": "person", "target": "Alice", "target_type": "person", "type": "bridge", "event": "Web3 Conference"}}
        ]
"""

content = re.sub(r'        Return ONLY a raw JSON array of objects.*?        \]\n', prompt_update.lstrip('\n').replace('\\', '\\\\'), content, flags=re.DOTALL)

with open('backend/app/core/llm.py', 'w') as f:
    f.write(content)

