export default function DashboardRecords() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Your Records</h1>
          <p className="text-slate-400 mt-1">Capture your thoughts, ideas, and memos.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20">
          + New Record
        </button>
      </div>

      {/* Placeholder for the input area */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700/50">
        <textarea 
          placeholder="What's on your mind? Type your memo or idea here..."
          className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
        ></textarea>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="px-2 py-1 bg-slate-800 rounded-md border border-slate-700">Visibility: Private</span>
            <span>Only you can see this</span>
          </div>
          <button className="px-6 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors">
            Save Record
          </button>
        </div>
      </div>

      {/* List of mock records */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 mb-4">Recent</h2>
        
        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Community</span>
            </div>
            <span className="text-xs text-slate-500">2 hours ago</span>
          </div>
          <p className="text-slate-300">
            We should consider using Postiz for our multi-SNS delivery. It seems robust and open-source, which perfectly aligns with our DAO principles.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">#SNS</span>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">#Postiz</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">Private</span>
            </div>
            <span className="text-xs text-slate-500">Yesterday</span>
          </div>
          <p className="text-slate-300">
            Idea for the new community structure: separate the technical discussion from the governance proposals to reduce noise. Need to refine this before proposing.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">#Governance</span>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md">#Ideas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
