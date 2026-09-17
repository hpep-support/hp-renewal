"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/hld-lab");
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0B0F19]">
      <div className="animate-pulse text-indigo-400">Redirecting to HLD Lab...</div>
    </div>
  );
}
