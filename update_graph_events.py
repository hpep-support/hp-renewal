import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Update JSON parsing
json_parsing_update = """
      // Entity Extraction (Using LLM extracted JSON relationships from backend)
      let relationships: {source: string, target: string, type?: string, event?: string}[] = [];
      
      try {
        if (ctx.extracted_entities && ctx.extracted_entities !== "[]") {
          relationships = JSON.parse(ctx.extracted_entities);
        }
      } catch (err) {
        console.error("Failed to parse extracted entities JSON:", err);
      }

      // Limit relationships to avoid graph explosion
      const limitedRels = relationships.slice(0, 30);

      limitedRels.forEach((rel) => {
        if (!rel.source || !rel.target) return;
        
        const srcName = rel.source.trim();
        const tgtName = rel.target.trim();
        if (!srcName || !tgtName) return;
        const relType = rel.type || "actual";
        const relEvent = rel.event || "";
"""
content = re.sub(r'// Entity Extraction.*?const relType = rel.type === "potential" \? "potential" : "actual";', json_parsing_update.replace('\\', '\\\\'), content, flags=re.DOTALL)

# Add event to link push
link_push_update = """
        // Link Source -> Target (e.g. Person -> Project)
        links.push({
          source: srcNodeId,
          target: tgtNodeId,
          type: relType,
          event: relEvent
        });
"""
content = re.sub(r'// Link Source -> Target.*?\n        \}\);', link_push_update.replace('\\', '\\\\'), content, flags=re.DOTALL)


# Update linkColor and linkCanvasObject
jsx_update = """
          linkColor={(link: any) => {
            if (highlightLinks.has(link)) return "#facc15";
            if (link.type === "bridge") return "#f97316"; // orange for bridge
            return "rgba(255,255,255,0.2)";
          }}
          linkWidth={(link: any) => highlightLinks.has(link) || link.type === "bridge" ? 2 : 1}
          linkDirectionalParticles={(link: any) => link.type === "potential" ? 4 : (link.type === "bridge" ? 2 : 0)}
          linkDirectionalParticleSpeed={(link: any) => link.type === "potential" ? 0.01 : (link.type === "bridge" ? 0.02 : 0)}
          linkDirectionalParticleWidth={(link: any) => link.type === "bridge" ? 3 : 2}
          linkLineDash={(link: any) => link.type === "potential" ? [5, 5] : []}
          linkCanvasObjectMode={() => "after"}
          linkCanvasObject={(link: any, ctx, globalScale) => {
            if (link.event) {
              const start = link.source;
              const end = link.target;
              if (typeof start !== 'object' || typeof end !== 'object') return;
              
              const midX = start.x + (end.x - start.x) / 2;
              const midY = start.y + (end.y - start.y) / 2;
              
              const label = link.event;
              const fontSize = 8 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 

              ctx.fillStyle = 'rgba(249, 115, 22, 0.8)';
              ctx.fillRect(midX - bckgDimensions[0] / 2, midY - bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = 'white';
              ctx.fillText(label, midX, midY);
            }
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
"""
content = re.sub(r'          linkColor=\(.*?nodeCanvasObject=\{\(node: any, ctx, globalScale\) => \{', jsx_update.replace('\\', '\\\\'), content, flags=re.DOTALL)


with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)
