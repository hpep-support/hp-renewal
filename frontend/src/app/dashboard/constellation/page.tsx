"use client";

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const NetworkGraph = dynamic(() => import('../../components/NetworkGraph'), { ssr: false });

export default function ConstellationPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // In a real implementation, you would fetch the nodes and links from the backend
    // fetch(`${process.env.NEXT_PUBLIC_API_URL}/graph-data`)
    //  .then(res => res.json())
    //  .then(data => setData(data));
    
    // For now, let the component use its default mock data
  }, []);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Future Constellation</h1>
          <p className="text-slate-400 mt-1">コミュニティ内の繋がりを可視化するデータ駆動型ネットワーク</p>
        </div>
      </div>
      
      <div className="flex-1 w-full relative">
        <NetworkGraph data={data || undefined} />
      </div>
    </div>
  );
}
