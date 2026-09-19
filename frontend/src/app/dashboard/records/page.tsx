"use client";

import { useEffect, useState } from "react";

interface Record {
  id: number;
  body: string;
  disclosure_level: number;
  created_at: string;
  tags: string[] | null;
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/records/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (err) {
        console.error("Failed to fetch records", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const getDisclosureBadge = (level: number) => {
    switch(level) {
      case 0: return <span style={{ background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>🔒 Private</span>;
      case 2: return <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>👥 Community</span>;
      case 3: return <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>🌍 Public (SNS)</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>My Records</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        Manage your past thoughts, ideas, and notes.
      </p>

      {loading ? (
        <p>Loading records...</p>
      ) : records.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)' }}>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-md)' }}>You haven't created any records yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {records.map(record => (
            <div key={record.id} className="glass-card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  {getDisclosureBadge(record.disclosure_level)}
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    {new Date(record.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>{record.body}</p>
              
              {record.tags && record.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                  {record.tags.map(tag => (
                    <span key={tag} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
