export default function PartnerPage() {
  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          Partner <span className="text-xl text-slate-500 font-normal ml-2">パートナー・協賛</span>
        </h1>
        
        <div className="mt-12 text-slate-300">
          <p className="mb-12 leading-relaxed">
            HLD Labは、「未来の社会実装プラットフォーム」という理念に共感し、共に新しい価値を創造していくパートナー企業・団体様と協働しています。
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* Mock Partners */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-video bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center group hover:border-indigo-500/30 transition-colors p-6">
                <div className="text-slate-500 font-medium group-hover:text-slate-300 transition-colors text-center">
                  Partner Logo {i}
                  <div className="text-xs text-slate-600 mt-2 font-normal">株式会社 サンプル {i}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 p-8 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">パートナー募集</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-2xl mx-auto">
              私たちと一緒に、働く人たちのウェルビーイングを高め、社会実装のエコシステムを構築しませんか？
            </p>
            <a href="/hld-lab/contact" className="inline-block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-colors">
              お問い合わせ
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
