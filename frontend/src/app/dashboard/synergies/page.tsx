"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SynergiesPage() {
  const [synergies, setSynergies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchSynergies();
  }, []);

  const fetchSynergies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/synergies`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch synergies");
      }

      const data = await res.json();
      setSynergies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
            Synergy Candidates
          </h1>
          <p className="text-slate-400 mt-2">
            AI-generated connections between community members' records
          </p>
        </div>
        <button onClick={fetchSynergies} className="text-sm px-4 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors">
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : synergies.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <p className="text-slate-400 mb-2">No synergy candidates generated yet</p>
          <p className="text-sm text-slate-500">Wait for the background AI worker to run or generate them manually.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {synergies.map((synergy) => (
            <div key={synergy.id} className="glass-panel p-6 rounded-2xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/20">
                    Confidence: {Math.round(synergy.confidence_score * 100)}%
                  </span>
                  <span className="px-3 py-1 bg-teal-500/20 text-teal-300 text-xs font-semibold rounded-full border border-teal-500/20">
                    Synergy
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(synergy.generated_at).toLocaleString()}
                </span>
              </div>
              
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-lg mb-6">
                {synergy.summary}
              </p>
              
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Connecting Records</h4>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span className="text-slate-400">Record ID: {synergy.record_id_1}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    <span className="text-slate-400">Record ID: {synergy.record_id_2}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors border border-slate-600">
                  Dismiss
                </button>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
                  Take Action
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
