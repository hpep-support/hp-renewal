"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface RecordItem {
  id: number;
  body: string;
  disclosure_level: number;
  tags?: string[];
  created_at: string;
}

export default function DashboardRecords() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [body, setBody] = useState("");
  const [disclosureLevel, setDisclosureLevel] = useState(0); // 0: Private, 2: Community, 3: SNS
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const fetchRecords = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/records/`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Failed to fetch records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCreateRecord = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/records/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          body,
          disclosure_level: disclosureLevel
        })
      });

      if (res.ok) {
        setBody("");
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to create record", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getVisibilityBadge = (level: number) => {
    if (level === 0) return <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">Private</span>;
    if (level === 2) return <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Community</span>;
    if (level === 3) return <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">Multi-SNS</span>;
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Your Records</h1>
          <p className="text-slate-400 mt-1">Capture your thoughts, ideas, and memos.</p>
        </div>
      </div>

      {/* Input area */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />
        <textarea 
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's on your mind? Type your memo or idea here..."
          className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
        ></textarea>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-400 font-medium">Visibility:</label>
            <select 
              value={disclosureLevel} 
              onChange={(e) => setDisclosureLevel(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
            >
              <option value={0}>Private (Only me)</option>
              <option value={2}>Community (Share internally)</option>
              <option value={3}>Multi-SNS (Post to external)</option>
            </select>
          </div>
          
          <button 
            onClick={handleCreateRecord}
            disabled={submitting || !body.trim()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Record"}
          </button>
        </div>
      </div>

      {/* List of records */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          Recent Activity
          {loading && <span className="text-sm font-normal text-slate-500 animate-pulse">Loading...</span>}
        </h2>
        
        {!loading && records.length === 0 && (
          <div className="text-center p-12 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500">No records found. Start capturing your ideas above!</p>
          </div>
        )}

        {records.map((record) => (
          <div key={record.id} className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {getVisibilityBadge(record.disclosure_level)}
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(record.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {record.body}
            </p>
            {record.tags && record.tags.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {record.tags.map((tag, i) => (
                  <span key={i} className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
