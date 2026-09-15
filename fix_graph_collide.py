import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# In the layout application block
layout_block_old = """        // Apply force layout based on layoutType
        if (layoutType === "radial") {
          fgRef.current.d3Force('radial', d3.forceRadial(
            (d: any) => {
              if (d.id === "dao") return 0;
              if (!d.timestamp || maxTime === minTime) return 200;
              const ratio = (d.timestamp - minTime) / (maxTime - minTime);
              return 50 + (ratio * 400); // 50 to 450 radius
            }, 
            dimensions.width / 2, dimensions.height / 2
          ).strength(0.8));
          fgRef.current.d3Force('charge').strength(-100);
        } else if (layoutType === "force") {
          fgRef.current.d3Force('radial', null);
          fgRef.current.d3Force('charge').strength(-300);
        } else if (layoutType === "hierarchical") {
          fgRef.current.d3Force('radial', null);
          fgRef.current.d3Force('charge').strength(-200);
        }"""

layout_block_new = """        // Apply force layout based on layoutType
        if (layoutType === "radial") {
          fgRef.current.d3Force('radial', d3.forceRadial(
            (d: any) => {
              if (d.id === "dao") return 0;
              if (!d.timestamp || maxTime === minTime) return 200;
              const ratio = (d.timestamp - minTime) / (maxTime - minTime);
              return 50 + (ratio * 400); // 50 to 450 radius
            }, 
            dimensions.width / 2, dimensions.height / 2
          ).strength(0.8));
          fgRef.current.d3Force('charge').strength(-100);
        } else if (layoutType === "force") {
          fgRef.current.d3Force('radial', null);
          fgRef.current.d3Force('charge').strength(-300);
        } else if (layoutType === "hierarchical") {
          fgRef.current.d3Force('radial', null);
          fgRef.current.d3Force('charge').strength(-200);
        }
        
        // Add a collide force to prevent label overlap
        fgRef.current.d3Force('collide', d3.forceCollide((n: any) => {
           // Estimate text width: ~6px per character + node radius
           const textWidth = n.name ? n.name.length * 6 : 0;
           return (n.val || 3) + textWidth / 2 + 5;
        }).strength(1));"""

content = content.replace(layout_block_old, layout_block_new)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)

