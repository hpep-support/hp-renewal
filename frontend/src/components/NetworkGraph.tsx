"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import * as d3 from "d3-force";

// Dynamically import react-force-graph-2d to prevent SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface NetworkGraphProps {
  contexts: any[];
  onNodeSelect?: (nodeName: string | null) => void;
  activeNodeName?: string | null;
  theme?: string;
  layoutType?: string;
}

export default function NetworkGraph({ contexts, onNodeSelect, activeNodeName, theme = "dark", layoutType = "radial" }: NetworkGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Highlighting sets
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);

  useEffect(() => {
    // Process contexts into nodes and links
    const nodesMap = new Map();
    const links: any[] = [];
    
    // Degrees map
    const nodeDegrees = new Map<string, number>();
    
    // Add DAO core node
    nodesMap.set("dao", { 
      id: "dao", 
      name: "DAO Core", 
      val: 20, 
      color: theme === "light" ? "#4338ca" : "#4f46e5",
      type: "organization"
    });

    contexts.forEach((ctx, idx) => {
      // Add context node
      const ctxId = `ctx-${ctx.id}`;
      const ts = new Date(ctx.created_at).getTime();
      nodesMap.set(ctxId, { 
        id: ctxId, 
        name: `Context #${ctx.id}`, 
        val: 3, 
        color: theme === "light" ? "#94a3b8" : "#475569", 
        timestamp: ts,
        type: "context"
      });
      
      // Link context to DAO core
      links.push({ source: ctxId, target: "dao" });
      nodeDegrees.set("dao", (nodeDegrees.get("dao") || 0) + 1);

      if (ctx.extracted_entities && ctx.extracted_entities !== "[]") {
        try {
          const relationships = JSON.parse(ctx.extracted_entities);
          relationships.forEach((rel: any) => {
            const srcId = `entity-${rel.source}`;
            const tgtId = `entity-${rel.target}`;
            const srcType = rel.source_type || "person";
            const tgtType = rel.target_type || "project";
            
            if (!nodesMap.has(srcId)) {
              nodesMap.set(srcId, { 
                id: srcId, 
                name: rel.source, 
                color: getThemeColors("#0ea5e9", srcType === "person"), 
                timestamp: ts,
                type: srcType
              });
            }
            if (!nodesMap.has(tgtId)) {
              nodesMap.set(tgtId, { 
                id: tgtId, 
                name: rel.target, 
                color: getThemeColors("#10b981", tgtType === "person"), 
                timestamp: ts,
                type: tgtType
              });
            }
            
            // Link entities to the context where they were mentioned
            links.push({ source: srcId, target: ctxId, type: "mention" });
            links.push({ source: tgtId, target: ctxId, type: "mention" });
            
            // Link entities to each other
            links.push({ source: srcId, target: tgtId, type: rel.type || "actual", event: rel.event });
            
            nodeDegrees.set(srcId, (nodeDegrees.get(srcId) || 0) + 1);
            nodeDegrees.set(tgtId, (nodeDegrees.get(tgtId) || 0) + 1);
          });
        } catch (e) {
          console.error("Failed to parse relationships for context", ctx.id);
        }
      }
    });

    // Update node sizes based on degree
    const nodes = Array.from(nodesMap.values()).map(n => {
       const degree = nodeDegrees.get(n.id) || 0;
       if (n.id !== "dao" && n.type !== "context") {
          n.val = Math.max(3, Math.min(20, degree * 1.5));
          n.degree = degree;
       }
       return n;
    });
    
    const newGraphData = {
      nodes: nodes.map(n => ({...n})),
      links: links.map(l => ({...l}))
    };
    
    setGraphData(newGraphData);
    
    // Kick the simulation to organize new nodes
    setTimeout(() => {
      if (fgRef.current && newGraphData.nodes.length > 0) {
        const timestamps = newGraphData.nodes.map(n => n.timestamp || 0).filter(t => t > 0);
        const maxTime = timestamps.length > 0 ? Math.max(...timestamps) : 1;
        const minTime = timestamps.length > 0 ? Math.min(...timestamps) : 0;
        
        const timeThreshold = maxTime - (24 * 60 * 60 * 1000);
        
        newGraphData.nodes.forEach(n => {
           n.isNew = (n.timestamp && n.timestamp >= timeThreshold && n.id !== "dao" && !n.id.startsWith("ctx-"));
        });
        
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
          fgRef.current.d3Force('charge').strength(-600);
        } else if (layoutType === "hierarchical") {
          fgRef.current.d3Force('radial', null);
          fgRef.current.d3Force('charge').strength(-800);
        }
        
        // Add a collide force to prevent label overlap
        fgRef.current.d3Force('collide', d3.forceCollide((n: any) => {
           // Estimate text width for Japanese characters (~12px per char) + padding
           const textWidth = n.name ? n.name.length * 14 : 0;
           return (n.val || 3) + textWidth / 2 + 10;
        }).strength(1));
        
        fgRef.current.d3ReheatSimulation();
      }
    }, 100);
  }, [contexts, dimensions, theme, layoutType]);

  const getThemeColors = (baseColor: string, isPerson: boolean) => {
    if (theme === "light") {
      return isPerson ? "#0284c7" : "#0d9488"; // darker blue/teal for light bg
    } else if (theme === "colorful") {
      // Generate deterministic vibrant colors based on name length
      return `hsl(${(baseColor.charCodeAt(1) * 20) % 360}, 80%, 60%)`; 
    }
    return baseColor; // default dark theme colors
  };

  useEffect(() => {
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
  }, [activeNodeName, graphData]);

  const updateHighlight = (node: any) => {
    const highlightNodes = new Set([node]);
    const highlightLinks = new Set();
    
    graphData.links.forEach(link => {
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
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(8, 2000);
    }
    
    if (node.id.startsWith("entity-")) {
      if (onNodeSelect) onNodeSelect(node.name);
    } else {
      if (onNodeSelect) onNodeSelect(null);
    }
  }, [onNodeSelect]);

  const handleSearch = () => {
    if (!searchQuery) return;
    const lowerQuery = searchQuery.toLowerCase();
    const targetNode = graphData.nodes.find(n => n.name && n.name.toLowerCase().includes(lowerQuery));
    if (targetNode && fgRef.current) {
      fgRef.current.centerAt(targetNode.x, targetNode.y, 1000);
      fgRef.current.zoom(8, 2000);
      if (onNodeSelect) onNodeSelect(targetNode.name);
    }
  };

  const handleFitScreen = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(1000, 20);
    }
  };

  const drawNode = useCallback((node: any, ctx: any, globalScale: number) => {
    const isHighlighted = highlightNodes.has(node) || node === hoverNode;
    const hasActiveSelection = highlightNodes.size > 0;
    const isDimmed = hasActiveSelection && !isHighlighted;
    
    // Determine base color
    let c = node.color;
    if (theme === "light") {
       c = node.type === "person" ? "#0284c7" : "#0d9488";
       if (node.id === "dao") c = "#4338ca";
    }
    if (theme === "colorful") {
       c = `hsl(${(node.name ? node.name.length * 20 : 0) % 360}, 80%, 60%)`;
    }

    const r = node.val || 3;
    
    // Apply dimming for non-highlighted nodes when a selection is active
    if (isDimmed) {
      ctx.globalAlpha = 0.15;
    }
    
    // Draw pulsing aura if new (only when not dimmed)
    if (node.isNew && !isDimmed) {
      const time = Date.now() / 500;
      const pulseR = r + (Math.sin(time) + 1) * 2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseR, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.fill();
    }

    // Draw highlight glow ring (behind the node)
    if (isHighlighted) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    ctx.fillStyle = c;
    ctx.beginPath();
    
    // Shapes based on entity type
    if (node.type === "project") {
      ctx.rect(node.x - r, node.y - r, r * 2, r * 2);
    } else if (node.type === "organization") {
      ctx.moveTo(node.x, node.y - r);
      ctx.lineTo(node.x + r, node.y);
      ctx.lineTo(node.x, node.y + r);
      ctx.lineTo(node.x - r, node.y);
      ctx.closePath();
    } else {
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
    }
    
    ctx.fill();
    
    // Draw text with LOD (Level of Detail)
    if (globalScale > 1.5 || r > 5 || isHighlighted) {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `${Math.max(fontSize, 4)}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // Text background for highlighted nodes to improve readability
      if (isHighlighted) {
        const textWidth = ctx.measureText(label).width;
        const bgPadding = 2;
        ctx.fillStyle = theme === "light" ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)';
        ctx.fillRect(
          node.x - textWidth / 2 - bgPadding,
          node.y + r + 2,
          textWidth + bgPadding * 2,
          Math.max(fontSize, 4) + bgPadding * 2
        );
      }
      
      ctx.fillStyle = isHighlighted
        ? (theme === "light" ? "#000" : "#facc15")
        : (theme === "light" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)");
      ctx.save();
      ctx.translate(node.x, node.y + r + 4);
      if (layoutType === 'hierarchical') {
        ctx.rotate(Math.PI / 6); // 30 degrees
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 2, 2);
      } else {
        ctx.fillText(label, 0, 0);
      }
      ctx.restore();
    }
    
    // Reset global alpha
    ctx.globalAlpha = 1;
  }, [highlightNodes, hoverNode, theme, layoutType]);

  const drawLink = useCallback((link: any, ctx: any, globalScale: number) => {
    // Only used if we want custom link rendering, but let's use the built-in props and linkCanvasObject for events
    if (link.event) {
      const start = link.source;
      const end = link.target;
      if (typeof start === 'object' && typeof end === 'object') {
        const textPos = Object.assign({}, start, {
          x: start.x + (end.x - start.x) / 2,
          y: start.y + (end.y - start.y) / 2
        });
        const fontSize = 10 / globalScale;
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.fillStyle = theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)";
        ctx.fillText(link.event, textPos.x, textPos.y);
      }
    }
  }, [theme]);


  return (
    <div ref={containerRef} className="w-full relative h-[500px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800">
      
      {/* Search & Controls Overlay */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <div className="flex bg-slate-800 rounded-md overflow-hidden border border-slate-700">
          <input 
            type="text" 
            placeholder="Search node..." 
            className="bg-transparent text-slate-200 text-xs px-2 py-1 outline-none w-32"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-slate-700 hover:bg-slate-600 px-2 text-xs text-white">Find</button>
        </div>
        <button onClick={handleFitScreen} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-md border border-slate-700">
          Fit to Screen
        </button>
      </div>

      {/* Legend Overlay */}
      <div className={`absolute bottom-2 left-2 z-10 p-2 text-xs rounded-md border ${theme === 'light' ? 'bg-white/80 border-slate-300 text-slate-700' : 'bg-slate-800/80 border-slate-700 text-slate-300'}`}>
        <div className="font-semibold mb-1">Legend</div>
        <div className="flex items-center gap-1 mb-1"><div className="w-3 h-3 rounded-full bg-sky-500"></div> Person</div>
        <div className="flex items-center gap-1 mb-1"><div className="w-3 h-3 bg-emerald-500"></div> Project</div>
        <div className="flex items-center gap-1 mb-1"><div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-indigo-500"></div> Organization</div>
        <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-orange-500"></div> Bridge Link</div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        
        nodeCanvasObject={drawNode}
        
        linkColor={(link: any) => {
          const hasActive = highlightNodes.size > 0;
          if (highlightLinks.has(link)) return "rgba(250, 204, 21, 0.35)";
          if (link.type === "bridge") return hasActive ? "rgba(249, 115, 22, 0.15)" : "#f97316";
          if (hasActive) return theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)";
          return theme === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)";
        }}
        linkWidth={(link: any) => {
           let w = 0.5;
           if (link.type === "bridge") w = 1.5;
           if (highlightLinks.has(link)) w = 1.5;
           return w;
        }}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={drawLink}
        
        onNodeClick={handleNodeClick}
        onBackgroundClick={() => {
           if (onNodeSelect) onNodeSelect(null);
           setHoverNode(null);
        }}
        
        onNodeHover={(node) => setHoverNode(node)}
        dagMode={layoutType === "hierarchical" ? "td" : undefined}
        dagLevelDistance={layoutType === "hierarchical" ? 100 : undefined}
        
        cooldownTicks={150} // Stabilize after 150 ticks
      />
      
      {/* Custom Tooltip rendered via DOM for hoverNode */}
      {hoverNode && (
        <div 
          className="absolute pointer-events-none bg-slate-800 text-white p-2 rounded shadow-lg border border-slate-700 text-xs z-20"
          style={{
            // Position near the center of the graph or mouse (react-force-graph doesn't directly expose screen coordinates in hover easily, so we can use a fixed corner or attempt to map coords if we track mouse)
            // For simplicity, display in the top right corner
            top: '10px',
            right: '10px',
            maxWidth: '200px'
          }}
        >
          <div className="font-bold">{hoverNode.name}</div>
          <div className="text-slate-400 capitalize">{hoverNode.type}</div>
          {hoverNode.degree !== undefined && <div>Connections: {hoverNode.degree}</div>}
        </div>
      )}
    </div>
  );
}
