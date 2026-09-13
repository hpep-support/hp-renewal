import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-8 border border-indigo-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          MVP Version 1.0 Active
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-6 max-w-4xl">
          Discover Hidden Synergies in Your Community
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          AI DAO Utility brings your scattered ideas, memos, and posts together to visualize collaboration opportunities you never knew existed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/login" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] hover:-translate-y-0.5 active:translate-y-0">
            Start Recording
          </Link>
          <Link href="/dashboard" className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700 hover:border-slate-600">
            View Dashboard
          </Link>
        </div>

        {/* Feature Preview Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl text-left">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-100">Unified Records</h3>
            <p className="text-slate-400">Jot down your memos and ideas privately, or share them securely with the community.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-100">AI Synergy Matching</h3>
            <p className="text-slate-400">Our AI analyzes your context and finds overlapping interests among community members.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-100">Multi-SNS Delivery</h3>
            <p className="text-slate-400">Automatically cross-post your public thoughts to X, LinkedIn, and more via Postiz.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
