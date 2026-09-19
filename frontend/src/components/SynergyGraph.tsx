"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface SynergyGraphProps {
  nodes: any[];
  triples: any[];
  synergies: any[];
  autoReset?: boolean;
  discoveryAnimationEnabled?: boolean;
  currentUserId?: number;
}

export default function SynergyGraph({
  nodes,
  triples,
  synergies,
  autoReset = false,
  discoveryAnimationEnabled = true,
  currentUserId,
}: SynergyGraphProps) {
  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [hoverNode, setHoverNode] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });
  const seenNodeIds = useRef(new Set<string | number>());
  const seenLinkIds = useRef(new Set<string>());
  const prevDataCount = useRef(0);

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  useEffect(() => {
    const currentDataCount = nodes.length + triples.length + synergies.length;

    if (currentDataCount > 0 && currentDataCount === prevDataCount.current) {
      if (autoReset) {
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
    const existingNodes = new Map(graphData.nodes.map((n: any) => [n.id, n]));

    // Prepare nodes
    const graphNodes = nodes.map((n) => {
      const isNew = !seenNodeIds.current.has(n.id);
      if (isNew) seenNodeIds.current.add(n.id);

      const prevNode = existingNodes.get(n.id) || {};
      const typeLower = (n.type || "").toLowerCase();
      const group = typeLower === "person" ? 1 : typeLower === "organization" ? 2 : 3;

      return {
        ...prevNode,
        id: n.id,
        label: n.name,
        type: n.type,
        group,
        context_body: n.context_body,
        created_by_agent: n.created_by_agent,
        info_date: n.info_date,
        isNew: isNew,
        createdAt: isNew ? Date.now() : prevNode.createdAt || Date.now(),
      };
    });

    const links: any[] = [];
    const validNodeIds = new Set(graphNodes.map((n) => n.id));

    // Add triples as standard edges (only if both source and target exist)
    triples.forEach((t) => {
      if (!validNodeIds.has(t.source) || !validNodeIds.has(t.target)) {
        return;
      }

      const linkId = `t_${t.source}_${t.target}_${t.label}`;
      const isNew = !seenLinkIds.current.has(linkId);
      if (isNew) seenLinkIds.current.add(linkId);

      links.push({
        id: linkId,
        source: t.source,
        target: t.target,
        label: t.label,
        type: "triple",
        value: 1,
        isNew,
        createdAt: isNew ? Date.now() : 0,
      });
    });

    // Add synergies (with Reason Nodes)
    synergies.forEach((s) => {
      const src = s.source || s.entity_a_id;
      const tgt = s.target || s.entity_b_id;

      // Both source and target entity must exist in the node set
      if (!validNodeIds.has(src) || !validNodeIds.has(tgt)) {
        return;
      }

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
          createdAt: isNewNode ? Date.now() : prevNode.createdAt || Date.now(),
        });
        validNodeIds.add(reasonNodeId);

        links.push({
          source: src,
          target: reasonNodeId,
          value: s.score,
          type: "synergy",
        });

        links.push({
          source: reasonNodeId,
          target: tgt,
          value: s.score,
          type: "synergy",
        });
      } else {
        links.push({
          source: src,
          target: tgt,
          value: s.score,
          type: "synergy",
        });
      }
    });

    // Final safety filter to guarantee all links connect existing nodes
    const safeLinks = links.filter(
      (l) => validNodeIds.has(l.source) && validNodeIds.has(l.target)
    );

    setGraphData({ nodes: graphNodes, links: safeLinks });
  }, [nodes, triples, synergies, autoReset]);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 420,
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: 420,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string | number>();
    if (hoverNode && hoverNode.group === 4) {
      ids.add(hoverNode.id);
      graphData.links.forEach((l: any) => {
        const sourceId = typeof l.source === "object" ? l.source.id : l.source;
        const targetId = typeof l.target === "object" ? l.target.id : l.target;
        if (sourceId === hoverNode.id) ids.add(targetId);
        if (targetId === hoverNode.id) ids.add(sourceId);
      });
    }
    return ids;
  }, [hoverNode, graphData.links]);

  return (
    <div style={{ position: "relative" }}>
      {/* Visual Legend */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "8px",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }}></span>
          Person (人物)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#a855f7", display: "inline-block" }}></span>
          Organization (組織)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
          Project / Concept (テーマ)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
          Hermes Reason (推論ノード)
        </span>
      </div>

      <div
        ref={containerRef}
        className="glass-card"
        style={{ padding: 0, overflow: "hidden", height: "420px", marginBottom: "var(--space-2xl)" }}
      >
        {typeof window !== "undefined" && graphData.nodes.length > 0 && (
          <ForceGraph2D
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="label"
            nodeAutoColorBy="group"
            linkColor={(link: any) =>
              link.type === "synergy" ? "rgba(16, 185, 129, 0.6)" : "rgba(255,255,255,0.25)"
            }
            linkWidth={(link: any) => (link.type === "synergy" ? (link.value || 1) * 3 : 1.2)}
            linkDirectionalParticles={(link: any) =>
              link.type === "synergy" ? 4 : link.isNew && discoveryAnimationEnabled && !prefersReducedMotion ? 3 : 0
            }
            linkDirectionalParticleSpeed={(link: any) => (link.type === "synergy" ? (link.value || 0.5) * 0.01 : 0.008)}
            linkDirectionalParticleWidth={2}
            nodeRelSize={6}
            nodeVal={(node: any) => (node.group === 4 ? 4 : 6)}
            onNodeHover={(node) => setHoverNode(node || null)}
            // Custom node rendering for birth animation, sparkles, and ripple effect
            // @ts-ignore
            nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
              const label = node.label || "";
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Sans-Serif`;

              const baseRadius = node.group === 4 ? 4 : 6;
              const color =
                node.group === 1
                  ? "#3b82f6"
                  : node.group === 2
                  ? "#a855f7"
                  : node.group === 3
                  ? "#10b981"
                  : "#f59e0b";

              const now = Date.now();
              const age = now - (node.createdAt || now);
              const animateDiscovery = discoveryAnimationEnabled && !prefersReducedMotion && node.isNew && age < 8000;

              let currentRadius = baseRadius;

              // Scale-up birth animation for first 400ms
              if (animateDiscovery && age < 500) {
                const progress = Math.min(age / 500, 1);
                currentRadius = baseRadius * Math.sin((progress * Math.PI) / 2);
              }

              // Pulse ring ripple animation (expanding waves)
              if (animateDiscovery) {
                const ripple1 = (age % 1500) / 1500; // 0 to 1
                const ripple2 = ((age + 750) % 1500) / 1500;

                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius + ripple1 * 16, 0, 2 * Math.PI, false);
                ctx.strokeStyle = `rgba(16, 185, 129, ${0.5 * (1 - ripple1)})`;
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(node.x, node.y, currentRadius + ripple2 * 16, 0, 2 * Math.PI, false);
                ctx.strokeStyle = `rgba(59, 130, 246, ${0.4 * (1 - ripple2)})`;
                ctx.lineWidth = 1.5 / globalScale;
                ctx.stroke();

                // Sparkle indicator for AI discovery
                if (node.created_by_agent || node.group === 4) {
                  ctx.fillStyle = "#fbbf24";
                  ctx.font = `bold ${fontSize * 1.1}px Sans-Serif`;
                  ctx.fillText("✨", node.x + currentRadius + 2, node.y - currentRadius - 2);
                }
              }

              // Draw node solid circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, currentRadius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();

              // Draw labels
              if (globalScale > 1.3) {
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                if (node.group === 4) {
                  if (hoverNode && hoverNode.id === node.id) {
                    const lines = label.split("\n");
                    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                    lines.forEach((line: string, i: number) => {
                      ctx.fillText(line, node.x, node.y + currentRadius + fontSize + i * fontSize * 1.2);
                    });
                  }
                } else {
                  const isHighlight =
                    hoverNode && hoverNode.group === 4 && node.id !== undefined && connectedNodeIds.has(node.id);
                  if (isHighlight) {
                    ctx.font = `bold ${fontSize * 1.2}px Sans-Serif`;
                    ctx.fillStyle = "rgba(255, 255, 0, 1)";
                  } else {
                    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                  }
                  ctx.fillText(label, node.x, node.y + currentRadius + fontSize);
                }
              }
            }}
          />
        )}
        {graphData.nodes.length === 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              color: "var(--text-tertiary)",
            }}
          >
            グラフを表示するデータがありません
          </div>
        )}
      </div>

      {/* Tooltip for original context */}
      {hoverNode && hoverNode.context_body && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            maxWidth: "340px",
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid var(--border-color)",
            color: "#fff",
            padding: "12px",
            borderRadius: "8px",
            pointerEvents: "none",
            zIndex: 10,
            fontSize: "0.85rem",
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#60a5fa" }}>
            {hoverNode.label} ({hoverNode.type || "Entity"})
          </div>
          {hoverNode.info_date && (
            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "4px" }}>
              日時: {new Date(hoverNode.info_date).toLocaleDateString()}
            </div>
          )}
          <p style={{ margin: "4px 0 0 0", whiteSpace: "pre-wrap", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
            {hoverNode.context_body}
          </p>
        </div>
      )}
    </div>
  );
}
