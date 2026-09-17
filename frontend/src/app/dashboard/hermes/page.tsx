"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCommunity } from "../CommunityProvider";

export default function HermesProposalsPage() {
  const router = useRouter();
  const { currentCommunityId } = useCommunity();
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/agents/proposals?status=${statusFilter}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error("Failed to fetch proposals");
      }

      const data = await res.json();
      setProposals(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/agents/proposals/${id}/${action}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} proposal`);
      }
      
      // Refresh list
      fetchProposals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getAgentName = (agentType: string) => {
    switch (agentType) {
      case "time_resolver": return "Time Resolver";
      case "error_corrector": return "Error Corrector";
      case "discovery_crawler": return "Discovery Crawler";
      default: return agentType;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case "time_resolver": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "error_corrector": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      case "discovery_crawler": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      default: return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-indigo-400">
          Hermes Proposals
        </h1>
        <p className="text-slate-400 mt-2">
          Review and approve changes suggested by the Hermes AI Agents.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setStatusFilter("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Pending
        </button>
        <button 
          onClick={() => setStatusFilter("approved")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'approved' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Approved
        </button>
        <button 
          onClick={() => setStatusFilter("rejected")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'rejected' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-lg">No {statusFilter} proposals found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <div key={proposal.id} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getAgentColor(proposal.agent_type)}`}>
                    🤖 {getAgentName(proposal.agent_type)}
                  </span>
                  <span className="text-slate-300 font-medium">
                    {proposal.proposal_type === 'fix_entity' ? 'Entity Merge Proposal' : 
                     proposal.proposal_type === 'update_date' ? 'Date Update Proposal' : proposal.proposal_type}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(proposal.created_at).toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-950 rounded-lg p-4 mb-4 border border-slate-800">
                <p className="text-slate-300 text-sm leading-relaxed mb-3">
                  <strong>Reasoning:</strong> {proposal.reasoning}
                </p>
                
                {proposal.proposal_type === 'fix_entity' && proposal.current_value && proposal.proposed_value && (
                  <div className="flex items-center gap-4 text-sm bg-slate-900 p-3 rounded-md border border-slate-800/50">
                    <div className="flex-1 text-rose-400 line-through text-center">
                      {proposal.current_value.name}
                    </div>
                    <div className="text-slate-500">➔</div>
                    <div className="flex-1 text-teal-400 font-bold text-center">
                      {proposal.proposed_value.canonical_name}
                    </div>
                  </div>
                )}
                
                {proposal.proposal_type === 'update_date' && proposal.current_value && proposal.proposed_value && (
                  <div className="flex items-center gap-4 text-sm bg-slate-900 p-3 rounded-md border border-slate-800/50">
                    <div className="flex-1 text-center text-slate-400">
                      Context #{proposal.target_name?.replace('Context #', '')}
                    </div>
                    <div className="text-slate-500">➔</div>
                    <div className="flex-1 text-teal-400 font-bold text-center">
                      Set Date to: {new Date(proposal.proposed_value.info_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {proposal.status === "pending" && (
                <div className="flex gap-3 justify-end mt-2">
                  <button 
                    onClick={() => handleAction(proposal.id, "reject")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors border border-slate-700"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => handleAction(proposal.id, "approve")}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    Approve & Apply
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
