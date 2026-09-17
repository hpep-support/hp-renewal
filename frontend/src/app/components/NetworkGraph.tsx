"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from 'next/dynamic';

// dynamically import react-force-graph-2d to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Node {
  id: string;
  name: string;
  group: number;
  val: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function NetworkGraph({ data }: { data?: GraphData }) {
  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Default dummy data if none provided
  const graphData = data || {
    nodes: [
      { id: "1", name: "Project A", group: 1, val: 20 },
      { id: "2", name: "User X", group: 2, val: 10 },
      { id: "3", name: "Organization Y", group: 3, val: 15 },
    ],
    links: [
      { source: "2", target: "1", value: 2 },
      { source: "3", target: "1", value: 5 },
      { source: "2", target: "3", value: 1 },
    ]
  };

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      setDimensions({ width: clientWidth, height: clientHeight || 600 });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight || 600 });
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[600px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-white font-semibold text-lg drop-shadow-md">Future Constellation (Preview)</h3>
        <p className="text-slate-400 text-sm">Community Entity Network</p>
      </div>
      
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => {
          switch(node.group) {
            case 1: return '#818cf8'; // indigo-400
            case 2: return '#34d399'; // emerald-400
            case 3: return '#fbbf24'; // amber-400
            default: return '#94a3b8'; // slate-400
          }
        }}
        nodeRelSize={6}
        linkColor={() => 'rgba(255,255,255,0.1)'}
        linkWidth={1.5}
        backgroundColor="#020617" // slate-950
        onNodeClick={(node: any) => {
          // Center/zoom on node
          if(fgRef.current) {
            (fgRef.current as any).centerAt(node.x, node.y, 1000);
            (fgRef.current as any).zoom(8, 2000);
          }
        }}
      />
    </div>
  );
}
