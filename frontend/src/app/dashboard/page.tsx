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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/records/`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/records/`, {
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
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {record.tags && record.tags.map((tag, i) => (
                  <span key={i} className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
              
              {/* Share buttons for Multi-SNS (level 3) */}
              {record.disclosure_level === 3 && (
                <div className="flex gap-2">
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(record.body)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-medium rounded-lg transition-colors border border-blue-500/20"
                    title="Share on X"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                    X
                  </a>
                  <button 
                    onClick={() => {
                      // 投稿テキストから最初のURLを抽出する
                      const urlMatch = record.body.match(/(https?:\/\/[^\s]+)/);
                      const shareUrl = urlMatch ? urlMatch[1] : "https://example.com";
                      
                      navigator.clipboard.writeText(record.body).then(() => {
                        alert("テキストをクリップボードにコピーしました！Facebookの画面で「貼り付け（Ctrl+V / Cmd+V）」してください。");
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-medium rounded-lg transition-colors border border-indigo-500/20"
                    title="Share on Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.597 0 0 .597 0 1.325v21.351C0 23.403.597 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.597 1.323-1.325V1.325C24 .597 23.403 0 22.675 0z"/></svg>
                    Facebook
                  </button>
                  <a 
                    href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(record.body)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/10 hover:bg-sky-600/20 text-sky-400 text-xs font-medium rounded-lg transition-colors border border-sky-500/20"
                    title="Share on LinkedIn"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
