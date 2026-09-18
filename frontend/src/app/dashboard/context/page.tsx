"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContextPage() {
  const router = useRouter();
  const [contexts, setContexts] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [contextType, setContextType] = useState("asis");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editContextType, setEditContextType] = useState("asis");

  const fetchContexts = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:8000/api/contexts/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContexts(data);
      } else {
        if (res.status === 403) router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContexts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    setError("");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:8000/api/contexts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body, context_type: contextType })
      });

      if (!res.ok) throw new Error("Failed to save context");
      
      setBody("");
      fetchContexts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`http://localhost:8000/api/contexts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchContexts();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditBody(c.body);
    setEditContextType(c.context_type);
  };

  const handleEditSave = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:8000/api/contexts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: editBody, context_type: editContextType })
      });
      if (res.ok) {
        setEditingId(null);
        fetchContexts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>Community Context Settings</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        Provide meeting minutes and strategic goals. The AI uses this context to find relevant synergies.
      </p>

      <div className="glass-card" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h3 style={{ marginBottom: 'var(--space-md)' }}>Add New Context</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <textarea
            placeholder="Paste meeting minutes or goals here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
            style={{ resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={contextType === 'asis'}
                onChange={() => setContextType('asis')}
              />
              As-Is (Current State)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                checked={contextType === 'tobe'}
                onChange={() => setContextType('tobe')}
              />
              To-Be (Future Goal)
            </label>
          </div>
          
          {error && <p style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{error}</p>}
          
          <button type="submit" className="btn-primary" disabled={submitting || !body.trim()} style={{ alignSelf: 'flex-start' }}>
            {submitting ? "Saving..." : "Save Context"}
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)' }}>Active Contexts</h3>
      {contexts.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)' }}>No contexts saved yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {contexts.map(c => (
            <div key={c.id} className="glass-card" style={{ padding: 'var(--space-md)', position: 'relative' }}>
              
              {editingId === c.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                    style={{ resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.875rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <input 
                        type="radio" 
                        checked={editContextType === 'asis'}
                        onChange={() => setEditContextType('asis')}
                      />
                      As-Is
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <input 
                        type="radio" 
                        checked={editContextType === 'tobe'}
                        onChange={() => setEditContextType('tobe')}
                      />
                      To-Be
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xs)' }}>
                    <button onClick={() => handleEditSave(c.id)} className="btn-primary" style={{ padding: '4px 12px', fontSize: '0.875rem' }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', fontSize: '0.875rem', border: '1px solid var(--border-color)', borderRadius: '4px' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <span style={{ 
                    position: 'absolute', top: 'var(--space-sm)', right: 'var(--space-md)',
                    background: c.context_type === 'asis' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: c.context_type === 'asis' ? 'var(--warning)' : 'var(--accent-primary)',
                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                  }}>
                    {c.context_type}
                  </span>
                  {c.context_type === 'record_sync' && (
                    <span style={{ 
                      position: 'absolute', top: 'var(--space-sm)', right: '100px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: 'var(--success)',
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                    }}>
                      From Record
                    </span>
                  )}
                  <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginRight: '60px' }}>{c.body}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
                    <button 
                      onClick={() => startEdit(c)}
                      style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      style={{ color: 'var(--error)', fontSize: '0.875rem' }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
