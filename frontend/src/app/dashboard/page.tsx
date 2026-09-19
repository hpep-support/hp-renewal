"use client";

import { useEffect, useState } from "react";
import SynergyGraph from "@/components/SynergyGraph";
import HermesProposals from "@/components/HermesProposals";

export default function DashboardOverview() {
  const [synergies, setSynergies] = useState<any[]>([]);
  const [graphNodes, setGraphNodes] = useState<any[]>([]);
  const [graphTriples, setGraphTriples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [delayMs, setDelayMs] = useState<number>(
    typeof window !== "undefined" ? parseInt(localStorage.getItem("agentDelayMs") || "0") : 0
  );
  const [autoResetAnimation, setAutoResetAnimation] = useState<boolean>(
    typeof window !== "undefined" ? localStorage.getItem("autoResetAnimation") === "true" : false
  );
  const [discoveryAnimationEnabled, setDiscoveryAnimationEnabled] = useState<boolean>(
    typeof window !== "undefined" ? localStorage.getItem("discoveryAnimation") !== "false" : true
  );

  const fetchDashboardData = async (isPolling = false) => {
    const token = localStorage.getItem("token");
    try {
      if (!isPolling) {
        // Get user info to check if owner only on initial load
        const userRes = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }
      }

      // Fetch synergies
      const synRes = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/synergies/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (synRes.ok) {
        const synData = await synRes.json();
        setSynergies(synData);
      }

      // Fetch graph data (entities and triples)
      const graphRes = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/graph/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (graphRes.ok) {
        const graphData = await graphRes.json();
        setGraphNodes(graphData.nodes || []);
        setGraphTriples(graphData.triples || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Setup polling every 5 seconds for real-time updates
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleReview = async (id: number, result: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/synergies/${id}/review`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ review_result: result })
      });
      if (res.ok) {
        setSynergies(synergies.map(s => s.id === id ? { ...s, review_result: result } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAnalysis = async () => {
    setGenerating(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/synergies/batch?delay_ms=${delayMs}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      alert("Error starting analysis.");
    } finally {
      setGenerating(false);
    }
  };

  const handleClearSynergies = async () => {
    if (!confirm("Are you sure you want to clear all discovered synergies?")) return;
    
    const token = localStorage.getItem("token");
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/synergies/all", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert("Error clearing synergies.");
    }
  };

  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Community Intelligence & Synergy</h1>
        
        {user?.role === 'owner' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Agent Interval: {delayMs}ms
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="range" 
                  min="0" max="5000" step="500" 
                  value={delayMs} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setDelayMs(val);
                    localStorage.setItem("agentDelayMs", val.toString());
                  }}
                  style={{ width: '90px' }}
                />
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={discoveryAnimationEnabled}
                    onChange={(e) => {
                      setDiscoveryAnimationEnabled(e.target.checked);
                      localStorage.setItem("discoveryAnimation", e.target.checked.toString());
                    }}
                  />
                  発見アニメーション
                </label>
              </div>
            </div>
            
            <button className="btn-primary" onClick={handleRunAnalysis} disabled={generating}>
              {generating ? "Starting..." : "シナジー分析実行"}
            </button>
          </div>
        )}
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        自律型コミュニティAI「Hermes」によるグラフ維持・相乗効果（シナジー）とリソースプーリングの可視化。
      </p>

      {/* Hermes Proposal Review Queue */}
      <HermesProposals onProposalReviewed={() => fetchDashboardData()} />

      {/* Synergy & Entity Network Map */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Knowledge & Synergy Network Map</h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          Nodes: {graphNodes.length} | Triples: {graphTriples.length} | Synergies: {synergies.length}
        </span>
      </div>

      <SynergyGraph 
        nodes={graphNodes} 
        triples={graphTriples} 
        synergies={synergies} 
        autoReset={autoResetAnimation}
        discoveryAnimationEnabled={discoveryAnimationEnabled}
        currentUserId={user?.id}
      />

      {/* Discovered Synergies list */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Discovered Synergies</h2>
        <button 
          onClick={handleClearSynergies}
          style={{ 
            padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem', fontWeight: 'bold'
          }}
        >
          Clear All
        </button>
      </div>

      {synergies.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)' }}>
          <p style={{ color: 'var(--text-tertiary)' }}>No synergies detected yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {synergies.map(syn => (
            <div key={syn.id} className="glass-card" style={{ marginBottom: 'var(--space-lg)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Detected: {new Date(syn.generated_at).toLocaleDateString()}</span>
                <span style={{ 
                  background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', 
                  padding: '4px 12px', borderRadius: '16px', fontWeight: 'bold' 
                }}>
                  Match Score: {Math.round(syn.score * 100)}%
                </span>
              </div>
              
              {syn.agent_type && (
                <div style={{ marginBottom: 'var(--space-sm)' }}>
                  <span style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                  }}>
                    Agent: {syn.agent_type}
                  </span>
                </div>
              )}
              
              {syn.reason && (
                <div style={{ marginBottom: 'var(--space-md)', background: 'var(--bg-secondary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{syn.reason}</p>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Entity A ID: {syn.entity_a_id}</p>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Entity B ID: {syn.entity_b_id}</p>
                </div>
              </div>

              {syn.review_result ? (
                <div style={{ fontSize: '0.875rem', color: syn.review_result === 'useful' ? 'var(--success)' : 'var(--text-tertiary)', textAlign: 'right' }}>
                  Reviewed as: {syn.review_result === 'useful' ? 'Useful ✅' : 'Not Useful ❌'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                  <button 
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                    onClick={() => handleReview(syn.id, 'not_useful')}
                  >
                    Not Useful
                  </button>
                  <button 
                    style={{ padding: '4px 12px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}
                    onClick={() => handleReview(syn.id, 'useful')}
                  >
                    Useful
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
