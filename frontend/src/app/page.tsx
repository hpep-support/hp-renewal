"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login API Call
        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("username", email);
        formData.append("password", password);

        const res = await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        });

        if (!res.ok) {
          throw new Error("Invalid credentials");
        }

        const data = await res.json();
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard");
      } else {
        // Register API Call
        const res = await fetch("http://localhost:8000/api/auth/invite", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            display_name: displayName,
            invite_code: inviteCode,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Registration failed");
        }

        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-gradient" style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 'var(--space-md)' }}>
          Hermes Hub
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
          {isLogin ? "Welcome back to the DAO" : "Join the Community"}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div style={{ color: error.includes("success") ? 'var(--success)' : 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 'var(--space-sm)' }}>
            {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Register with Invite")}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)', fontSize: '0.875rem' }}>
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={{ color: 'var(--text-tertiary)' }}
          >
            {isLogin ? "Don't have an account? Use invite code" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
