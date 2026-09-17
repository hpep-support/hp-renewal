"use client";

import { useState, useEffect } from "react";
import NetworkGraph from "./NetworkGraph";

export default function ConstellationHero() {
  const [contexts, setContexts] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock data for the Future Constellation
    const mockContexts = [
      {
        id: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        extracted_entities: JSON.stringify([
          { source: "John Doe", source_type: "person", target: "HLD Renewal", target_type: "project", type: "leads" },
          { source: "Jane Smith", source_type: "person", target: "HLD Renewal", target_type: "project", type: "contributes" }
        ])
      },
      {
        id: 2,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        extracted_entities: JSON.stringify([
          { source: "AI Hermes", source_type: "organization", target: "Data Pipeline", target_type: "project", type: "manages" },
          { source: "John Doe", source_type: "person", target: "Data Pipeline", target_type: "project", type: "collaborates" },
          { source: "Taro Yamada", source_type: "person", target: "AI Hermes", target_type: "organization", type: "develops" }
        ])
      },
      {
        id: 3,
        created_at: new Date().toISOString(),
        extracted_entities: JSON.stringify([
          { source: "Jane Smith", source_type: "person", target: "AI Hermes", target_type: "organization", type: "consults" },
          { source: "Future AR", source_type: "project", target: "AI Hermes", target_type: "organization", type: "integrates" },
          { source: "Taro Yamada", source_type: "person", target: "Future AR", target_type: "project", type: "researches" }
        ])
      }
    ];
    setContexts(mockContexts);
  }, []);

  return (
    <div className="relative w-full h-[80vh] min-h-[600px] overflow-hidden bg-slate-950 flex items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      {/* Graph */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen pointer-events-auto">
        {contexts.length > 0 && (
          <NetworkGraph 
            contexts={contexts} 
            theme="dark" 
            layoutType="force" 
            heroMode={true} 
          />
        )}
      </div>

      {/* Hero Content Overlay */}
      <div className="relative z-10 text-center px-6 max-w-4xl pointer-events-none">
        <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-md">
          Phase 1: Constellation Base
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-100 to-slate-400 mb-6 drop-shadow-sm">
          Future Constellation
        </h1>
        <p className="text-lg md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Weaving individual passions into a collective force.<br/>
          The next-generation platform for societal implementation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
          <button className="px-8 py-4 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full font-semibold transition-all shadow-[0_0_30px_-5px_rgba(79,70,229,0.4)] backdrop-blur-sm">
            Explore Ecosystem
          </button>
          <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-semibold transition-all border border-white/10 backdrop-blur-sm">
            Join HLD Lab
          </button>
        </div>
      </div>
      
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
}
