"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCommunity } from "../CommunityProvider";

const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), { ssr: false });

export default function ConstellationPage() {
  const router = useRouter();
  const { currentCommunityId } = useCommunity();
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [layoutType, setLayoutType] = useState("force");

  const fetchContexts = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }
      
      if (!currentCommunityId) {
        setContexts([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts?community_id=${currentCommunityId}`, {
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router, currentCommunityId]);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Future Constellation</h1>
          <p className="text-slate-400 mt-1">コミュニティ内の繋がりを可視化するデータ駆動型ネットワーク</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="colorful">Colorful Theme</option>
          </select>
          <select 
            value={layoutType}
            onChange={(e) => setLayoutType(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border bg-slate-800 border-slate-700 text-slate-300 outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="force">Force Directed</option>
            <option value="radial">Radial</option>
            <option value="hierarchical">Hierarchical</option>
          </select>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <NetworkGraph 
            contexts={contexts} 
            theme={theme}
            layoutType={layoutType}
            heroMode={true}
          />
        )}
      </div>
    </div>
  );
}
