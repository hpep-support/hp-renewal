import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Increase charge strength for hierarchical layout
content = content.replace("fgRef.current.d3Force('charge').strength(-200);", "fgRef.current.d3Force('charge').strength(-800);")
content = content.replace("fgRef.current.d3Force('charge').strength(-300);", "fgRef.current.d3Force('charge').strength(-600);")

# Update forceCollide function
collide_old = """        // Add a collide force to prevent label overlap
        fgRef.current.d3Force('collide', d3.forceCollide((n: any) => {
           // Estimate text width: ~6px per character + node radius
           const textWidth = n.name ? n.name.length * 6 : 0;
           return (n.val || 3) + textWidth / 2 + 5;
        }).strength(1));"""

collide_new = """        // Add a collide force to prevent label overlap
        fgRef.current.d3Force('collide', d3.forceCollide((n: any) => {
           // Estimate text width for Japanese characters (~12px per char) + padding
           const textWidth = n.name ? n.name.length * 14 : 0;
           return (n.val || 3) + textWidth / 2 + 10;
        }).strength(1));"""

content = content.replace(collide_old, collide_new)

# Also let's stagger labels for hierarchical layout
# In drawNode:
draw_node_old = """      ctx.fillText(label, node.x, node.y + r + 2);"""
draw_node_new = """      // Stagger vertical position in hierarchical layout to prevent overlaps
      const staggerOffset = (layoutType === 'hierarchical' && node.index % 2 === 1) ? 14 : 0;
      ctx.fillText(label, node.x, node.y + r + 4 + staggerOffset);"""

content = content.replace(draw_node_old, draw_node_new)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)

