export default function NewsPage() {
  const mockNews = [
    { id: 1, date: "2026.09.18", title: "HLD Lab ホームページをリニューアルしました", category: "お知らせ" },
    { id: 2, date: "2026.08.05", title: "「未来の社会実装プラットフォーム」構想を発表", category: "プレスリリース" },
    { id: 3, date: "2026.07.22", title: "自律AIエージェント「Hermes」の実証実験を開始", category: "プロジェクト" },
    { id: 4, date: "2026.06.10", title: "第3回 ウェルビーイング・コミュニティイベント開催のご報告", category: "イベント" },
  ];

  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          News <span className="text-xl text-slate-500 font-normal ml-2">新着情報</span>
        </h1>
        
        <div className="mt-12 space-y-4">
          {mockNews.map((news) => (
            <article 
              key={news.id} 
              className="group flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4 md:w-1/4 shrink-0">
                <time className="text-slate-400 font-mono text-sm">{news.date}</time>
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full border border-indigo-500/20">
                  {news.category}
                </span>
              </div>
              <h2 className="text-lg text-slate-200 font-medium group-hover:text-white transition-colors">
                {news.title}
              </h2>
            </article>
          ))}
        </div>
        
        {/* Pagination mock */}
        <div className="mt-12 flex justify-center gap-2">
          <button className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">1</button>
          <button className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-medium transition-colors">2</button>
          <button className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-medium transition-colors">&rsaquo;</button>
        </div>
      </div>
    </main>
  );
}
