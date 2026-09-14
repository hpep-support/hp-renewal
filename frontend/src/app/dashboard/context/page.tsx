"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import NetworkGraph from "@/components/NetworkGraph";

export default function ContextPage() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // New context form state
  const [body, setBody] = useState("");
  const [contextType, setContextType] = useState<"asis" | "tobe">("asis");
  const [resourceUrl, setResourceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
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

  const handleEdit = (context: any) => {
    setEditingId(context.id);
    setBody(context.body);
    setContextType(context.context_type);
    setResourceUrl(context.resource_url || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this context?")) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to delete context");
      }

      setContexts(contexts.filter((c) => c.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setBody("");
        setResourceUrl("");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts`;
        
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          body,
          context_type: contextType,
          resource_url: resourceUrl ? resourceUrl : null
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${editingId ? "update" : "create"} context`);
      }

      const newContext = await res.json();
      
      if (editingId) {
        setContexts(contexts.map(c => c.id === editingId ? newContext : c));
      } else {
        setContexts([newContext, ...contexts]);
      }
      
      setBody("");
      setResourceUrl("");
      setEditingId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [newEntityName, setNewEntityName] = useState("");

  const handleRenameEntity = async () => {
    if (!selectedEntity || !newEntityName.trim() || selectedEntity === newEntityName.trim()) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts/entities/rename`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ old_name: selectedEntity, new_name: newEntityName.trim() })
      });
      if (res.ok) {
        fetchContexts();
        setSelectedEntity(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEntity = async () => {
    if (!selectedEntity) return;
    if (!confirm(`Are you sure you want to delete "${selectedEntity}" and all its connections?`)) return;
    
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts/entities/${encodeURIComponent(selectedEntity)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchContexts();
        setSelectedEntity(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNodeSelect = (nodeName: string | null) => {
    setSelectedEntity(nodeName);
    if (nodeName) {
      setNewEntityName(nodeName);
    } else {
      setNewEntityName("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pb-12">
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

        <div className="flex flex-col gap-6 sticky top-8">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-200">
                {editingId ? "Edit Context" : "Add New Context"}
              </h2>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingId(null);
                    setBody("");
                    setResourceUrl("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              )}
            </div>
            
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

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Resource URL (Optional)</label>
              <input 
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="NotebookLM or Google Drive URL"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !body.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (editingId ? "Updating..." : "Adding...") : (editingId ? "Update Context" : "Add Context")}
            </button>
          </form>

          {/* Entity Editor Panel */}
          <div className={`glass-panel p-6 rounded-2xl border border-slate-700/50 transition-all duration-300 ${selectedEntity ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                Entity Editor
              </h2>
              <button 
                type="button" 
                onClick={() => handleNodeSelect(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-sm font-medium text-slate-300">Name</label>
              <input 
                type="text"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handleRenameEntity}
                disabled={!newEntityName.trim() || newEntityName === selectedEntity}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update
              </button>
              <button 
                onClick={handleDeleteEntity}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-xl font-medium transition-all border border-red-500/30"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        
        {/* Network Graph Visualization */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-700/50">
          <h3 className="text-slate-300 font-medium mb-4 px-2">Context Network Visualization</h3>
          <NetworkGraph 
            contexts={contexts} 
            onNodeSelect={handleNodeSelect}
            activeNodeName={selectedEntity}
          />
        </div>

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
            {contexts.map((context) => {
              const isHighlighted = selectedEntity && (
                context.body.includes(selectedEntity) || 
                (context.extracted_entities && context.extracted_entities.includes(selectedEntity))
              );
              const isDimmed = selectedEntity && !isHighlighted;
              
              return (
                <div 
                  key={context.id} 
                  className={`glass-panel p-5 rounded-xl border transition-all duration-300 flex gap-4 group
                    ${isHighlighted ? 'border-teal-500/50 bg-teal-500/5 shadow-[0_0_15px_rgba(20,184,166,0.15)]' : 'border-slate-700/50 hover:border-slate-600'}
                    ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
                  `}
                >
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
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(context.created_at).toLocaleString()}
                        </span>
                        {context.resource_url && (
                          <a href={context.resource_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 bg-slate-800 rounded-md text-teal-400 hover:bg-slate-700 transition-colors">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Resource
                          </a>
                        )}
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button 
                          onClick={() => handleEdit(context)}
                          className="text-xs text-slate-400 hover:text-indigo-400 bg-slate-800/50 hover:bg-slate-800 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(context.id)}
                          className="text-xs text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-slate-800 px-2 py-1 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {selectedEntity ? (
                        context.body.split(new RegExp(`(${selectedEntity})`, 'gi')).map((part, i) => 
                          part.toLowerCase() === selectedEntity.toLowerCase() ? (
                            <span key={i} className="bg-teal-500/20 text-teal-300 rounded px-1 -mx-1 border border-teal-500/30 font-medium">
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        )
                      ) : (
                        context.body
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
