"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import react-force-graph-2d to prevent SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface NetworkGraphProps {
  contexts: any[];
  onNodeSelect?: (nodeName: string | null) => void;
  activeNodeName?: string | null;
}

export default function NetworkGraph({ contexts, onNodeSelect, activeNodeName }: NetworkGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  // Highlighting sets
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    // Generate mock graph data based on contexts
    const nodes: any[] = [];
    const links: any[] = [];

    // Add central DAO node
    nodes.push({ id: "dao", name: "DAO Core", val: 20, color: "#4f46e5" });

    contexts.forEach((ctx, i) => {
      const isAsIs = ctx.context_type === "asis";
      const nodeId = `ctx-${ctx.id}`;
      
      nodes.push({
        id: nodeId,
        name: isAsIs ? `As-Is: ${ctx.body.substring(0, 15)}...` : `To-Be: ${ctx.body.substring(0, 15)}...`,
        val: 10,
        color: isAsIs ? "#1e293b" : "#4338ca",
        url: ctx.resource_url,
      });

      // Link context to DAO core
      links.push({
        source: "dao",
        target: nodeId,
      });

      // Entity Extraction (Using LLM extracted JSON relationships from backend)
      let relationships: {source: string, target: string}[] = [];
      
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

        const srcNodeId = `entity-${srcName}`;
        const tgtNodeId = `entity-${tgtName}`;

        // Add Source Node (typically a Person)
        if (!nodes.find((n) => n.id === srcNodeId)) {
          const isPerson = srcName.endsWith("氏") || srcName.length <= 4;
          nodes.push({ 
            id: srcNodeId, 
            name: srcName, 
            val: isPerson ? 4 : 7, 
            color: isPerson ? "#0ea5e9" : "#14b8a6" 
          });
        }

        // Add Target Node (typically a Project)
        if (!nodes.find((n) => n.id === tgtNodeId)) {
          const isPerson = tgtName.endsWith("氏") || tgtName.length <= 4;
          nodes.push({ 
            id: tgtNodeId, 
            name: tgtName, 
            val: isPerson ? 4 : 7, 
            color: isPerson ? "#0ea5e9" : "#14b8a6" 
          });
        }

        // Link Source -> Target (e.g. Person -> Project)
        links.push({
          source: srcNodeId,
          target: tgtNodeId,
        });

        // Link the Target (Project) back to the Context Node to root it in the graph
        links.push({
          source: nodeId,
          target: tgtNodeId,
        });
      });
    });

    // Deep clone to ensure force-graph detects the new data structure properly
    const newGraphData = {
      nodes: nodes.map(n => ({...n})),
      links: links.map(l => ({...l}))
    };
    
    setGraphData(newGraphData);
    
    // Kick the simulation to organize new nodes (try a few times as data settles)
    [100, 500, 1000].forEach(delay => {
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.d3ReheatSimulation();
        }
      }, delay);
    });
  }, [contexts]);

  // Update highlights when activeNodeName or graphData changes
  useEffect(() => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
    
    if (activeNodeName) {
      // Find the node id corresponding to activeNodeName
      const targetNode = graphData.nodes.find(n => n.name === activeNodeName);
      if (targetNode) {
        updateHighlight(targetNode);
      }
    }
  }, [activeNodeName, graphData]);

  const updateHighlight = (node: any) => {
    const highlightNodes = new Set([node]);
    const highlightLinks = new Set();
    
    graphData.links.forEach(link => {
      // Force graph normalizes source/target to object references after init
      const source = typeof link.source === 'object' ? link.source.id : link.source;
      const target = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (source === node.id || target === node.id) {
        highlightLinks.add(link);
        highlightNodes.add(typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === source));
        highlightNodes.add(typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === target));
      }
    });
    
    setHighlightNodes(highlightNodes);
    setHighlightLinks(highlightLinks);
  };

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 500,
      });
    }
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 500,
        });
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    // Center at node on click
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
    
    if (node.id.startsWith("entity-")) {
      if (onNodeSelect) onNodeSelect(node.name);
    } else {
      if (onNodeSelect) onNodeSelect(null); // Clear selection if clicking a context/DAO node
    }
  }, [onNodeSelect]);

  const onRenderFramePost = useCallback((ctx: any, globalScale: number) => {
    if (!activeNodeName) return;
    const targetNode = graphData.nodes.find(n => n.name === activeNodeName);
    if (!targetNode || targetNode.x === undefined || targetNode.y === undefined) return;

    // Find snippet
    const relatedCtx = contexts.find(c => 
      c.body.includes(activeNodeName) || 
      (c.extracted_entities && c.extracted_entities.includes(activeNodeName))
    );
    
    if (relatedCtx) {
      // extract snippet
      const idx = relatedCtx.body.indexOf(activeNodeName);
      let snippet = relatedCtx.body;
      if (idx !== -1) {
         const start = Math.max(0, idx - 15);
         const end = Math.min(relatedCtx.body.length, idx + activeNodeName.length + 20);
         snippet = (start > 0 ? "..." : "") + relatedCtx.body.substring(start, end).replace(/\n/g, ' ') + "...";
      } else {
         snippet = snippet.substring(0, 30).replace(/\n/g, ' ') + "...";
      }
      
      const fontSize = 12 / globalScale;
      ctx.font = `${fontSize}px Sans-Serif`;
      const textWidth = ctx.measureText(snippet).width;
      const pad = fontSize * 0.8;
      const bckgDimensions = [textWidth + pad * 2, fontSize + pad * 2];
      
      const bubbleX = targetNode.x + targetNode.val * 1.5;
      const bubbleY = targetNode.y - targetNode.val * 1.5 - bckgDimensions[1];
      
      ctx.fillStyle = 'rgba(20, 184, 166, 0.9)'; // Teal background
      
      ctx.beginPath();
      if (ctx.roundRect) {
         ctx.roundRect(bubbleX, bubbleY, bckgDimensions[0], bckgDimensions[1], fontSize * 0.4);
      } else {
         ctx.rect(bubbleX, bubbleY, bckgDimensions[0], bckgDimensions[1]);
      }
      ctx.fill();
      
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(snippet, bubbleX + pad, bubbleY + bckgDimensions[1] / 2);
    }
  }, [activeNodeName, graphData.nodes, contexts]);

  const handleBackgroundClick = useCallback(() => {
    if (onNodeSelect) onNodeSelect(null);
  }, [onNodeSelect]);

  const paintRing = useCallback((node: any, ctx: any) => {
    // add ring just for highlighted nodes
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val * 1.4, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.id.startsWith("entity-") ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0)';
    ctx.fill();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-[400px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (highlightNodes.size === 0) return node.color;
          return highlightNodes.has(node) ? node.color : 'rgba(100, 100, 100, 0.1)';
        }}
        nodeRelSize={1}
        linkColor={(link: any) => {
          if (highlightNodes.size === 0) return "rgba(99, 102, 241, 0.2)";
          return highlightLinks.has(link) ? "rgba(99, 102, 241, 0.8)" : "rgba(100, 100, 100, 0.05)";
        }}
        linkWidth={(link: any) => (highlightLinks.has(link) ? 2 : 1)}
        nodeCanvasObjectMode={(node: any) => highlightNodes.has(node) ? 'before' : undefined}
        nodeCanvasObject={paintRing}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
        onRenderFramePost={onRenderFramePost}
        // Force the graph to fit inside the view after it settles
        cooldownTicks={100}
      />
    </div>
  );
}
