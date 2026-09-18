"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';

// dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});

interface SynergyGraphProps {
  contexts: any[];
  synergies: any[];
}

export default function SynergyGraph({ contexts, synergies }: SynergyGraphProps) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    // prepare nodes
    const nodes = contexts.map(c => ({
      id: c.id,
      label: c.body.substring(0, 15) + (c.body.length > 15 ? '...' : ''),
      group: c.context_type === 'asis' ? 1 : c.context_type === 'tobe' ? 2 : 3, // 1: asis, 2: tobe, 3: record_sync
    }));

    // prepare links and insert reason nodes if applicable
    const links: any[] = [];
    
    synergies.forEach(s => {
      if (s.agent_type && s.reason) {
        const reasonNodeId = `syn_${s.id}`;
        nodes.push({
          id: reasonNodeId,
          label: `Agent: ${s.agent_type}\nReason: ${s.reason}`,
          group: 4, // 4: agent reason node
        });
        
        links.push({
          source: s.context_a_id,
          target: reasonNodeId,
          value: s.score,
        });
        
        links.push({
          source: reasonNodeId,
          target: s.context_b_id,
          value: s.score,
        });
      } else {
        links.push({
          source: s.context_a_id,
          target: s.context_b_id,
          value: s.score,
        });
      }
    });

    setGraphData({ nodes: nodes as any, links: links as any });
  }, [contexts, synergies]);

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

  return (
    <div ref={containerRef} className="glass-card" style={{ padding: 0, overflow: 'hidden', height: '400px', marginBottom: 'var(--space-2xl)' }}>
      {typeof window !== 'undefined' && graphData.nodes.length > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="label"
          nodeAutoColorBy="group"
          linkColor={() => 'rgba(255,255,255,0.2)'}
          linkWidth={link => (link as any).value * 3}
          nodeRelSize={6}
          nodeVal={node => (node as any).group === 4 ? 4 : 6} // Make reason nodes slightly smaller
          // @ts-ignore
          d3Force={(d3, force) => {
             // custom physics if needed, but defaults are usually fine
          }}
        />
      )}
      {graphData.nodes.length === 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
          No data to display graph
        </div>
      )}
    </div>
  );
}
