export default function FeePage() {
  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          Fee <span className="text-xl text-slate-500 font-normal ml-2">料金体系</span>
        </h1>
        
        <div className="mt-12 space-y-8">
          <p className="text-slate-300">
            HLD Labが提供するコンサルティング、コミュニティマネジメント、およびアドバイザリーサービスの基本料金体系です。プロジェクトの規模や期間に応じて柔軟にお見積もりいたします。
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Plan 1 */}
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 flex flex-col h-full">
              <h2 className="text-xl font-semibold text-white mb-2">戦略総務コンサルティング</h2>
              <p className="text-slate-400 text-sm mb-6 flex-1">組織の変革を促す総務・ファシリティマネジメントの戦略立案と実行支援。</p>
              <div className="text-3xl font-bold text-indigo-400 mb-6">
                個別お見積り
              </div>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-2 items-start"><span className="text-indigo-500">✓</span> 現状分析・アセスメント</li>
                <li className="flex gap-2 items-start"><span className="text-indigo-500">✓</span> ワークプレイス戦略策定</li>
                <li className="flex gap-2 items-start"><span className="text-indigo-500">✓</span> 実行支援・定着化</li>
              </ul>
            </div>

            {/* Plan 2 */}
            <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900/50 p-8 rounded-2xl border border-indigo-500/30 flex flex-col h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                推奨
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">コミュニティマネジメント支援</h2>
              <p className="text-slate-400 text-sm mb-6 flex-1">社内外の共創コミュニティの立ち上げ、運営、そしてAI連携による可視化。</p>
              <div className="text-3xl font-bold text-indigo-400 mb-6">
                月額 <span className="text-white text-xl">ご相談</span>
              </div>
              <ul className="space-y-3 text-slate-300 text-sm">
                <li className="flex gap-2 items-start"><span className="text-indigo-400">✓</span> コミュニティ設計・企画</li>
                <li className="flex gap-2 items-start"><span className="text-indigo-400">✓</span> 運営事務局サポート</li>
                <li className="flex gap-2 items-start"><span className="text-indigo-400">✓</span> 「未来の星座」システムの導入支援</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
