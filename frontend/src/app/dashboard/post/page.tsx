"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [disclosureLevel, setDisclosureLevel] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });
    const token = localStorage.getItem("token");

    try {
      const delayMs = parseInt(localStorage.getItem("agentDelayMs") || "0");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/records/?delay_ms=${delayMs}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          body,
          disclosure_level: disclosureLevel
        })
      });

      if (!res.ok) throw new Error("Failed to create post");

      setMessage({ text: "Record successfully saved!", type: "success" });
      setBody("");
      setDisclosureLevel(0);
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>Create a New Record</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
        Share your thoughts, ideas, or meeting notes. You can choose who gets to see this.
      </p>

      <form onSubmit={handleSubmit} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <textarea
          placeholder="What's on your mind? (Markdown supported)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          required
          style={{ resize: 'vertical' }}
        />

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Disclosure Level</label>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="level" 
                checked={disclosureLevel === 0}
                onChange={() => setDisclosureLevel(0)}
              />
              <span>🔒 Level 0: Private (Just for you)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="level" 
                checked={disclosureLevel === 2}
                onChange={() => setDisclosureLevel(2)}
              />
              <span>👥 Level 2: Community (Visible to DAO)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="level" 
                checked={disclosureLevel === 3}
                onChange={() => setDisclosureLevel(3)}
              />
              <span>🌍 Level 3: Public (Publish via Postiz)</span>
            </label>
          </div>
        </div>

        {message.text && (
          <div style={{ padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
          <button type="submit" className="btn-primary" disabled={isSubmitting || !body.trim()}>
            {isSubmitting ? "Saving..." : "Save Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
