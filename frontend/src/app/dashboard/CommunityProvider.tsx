"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Community {
  id: number;
  name: string;
}

interface CommunityContextType {
  communities: Community[];
  currentCommunityId: number | null;
  setCurrentCommunityId: (id: number) => void;
  refreshCommunities: () => Promise<void>;
  isLoading: boolean;
}

const CommunityContext = createContext<CommunityContextType | undefined>(undefined);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [currentCommunityId, setCurrentCommunityId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCommunities = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/communities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data: Community[] = await res.json();
        setCommunities(data);
        
        // Auto-select first community if none selected
        if (data.length > 0) {
          const savedId = localStorage.getItem("currentCommunityId");
          if (savedId && data.find(c => c.id === parseInt(savedId))) {
            setCurrentCommunityId(parseInt(savedId));
          } else {
            setCurrentCommunityId(data[0].id);
          }
        } else {
          setCurrentCommunityId(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch communities", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCommunities();
  }, []);

  useEffect(() => {
    if (currentCommunityId !== null) {
      localStorage.setItem("currentCommunityId", currentCommunityId.toString());
    }
  }, [currentCommunityId]);

  return (
    <CommunityContext.Provider value={{ communities, currentCommunityId, setCurrentCommunityId, refreshCommunities, isLoading }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const context = useContext(CommunityContext);
  if (context === undefined) {
    throw new Error("useCommunity must be used within a CommunityProvider");
  }
  return context;
}
