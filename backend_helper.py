import re

with open('frontend/src/app/dashboard/context/page.tsx', 'r') as f:
    content = f.read()

# We need to insert a helper function outside the component or at the top of the component.
# Let's insert it inside the component, before the return statement.
helper_code = """
  const renderContextBody = (body: string, extractedEntitiesStr: string, selectedEntity: string | null) => {
    let entities: string[] = [];
    if (extractedEntitiesStr && extractedEntitiesStr !== "[]") {
      try {
        const relationships = JSON.parse(extractedEntitiesStr);
        const uniqueEntities = new Set<string>();
        relationships.forEach((rel: any) => {
          if (rel.source) uniqueEntities.add(rel.source);
          if (rel.target) uniqueEntities.add(rel.target);
        });
        // Sort by length descending to match longest names first
        entities = Array.from(uniqueEntities).sort((a, b) => b.length - a.length);
      } catch (e) {
        console.error("Failed to parse entities for highlighting");
      }
    }

    if (entities.length === 0 && !selectedEntity) {
      return body;
    }

    if (entities.length === 0 && selectedEntity) {
      entities = [selectedEntity];
    }

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
    const regexPattern = new RegExp(`(${entities.map(escapeRegExp).join('|')})`, 'gi');
    
    return body.split(regexPattern).map((part: string, i: number) => {
      const matchedEntity = entities.find(e => e.toLowerCase() === part.toLowerCase());
      if (matchedEntity) {
        const isSelected = selectedEntity && matchedEntity.toLowerCase() === selectedEntity.toLowerCase();
        return (
          <span 
            key={i} 
            onClick={() => handleNodeSelect(matchedEntity)}
            className={`cursor-pointer rounded px-1 -mx-1 border font-medium transition-colors ${
              isSelected 
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' 
                : 'bg-slate-700/50 text-indigo-300 border-slate-600 hover:bg-slate-700 hover:text-indigo-200'
            }`}
            title={`Show ${matchedEntity} in graph`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
"""

content = content.replace("  return (\n    <div", helper_code + "    <div")

# Now replace the rendering block inside the JSX
render_block_old = """                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedEntity ? (
                        context.body.split(new RegExp(`(${selectedEntity})`, 'gi')).map((part: string, i: number) => 
                          part.toLowerCase() === selectedEntity.toLowerCase() ? (
                            <span key={i} className="bg-teal-500/20 text-teal-300 rounded px-1 -mx-1 border border-teal-500/30 font-medium">
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        )
                      ) : (
                        context.body
                      )}
                    </p>"""

render_block_new = """                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {renderContextBody(context.body, context.extracted_entities, selectedEntity)}
                    </p>"""

content = content.replace(render_block_old, render_block_new)

with open('frontend/src/app/dashboard/context/page.tsx', 'w') as f:
    f.write(content)

