"use client";

import Link from "next/link";
import { CommunityProvider, useCommunity } from "./CommunityProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
function CommunitySwitcher() {
  const { communities, currentCommunityId, setCurrentCommunityId, refreshCommunities } = useCommunity();
  const [isCreating, setIsCreating] = useState(false);
  const [newCommunityName, setNewCommunityName] = useState("");

  const handleCreate = async () => {
    if (!newCommunityName.trim()) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/communities/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCommunityName })
      });
      if (res.ok) {
        const newCommunity = await res.json();
        await refreshCommunities();
        setCurrentCommunityId(newCommunity.id);
        setIsCreating(false);
        setNewCommunityName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="px-4 py-4 border-b border-slate-800/60">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Community</div>
      <select 
        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-1.5 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
        value={currentCommunityId || ""}
        onChange={(e) => setCurrentCommunityId(Number(e.target.value))}
      >
        {communities.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      
      {isCreating ? (
        <div className="flex gap-2 mt-2">
          <input 
            type="text" 
            autoFocus
            placeholder="Name..." 
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-md py-1 px-2 text-sm focus:outline-none"
            value={newCommunityName}
            onChange={(e) => setNewCommunityName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs font-medium">Add</button>
          <button onClick={() => setIsCreating(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-xs font-medium">Cancel</button>
        </div>
      ) : (
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-center gap-1 py-1.5 mt-1 border border-dashed border-slate-700 rounded-md text-xs text-slate-400 hover:text-slate-300 hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Community
        </button>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleLogout = () => {};

  return (
    <CommunityProvider>
      <div className="flex h-screen bg-slate-950 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800/60 bg-slate-950/30 backdrop-blur-xl flex flex-col hidden md:flex h-full z-20">
          <div className="p-6 pb-2">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-100 text-xl">
              <span className="h-8 w-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </span>
              DAO Utility
            </Link>
          </div>
          
          <CommunitySwitcher />

          <nav className="flex-1 px-4 py-4 flex flex-col gap-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Records
            </Link>
            <Link href="/dashboard/synergies" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Synergies
            </Link>
            <Link href="/dashboard/context" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Context
            </Link>
          </nav>
            <div className="p-4 border-t border-slate-800/60 flex flex-col gap-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-colors cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-medium">
                  U
                </div>
                <span>User Profile</span>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem("access_token");
                  router.push("/login");
                }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Logout
              </button>
            </div>
          </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-y-auto">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </CommunityProvider>
  );
}
