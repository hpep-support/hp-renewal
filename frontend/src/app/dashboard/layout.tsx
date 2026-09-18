"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    // Fetch user info
    fetch("http://localhost:8000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          localStorage.removeItem("token");
          router.push("/");
        } else {
          setUser(data);
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="glass-card" style={{ borderRadius: 0, padding: 'var(--space-md) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard">
          <h2 className="text-gradient" style={{ margin: 0, fontSize: '1.25rem' }}>Hermes Hub</h2>
        </Link>
        <nav style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: pathname === '/dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Dashboard</Link>
          <Link href="/dashboard/post" style={{ color: pathname === '/dashboard/post' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>New Post</Link>
          <Link href="/dashboard/records" style={{ color: pathname === '/dashboard/records' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>My Records</Link>
          {user.role === 'owner' && (
            <Link href="/dashboard/context" style={{ color: pathname === '/dashboard/context' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Context Settings</Link>
          )}
          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 var(--space-xs)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>{user.display_name}</span>
          <button onClick={handleLogout} style={{ color: 'var(--error)', fontSize: '0.875rem' }}>Logout</button>
        </nav>
      </header>
      
      <main style={{ flex: 1, padding: 'var(--space-xl) 0' }}>
        {children}
      </main>
    </div>
  );
}
