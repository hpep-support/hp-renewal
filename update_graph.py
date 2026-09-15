import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace('import dynamic from "next/dynamic";', 'import dynamic from "next/dynamic";\nimport * as d3 from "d3-force";')

# Update node data processing
node_data_process = """
    // Add central DAO node
    nodes.push({ id: "dao", name: "DAO Core", val: 20, color: "#4f46e5", timestamp: 0 });

    contexts.forEach((ctx, i) => {
      const isAsIs = ctx.context_type === "asis";
      const nodeId = `ctx-${ctx.id}`;
      const timestamp = ctx.created_at ? new Date(ctx.created_at).getTime() : Date.now();
      
      nodes.push({
        id: nodeId,
        name: isAsIs ? `As-Is: ${ctx.body.substring(0, 15)}...` : `To-Be: ${ctx.body.substring(0, 15)}...`,
        val: 10,
        color: isAsIs ? "#1e293b" : "#4338ca",
        url: ctx.resource_url,
        timestamp
      });

      // Link context to DAO core
      links.push({
        source: "dao",
        target: nodeId,
        type: "actual"
      });

      // Entity Extraction (Using LLM extracted JSON relationships from backend)
      let relationships: {source: string, target: string, type?: string}[] = [];
      
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
        const relType = rel.type === "potential" ? "potential" : "actual";

        const srcNodeId = `entity-${srcName}`;
        const tgtNodeId = `entity-${tgtName}`;

        // Add Source Node (typically a Person)
        let srcNode = nodes.find((n) => n.id === srcNodeId);
        if (!srcNode) {
          const isPerson = srcName.endsWith("氏") || srcName.length <= 4;
          srcNode = { 
            id: srcNodeId, 
            name: srcName, 
            val: isPerson ? 4 : 7, 
            color: isPerson ? "#0ea5e9" : "#14b8a6",
            timestamp
          };
          nodes.push(srcNode);
        } else {
          srcNode.timestamp = Math.max(srcNode.timestamp || 0, timestamp);
        }

        // Add Target Node (typically a Project)
        let tgtNode = nodes.find((n) => n.id === tgtNodeId);
        if (!tgtNode) {
          const isPerson = tgtName.endsWith("氏") || tgtName.length <= 4;
          tgtNode = { 
            id: tgtNodeId, 
            name: tgtName, 
            val: isPerson ? 4 : 7, 
            color: isPerson ? "#0ea5e9" : "#14b8a6",
            timestamp
          };
          nodes.push(tgtNode);
        } else {
          tgtNode.timestamp = Math.max(tgtNode.timestamp || 0, timestamp);
        }

        // Link Source -> Target (e.g. Person -> Project)
        links.push({
          source: srcNodeId,
          target: tgtNodeId,
          type: relType
        });

        // Link the Target (Project) back to the Context Node to root it in the graph
        links.push({
          source: nodeId,
          target: tgtNodeId,
          type: "actual"
        });
      });
    });
"""

import re
content = re.sub(r'// Add central DAO node.*?\n    \}\);\n', node_data_process.replace('\\', '\\\\'), content, flags=re.DOTALL)

# Add custom force layout to the end of the graph data processing
radial_force_logic = """
    setGraphData(newGraphData);
    
    // Kick the simulation to organize new nodes
    setTimeout(() => {
      if (fgRef.current && newGraphData.nodes.length > 0) {
        const timestamps = newGraphData.nodes.map(n => n.timestamp || 0).filter(t => t > 0);
        const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 1;
        const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        
        // Mark nodes as "new" if they are in the top 20% of timestamps or added in the last 24h
        const timeThreshold = maxTime - (24 * 60 * 60 * 1000);
        
        newGraphData.nodes.forEach(n => {
           n.isNew = (n.timestamp && n.timestamp >= timeThreshold && n.id !== "dao" && !n.id.startsWith("ctx-"));
        });
        
        // Apply radial force: Older nodes to center (r=50), newer nodes to edge (r=400)
        fgRef.current.d3Force('radial', d3.forceRadial(
          (d: any) => {
            if (d.id === "dao") return 0;
            if (!d.timestamp || maxTime === minTime) return 200;
            const ratio = (d.timestamp - minTime) / (maxTime - minTime);
            return 50 + (ratio * 400); // 50 to 450 radius
          }, 
          dimensions.width / 2, dimensions.height / 2
        ).strength(0.8));
        
        // Reduce standard collision/charge to let radial take effect
        fgRef.current.d3Force('charge').strength(-100);
        
        fgRef.current.d3ReheatSimulation();
      }
    }, 100);
"""
content = re.sub(r'setGraphData\(newGraphData\);.*?\}, \[contexts\]\);', radial_force_logic + '  }, [contexts, dimensions]);', content, flags=re.DOTALL)

# Update the JSX components
jsx_update = """
      <div className="w-full lg:w-2/3 glass-panel rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl relative" ref={containerRef}>
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(node: any) => {
            if (highlightNodes.has(node) || node === hoverNode) return "#facc15";
            return node.color;
          }}
          linkColor={(link: any) => highlightLinks.has(link) ? "#facc15" : "rgba(255,255,255,0.2)"}
          linkWidth={(link: any) => highlightLinks.has(link) ? 3 : 1}
          linkDirectionalParticles={(link: any) => link.type === "potential" ? 4 : 0}
          linkDirectionalParticleSpeed={(link: any) => link.type === "potential" ? 0.01 : 0}
          linkDirectionalParticleWidth={2}
          linkLineDash={(link: any) => link.type === "potential" ? [5, 5] : []}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            // Draw standard node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = (highlightNodes.has(node) || node === hoverNode) ? "#facc15" : node.color;
            ctx.fill();

            // Draw text
            const label = node.name;
            const fontSize = highlightNodes.has(node) ? 14 / globalScale : 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = highlightNodes.has(node) ? "#ffffff" : "rgba(255, 255, 255, 0.8)";
            ctx.fillText(label, node.x, node.y + node.val + fontSize);
            
            // Draw aura for new nodes
            if (node.isNew) {
               const time = Date.now() / 200;
               ctx.beginPath();
               ctx.arc(node.x, node.y, node.val + 2 + Math.abs(Math.sin(time)) * 3, 0, 2 * Math.PI, false);
               ctx.strokeStyle = "rgba(250, 204, 21, 0.6)"; // glowing yellow
               ctx.lineWidth = 1.5 / globalScale;
               ctx.stroke();
            }
          }}
          onNodeHover={(node: any) => {
            setHoverNode(node);
            if (node) updateHighlight(node);
            else {
              if (activeNodeName) {
                const targetNode = graphData.nodes.find(n => n.name === activeNodeName);
                if (targetNode) updateHighlight(targetNode);
              } else {
                setHighlightNodes(new Set());
                setHighlightLinks(new Set());
              }
            }
          }}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          onRenderFramePost={onRenderFramePost}
        />
"""
content = re.sub(r'<div className="w-full lg:w-2/3 glass-panel.*?/>', jsx_update.replace('\\', '\\\\'), content, flags=re.DOTALL)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)
