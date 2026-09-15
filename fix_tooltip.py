import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

tooltip_replacement = """
      {/* Custom Tooltip rendered via DOM for hoverNode */}
      {hoverNode && (
        <div 
          className="absolute pointer-events-none bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs z-20"
          style={{
            top: '10px',
            right: '10px',
            maxWidth: '250px'
          }}
        >
          <div className="font-bold text-sm mb-1">{hoverNode.name}</div>
          <div className="text-slate-400 capitalize mb-1">{hoverNode.type}</div>
          {hoverNode.degree !== undefined && <div className="mb-2">Connections: {hoverNode.degree}</div>}
          
          {(() => {
            const relatedCtx = contexts.find(c => 
              c.body.includes(hoverNode.name) || 
              (c.extracted_entities && c.extracted_entities.includes(hoverNode.name))
            );
            if (relatedCtx) {
              const idx = relatedCtx.body.indexOf(hoverNode.name);
              let snippet = relatedCtx.body;
              if (idx !== -1) {
                const start = Math.max(0, idx - 20);
                const end = Math.min(relatedCtx.body.length, idx + hoverNode.name.length + 30);
                snippet = (start > 0 ? "..." : "") + relatedCtx.body.substring(start, end).replace(/\\n/g, ' ') + "...";
              } else {
                snippet = snippet.substring(0, 50).replace(/\\n/g, ' ') + "...";
              }
              return (
                <div className="mt-2 pt-2 border-t border-slate-700 text-slate-300 italic">
                  "{snippet}"
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}
"""
content = re.sub(r'      \{\/\* Custom Tooltip rendered via DOM for hoverNode \*\/.*?\n      \}\)', tooltip_replacement.lstrip('\n').replace('\\', '\\\\'), content, flags=re.DOTALL)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)

