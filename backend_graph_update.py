import re

with open('frontend/src/components/NetworkGraph.tsx', 'r') as f:
    content = f.read()

# Add zoom logic to the activeNodeName useEffect
old_use_effect = """  useEffect(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (activeNodeName) {
      const targetNode = graphData.nodes.find(n => n.name === activeNodeName);
      if (targetNode) {
        updateHighlight(targetNode);
      }
    }
  }, [activeNodeName, graphData]);"""

new_use_effect = """  useEffect(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (activeNodeName) {
      const targetNode = graphData.nodes.find(n => n.name === activeNodeName);
      if (targetNode) {
        updateHighlight(targetNode);
        
        // Also jump/center the camera on this node if fgRef exists
        if (fgRef.current && targetNode.x !== undefined && targetNode.y !== undefined) {
          fgRef.current.centerAt(targetNode.x, targetNode.y, 1000);
          fgRef.current.zoom(8, 2000);
        }
      }
    }
  }, [activeNodeName, graphData]);"""

content = content.replace(old_use_effect, new_use_effect)

with open('frontend/src/components/NetworkGraph.tsx', 'w') as f:
    f.write(content)

