"use client";

import { useState, useEffect } from "react";

interface Proposal {
  id: number;
  agent_type: string;
  proposal_type: string;
  target_entity_id?: number;
  target_entity_name?: string;
  target_context_id?: number;
  affects_person_id?: number;
  current_value: string;
  proposed_value: string;
  reasoning: string;
  evidence_urls: string;
  status: string;
  created_at: string;
}

interface HermesProposalsProps {
  onProposalReviewed?: () => void;
}

export default function HermesProposals({ onProposalReviewed }: HermesProposalsProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [stats, setStats] = useState<any>({ pending: 0, approved: 0, auto_applied: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      // Fetch stats
      const statsRes = await fetch(`${apiUrl}/api/agents/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch proposals by status filter
      const res = await fetch(`${apiUrl}/api/agents/proposals?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProposals(await res.json());
      }
    } catch (err) {
      console.error("Error fetching Hermes proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleReview = async (id: number, action: "approve" | "reject") => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/agents/proposals/${id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchData();
        if (onProposalReviewed) onProposalReviewed();
      } else {
        alert("Failed to review proposal");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAgent = async (agentType: string) => {
    setRunningAgent(agentType);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiUrl}/api/agents/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agent_type: agentType }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`エージェント実行完了: ${data.created_proposals_count} 件の提案が作成されました`);
        fetchData();
        if (onProposalReviewed) onProposalReviewed();
      }
    } catch (err) {
      console.error(err);
      alert("エージェント実行中にエラーが発生しました");
    } finally {
      setRunningAgent(null);
    }
  };

  const getAgentBadgeColor = (agentType: string) => {
    switch (agentType) {
      case "time_resolver":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa", label: "Time Resolver" };
      case "error_corrector":
        return { bg: "rgba(245, 158, 11, 0.15)", text: "#fbbf24", label: "Error Corrector" };
      case "discovery_crawler":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#c084fc", label: "Discovery Crawler" };
      case "pooling":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#34d399", label: "Pooling Engine" };
      default:
        return { bg: "rgba(107, 114, 128, 0.15)", text: "#9ca3af", label: agentType };
    }
  };

  return (
    <div className="glass-card" style={{ marginBottom: "var(--space-xl)", padding: "var(--space-lg)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            🤖 Hermes Proposals
          </h2>
          <span style={{
            background: stats.pending > 0 ? "rgba(239, 68, 68, 0.2)" : "rgba(107, 114, 128, 0.2)",
            color: stats.pending > 0 ? "var(--error)" : "var(--text-tertiary)",
            fontSize: "0.75rem",
            padding: "2px 8px",
            borderRadius: "12px",
            fontWeight: "bold"
          }}>
            {stats.pending} pending
          </span>
        </div>

        {/* Agent Run Controls */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => handleRunAgent("time_resolver")}
            disabled={runningAgent !== null}
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(59, 130, 246, 0.1)",
              color: "#60a5fa",
              cursor: runningAgent ? "not-allowed" : "pointer"
            }}
          >
            {runningAgent === "time_resolver" ? "解決中..." : "日時解決"}
          </button>
          <button
            onClick={() => handleRunAgent("error_corrector")}
            disabled={runningAgent !== null}
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(245, 158, 11, 0.1)",
              color: "#fbbf24",
              cursor: runningAgent ? "not-allowed" : "pointer"
            }}
          >
            {runningAgent === "error_corrector" ? "分析中..." : "矛盾修正"}
          </button>
          <button
            onClick={() => handleRunAgent("discovery_crawler")}
            disabled={runningAgent !== null}
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(168, 85, 247, 0.1)",
              color: "#c084fc",
              cursor: runningAgent ? "not-allowed" : "pointer"
            }}
          >
            {runningAgent === "discovery_crawler" ? "探索中..." : "情報収集"}
          </button>
          <button
            onClick={() => handleRunAgent("pooling")}
            disabled={runningAgent !== null}
            style={{
              padding: "4px 10px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#34d399",
              cursor: runningAgent ? "not-allowed" : "pointer"
            }}
          >
            {runningAgent === "pooling" ? "プーリング中..." : "プーリング"}
          </button>
          <button
            onClick={() => handleRunAgent("all")}
            disabled={runningAgent !== null}
            style={{
              padding: "4px 12px",
              fontSize: "0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--accent-primary)",
              color: "#fff",
              fontWeight: "bold",
              cursor: runningAgent ? "not-allowed" : "pointer"
            }}
          >
            {runningAgent === "all" ? "Hermes実行中..." : "全Hermes実行"}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "var(--space-md)" }}>
        {["pending", "approved", "auto_applied", "rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            style={{
              background: "none",
              border: "none",
              borderBottom: filter === st ? "2px solid var(--accent-primary)" : "none",
              color: filter === st ? "var(--text-primary)" : "var(--text-tertiary)",
              fontWeight: filter === st ? "bold" : "normal",
              fontSize: "0.85rem",
              padding: "4px 8px",
              cursor: "pointer"
            }}
          >
            {st === "pending" && `承認待ち (${stats.pending || 0})`}
            {st === "approved" && `承認済み (${stats.approved || 0})`}
            {st === "auto_applied" && `自動適用 (${stats.auto_applied || 0})`}
            {st === "rejected" && `却下 (${stats.rejected || 0})`}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      {loading ? (
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>読み込み中...</p>
      ) : proposals.length === 0 ? (
        <div style={{ padding: "var(--space-md) 0", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
          該当するHermesの提案はありません。
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {proposals.map((p) => {
            const badge = getAgentBadgeColor(p.agent_type);
            let parsedProposed: any = {};
            try {
              parsedProposed = JSON.parse(p.proposed_value);
            } catch (e) {
              parsedProposed = { raw: p.proposed_value };
            }

            return (
              <div
                key={p.id}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--space-md)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        fontSize: "0.75rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ fontSize: "0.875rem", fontWeight: "bold", color: "var(--text-primary)" }}>
                      {p.proposal_type === "update_date" && `Context #${p.target_context_id}: 日時設定`}
                      {p.proposal_type === "fix_entity" && `エンティティ統合: ${p.target_entity_name || `ID #${p.target_entity_id}`}`}
                      {p.proposal_type === "add_context" && `新規情報発見: ${p.target_entity_name || `Entity #${p.target_entity_id}`}`}
                      {p.proposal_type === "match_pooling" && `プーリング提案: ${parsedProposed.theme || "協業候補"}`}
                    </span>
                  </div>

                  {p.affects_person_id && (
                    <span style={{ fontSize: "0.75rem", color: "#fbbf24", display: "flex", alignItems: "center", gap: "4px" }}>
                      🔔 本人に通知済み
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  {p.reasoning}
                </p>

                {/* Detail Content Preview */}
                {parsedProposed.body && (
                  <div style={{ background: "var(--bg-tertiary)", padding: "6px 10px", borderRadius: "4px", fontSize: "0.8rem", color: "var(--text-primary)" }}>
                    "{parsedProposed.body}"
                  </div>
                )}
                {parsedProposed.canonical_name && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    統合先: <strong>{parsedProposed.canonical_name}</strong> (ID #{parsedProposed.canonical_entity_id})
                  </div>
                )}
                {parsedProposed.info_date && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    基準日時: <code>{parsedProposed.info_date}</code> ({parsedProposed.info_date_source || "explicit"})
                  </div>
                )}

                {/* Actions */}
                {p.status === "pending" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={() => handleReview(p.id, "reject")}
                      style={{
                        padding: "4px 12px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "var(--error)",
                        cursor: "pointer"
                      }}
                    >
                      ✗ 却下
                    </button>
                    <button
                      onClick={() => handleReview(p.id, "approve")}
                      style={{
                        padding: "4px 14px",
                        fontSize: "0.8rem",
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "var(--success)",
                        fontWeight: "bold",
                        cursor: "pointer"
                      }}
                    >
                      ✓ 承認 (Approve)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
