"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from 'next/dynamic';

// dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});

interface SynergyGraphProps {
  nodes: any[];
  triples: any[];
  synergies: any[];
  autoReset?: boolean;
}

export default function SynergyGraph({ nodes, triples, synergies, autoReset = false }: SynergyGraphProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const seenNodeIds = useRef(new Set<string | number>());
  const seenLinkIds = useRef(new Set<string>());
  const prevDataCount = useRef(0);

  useEffect(() => {
    const currentDataCount = nodes.length + triples.length + synergies.length;
    
    // If data hasn't changed, avoid rebuilding and setting graphData to prevent layout/physics reset
    if (currentDataCount > 0 && currentDataCount === prevDataCount.current) {
      if (autoReset) {
        // Just mutate existing graphData properties to re-trigger canvas animation
        // without calling setGraphData, so the physics simulation doesn't reheat
        const now = Date.now();
        graphData.nodes.forEach((n: any) => {
          n.isNew = true;
          n.createdAt = now;
        });
        graphData.links.forEach((l: any) => {
          l.isNew = true;
          l.createdAt = now;
        });
      }
      return;
    }
    
    prevDataCount.current = currentDataCount;

    // Create a map of existing nodes to preserve their x, y physics state
    const existingNodes = new Map(graphData.nodes.map((n: any) => [n.id, n]));

    // prepare nodes
    const graphNodes = nodes.map(n => {
      const isNew = !seenNodeIds.current.has(n.id);
      if (isNew) seenNodeIds.current.add(n.id);
      
      const prevNode = existingNodes.get(n.id) || {};
      
      return {
        ...prevNode,
        id: n.id,
        label: n.name,
        group: n.type === 'Person' ? 1 : n.type === 'Organization' ? 2 : 3,
        context_body: n.context_body,
        isNew: isNew,
        createdAt: isNew ? Date.now() : prevNode.createdAt
      };
    });

    // prepare links and insert reason nodes if applicable
    const links: any[] = [];
    
    // Add triples as standard edges
    triples.forEach(t => {
      links.push({
        source: t.source,
        target: t.target,
        label: t.label,
        type: 'triple',
        value: 1
      });
    });

    synergies.forEach(s => {
      if (s.agent_type && s.reason) {
        const reasonNodeId = `syn_${s.id}`;
        const isNewNode = !seenNodeIds.current.has(reasonNodeId);
        if (isNewNode) seenNodeIds.current.add(reasonNodeId);
        
        const prevNode = existingNodes.get(reasonNodeId) || {};
        
        graphNodes.push({
          ...prevNode,
          id: reasonNodeId,
          label: `Agent: ${s.agent_type}\nReason: ${s.reason}`,
          group: 4, // 4: agent reason node
          context_body: "",
          isNew: isNewNode,
          createdAt: isNewNode ? Date.now() : prevNode.createdAt
        });
        
        links.push({
          source: s.entity_a_id,
          target: reasonNodeId,
          value: s.score,
          type: 'synergy'
        });
        
        links.push({
          source: reasonNodeId,
          target: s.entity_b_id,
          value: s.score,
          type: 'synergy'
        });
      } else {
        links.push({
          source: s.entity_a_id,
          target: s.entity_b_id,
          value: s.score,
          type: 'synergy'
        });
      }
    });

    // Mark new links
    links.forEach(l => {
      const linkId = `${l.source}-${l.target}-${l.type}`;
      if (!seenLinkIds.current.has(linkId)) {
        l.isNew = true;
        l.createdAt = Date.now();
        seenLinkIds.current.add(linkId);
      }
    });

    setGraphData({ nodes: graphNodes as any, links: links as any });
  }, [nodes, triples, synergies, autoReset, graphData]);

  useEffect(() => {
    // update dimensions on mount
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 400,
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 400,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string | number>();
    if (hoverNode && hoverNode.group === 4) {
      ids.add(hoverNode.id);
      graphData.links.forEach((l: any) => {
        const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
        const targetId = typeof l.target === 'object' ? l.target.id : l.target;
        if (sourceId === hoverNode.id) ids.add(targetId);
        if (targetId === hoverNode.id) ids.add(sourceId);
      });
    }
    return ids;
  }, [hoverNode, graphData.links]);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '400px', marginBottom: 'var(--space-2xl)' }}>
        {typeof window !== 'undefined' && graphData.nodes.length > 0 && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="label"
            nodeAutoColorBy="group"
            linkColor={(link: any) => link.type === 'synergy' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255,255,255,0.2)'}
            linkWidth={link => link.type === 'synergy' ? (link as any).value * 3 : 1}
            linkDirectionalParticles={(link: any) => link.type === 'synergy' ? 4 : (link.isNew ? 2 : 0)}
            linkDirectionalParticleSpeed={(link: any) => link.type === 'synergy' ? (link.value * 0.01) : 0.005}
            nodeRelSize={6}
            nodeVal={node => (node as any).group === 4 ? 4 : 6} // Make reason nodes slightly smaller
            onNodeHover={node => setHoverNode(node || null)}
            // Custom node rendering for glow effect on new nodes
            // @ts-ignore
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label || "";
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;
              
              // Draw node circle
              const nodeRadius = node.group === 4 ? 4 : 6;
              const color = node.color || "#999";
              
              // Animation for new nodes (glow effect pulsing for 10 seconds)
              if (node.isNew && node.createdAt) {
                const age = Date.now() - node.createdAt;
                if (age < 10000) {
                  const pulse = Math.sin(age / 200) * 0.5 + 0.5; // 0 to 1
                  ctx.beginPath();
                  ctx.arc(node.x as number, node.y as number, nodeRadius + (pulse * 6), 0, 2 * Math.PI, false);
                  ctx.fillStyle = `rgba(16, 185, 129, ${0.4 * (1 - pulse)})`; // Emerald green glow
                  ctx.fill();
                }
              }

              ctx.beginPath();
              ctx.arc(node.x as number, node.y as number, nodeRadius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color as string;
              ctx.fill();
              
              // Draw text label below the node
              if (globalScale > 1.5) {
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                
                // Handle multi-line labels (Reason Nodes)
                if (node.group === 4) {
                  // Only show reason text when hovered
                  if (hoverNode && hoverNode.id === node.id) {
                    const lines = (label as string).split('\n');
                    lines.forEach((line, i) => {
                      ctx.fillText(line, node.x as number, (node.y as number) + nodeRadius + fontSize + (i * fontSize * 1.2));
                    });
                  }
                } else {
                  // Normal node labels
                  const isHighlight = hoverNode && hoverNode.group === 4 && node.id !== undefined && connectedNodeIds.has(node.id);
                  if (isHighlight) {
                    ctx.font = `bold ${fontSize * 1.2}px Sans-Serif`;
                    ctx.fillStyle = 'rgba(255, 255, 0, 1)'; // Yellow highlight
                  } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                  }
                  ctx.fillText(label as string, node.x as number, (node.y as number) + nodeRadius + fontSize);
                }
              }
            }}
          />
        )}
        {graphData.nodes.length === 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
            No data to display graph
          </div>
        )}
      </div>

      {/* Tooltip for original context */}
      {hoverNode && hoverNode.context_body && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          maxWidth: '300px',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          padding: '10px',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 10,
          fontSize: '0.875rem'
        }}>
          <strong>Context for {hoverNode.label}:</strong>
          <p style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>{hoverNode.context_body}</p>
        </div>
      )}
    </div>
  );
}
