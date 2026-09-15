import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Fix DAG level distance
content = content.replace("dagLevelDistance={layoutType === \"hierarchical\" ? 60 : undefined}", "dagLevelDistance={layoutType === \"hierarchical\" ? 100 : undefined}")

# Fix label rendering to use rotation
old_draw = """      // Stagger vertical position in hierarchical layout to prevent overlaps
      const staggerOffset = (layoutType === 'hierarchical' && node.index % 2 === 1) ? 14 : 0;
      ctx.fillText(label, node.x, node.y + r + 4 + staggerOffset);"""

new_draw = """      ctx.save();
      ctx.translate(node.x, node.y + r + 4);
      if (layoutType === 'hierarchical') {
        ctx.rotate(Math.PI / 6); // 30 degrees
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 2, 2);
      } else {
        ctx.fillText(label, 0, 0);
      }
      ctx.restore();"""

content = content.replace(old_draw, new_draw)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)

