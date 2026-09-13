"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!res.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await res.json();
      localStorage.setItem("access_token", data.access_token);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden min-h-screen items-center justify-center p-6">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-slate-100 mb-2">
            <span className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </span>
            AI DAO Utility
          </Link>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="glass-panel p-8 rounded-2xl flex flex-col gap-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</a>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <p className="text-center text-slate-400 text-sm mt-8">
          Don't have an account? <Link href="/register" className="text-indigo-400 hover:text-indigo-300">Use an invite code</Link>
        </p>
      </div>
    </main>
  );
}
