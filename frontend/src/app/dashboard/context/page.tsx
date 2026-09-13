"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContextPage() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New context form state
  const [body, setBody] = useState("");
  const [contextType, setContextType] = useState<"asis" | "tobe">("asis");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchContexts();
  }, []);

  const fetchContexts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts`, {
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
        throw new Error("Failed to fetch contexts");
      }

      const data = await res.json();
      setContexts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          body,
          context_type: contextType
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create context");
      }

      const newContext = await res.json();
      setContexts([newContext, ...contexts]);
      setBody("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 pb-12">
      {/* Form Section */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-indigo-400">
            Community Context
          </h1>
          <p className="text-slate-400 mt-2">
            Define the As-Is (current state) and To-Be (ideal state) of our DAO.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4 sticky top-8">
          <h2 className="text-lg font-semibold text-slate-200">Add New Context</h2>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Type</label>
            <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setContextType("asis")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  contextType === "asis" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                As-Is (Current)
              </button>
              <button
                type="button"
                onClick={() => setContextType("tobe")}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  contextType === "tobe" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"
                }`}
              >
                To-Be (Ideal)
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea 
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              placeholder="Describe the context here..."
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || !body.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? "Adding..." : "Add Context"}
          </button>
        </form>
      </div>

      {/* List Section */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center bg-slate-900/30 p-4 rounded-xl border border-slate-800/60">
          <h3 className="text-slate-300 font-medium">Context Statements</h3>
          <button onClick={fetchContexts} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : contexts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 mb-2">No contexts defined yet</p>
            <p className="text-sm text-slate-500">Add the first As-Is or To-Be context on the left.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contexts.map((context) => (
              <div key={context.id} className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors flex gap-4">
                <div className="flex-shrink-0 pt-1">
                  {context.context_type === "asis" ? (
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      As-Is
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30">
                      To-Be
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(context.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {context.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
