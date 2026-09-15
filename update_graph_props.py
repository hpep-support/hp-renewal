import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Update Props
props_update = """
interface NetworkGraphProps {
  contexts: any[];
  onNodeSelect?: (nodeName: string | null) => void;
  activeNodeName?: string | null;
  theme?: string;
  layoutType?: string;
}

export default function NetworkGraph({ contexts, onNodeSelect, activeNodeName, theme = "dark", layoutType = "radial" }: NetworkGraphProps) {
"""
content = re.sub(r'interface NetworkGraphProps \{.*?\n\}', props_update.split('interface NetworkGraphProps {')[1].split('}')[0], content, flags=re.DOTALL)
content = re.sub(r'export default function NetworkGraph.*?\{', 'export default function NetworkGraph({ contexts, onNodeSelect, activeNodeName, theme = "dark", layoutType = "radial" }: NetworkGraphProps) {', content)


# Apply Layout Types in setTimeout
layout_update = """
        // Apply force layout based on layoutType
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
        
        fgRef.current.d3ReheatSimulation();
"""
content = re.sub(r'// Apply radial force: Older nodes to center.*?fgRef.current.d3ReheatSimulation\(\);\n', layout_update.replace('\\', '\\\\'), content, flags=re.DOTALL)

# Add dagMode for hierarchical layout
dag_mode_update = """
        onRenderFramePost={onRenderFramePost}
        dagMode={layoutType === "hierarchical" ? "td" : undefined}
        dagLevelDistance={layoutType === "hierarchical" ? 60 : undefined}
      />
"""
content = re.sub(r'onRenderFramePost=\{onRenderFramePost\}\n\s*/>', dag_mode_update.replace('\\', '\\\\'), content, flags=re.DOTALL)


# Update colors based on theme
# We will define a helper function inside the component
theme_helper = """
  const getThemeColors = (baseColor: string, isPerson: boolean) => {
    if (theme === "light") {
      return isPerson ? "#0284c7" : "#0d9488"; // darker blue/teal for light bg
    } else if (theme === "colorful") {
      // Generate deterministic vibrant colors based on name length
      return `hsl(${(baseColor.charCodeAt(1) * 20) % 360}, 80%, 60%)`; 
    }
    return baseColor; // default dark theme colors
  };
"""

# inject helper after useEffects
content = re.sub(r'const handleNodeClick', theme_helper + '\n  const handleNodeClick', content)

# update node creation to use getThemeColors
# wait, node colors are defined during graph building
# instead of changing node building, let's change `nodeColor` prop in ForceGraph2D
node_color_prop = """
          nodeColor={(node: any) => {
            if (highlightNodes.has(node) || node === hoverNode) return "#facc15";
            let c = node.color;
            if (theme === "light") c = (node.val === 4) ? "#0284c7" : "#0d9488";
            if (theme === "colorful") c = `hsl(${(node.id.length * 20) % 360}, 80%, 60%)`;
            if (node.id === "dao") c = theme === "light" ? "#4338ca" : "#4f46e5";
            return c;
          }}
          linkColor={(link: any) => {
            if (highlightLinks.has(link)) return "#facc15";
            if (link.type === "bridge") return "#f97316"; 
            return theme === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)";
          }}
"""
content = re.sub(r'nodeColor=\{\(node: any\) => \{.*?return "rgba\(255,255,255,0.2\)";\n\s*\}\}', node_color_prop.replace('\\', '\\\\'), content, flags=re.DOTALL)

# update node canvas text color
text_color_update = """
            ctx.fillStyle = highlightNodes.has(node) ? (theme === "light" ? "#000" : "#fff") : (theme === "light" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)");
"""
content = re.sub(r'ctx.fillStyle = highlightNodes.has\(node\) \? "#ffffff" : "rgba\(255, 255, 255, 0.8\)";', text_color_update.replace('\\', '\\\\'), content)


with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)
