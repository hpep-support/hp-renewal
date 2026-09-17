import ConstellationHero from "@/components/ConstellationHero";

export default function HLDLabPage() {
  return (
    <main className="w-full flex flex-col bg-slate-950">
      {/* Hero Section */}
      <section id="constellation" className="w-full">
        <ConstellationHero />
      </section>

      {/* Vision Section */}
      <section id="vision" className="w-full py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            未来の社会実装プラットフォーム
          </h2>
          <p className="text-lg text-slate-300 leading-relaxed mb-12">
            HLD Labは、組織内の多岐にわたるプロジェクトや人々の熱量を網羅し、社会へ接続する「パブリック出力層」として機能します。
            私たちはクローズドな環境で醸成された活動やインサイトを、最終的に社会へ発信する一番外側のレイヤーを担います。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <h3 className="text-xl font-semibold text-white mb-3">つながる未来の星座</h3>
              <p className="text-slate-400 text-sm">プロジェクトや領域を星座のように表現。内部で蓄積された人物・プロジェクト・組織の相関ネットワークを可視化します。</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <h3 className="text-xl font-semibold text-white mb-3">APIファースト</h3>
              <p className="text-slate-400 text-sm">microCMS等のヘッドレスCMSをハブとし、AI連携やシステム間データ連動を見据えたアーキテクチャを構築します。</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-left">
              <h3 className="text-xl font-semibold text-white mb-3">段階的拡張</h3>
              <p className="text-slate-400 text-sm">Phase 1で2D基盤を固め、将来のAR体験や空間コンピューティング（Phase 2）への布石とします。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="w-full py-24 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-8 hover:border-indigo-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-semibold text-white mb-4 relative z-10">AI Hermes Integration</h3>
              <p className="text-slate-400 mb-6 relative z-10">
                自律エージェント「Hermes」によるコミュニティ情報収集と矛盾修正。API経由でシームレスにHPへ流し込むデータ基盤の構築。
              </p>
              <button className="text-indigo-400 font-medium hover:text-indigo-300 relative z-10 flex items-center gap-2">
                Learn more <span>&rarr;</span>
              </button>
            </div>
            <div className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-8 hover:border-purple-500/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-2xl font-semibold text-white mb-4 relative z-10">Spatial Computing Base</h3>
              <p className="text-slate-400 mb-6 relative z-10">
                エンティティの構造化を通じた、将来的なメタバース空間やAIナビゲーターへの再利用を見据えたプラットフォーム設計。
              </p>
              <button className="text-purple-400 font-medium hover:text-purple-300 relative z-10 flex items-center gap-2">
                Learn more <span>&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      <section id="insights" className="w-full py-24 px-6 relative">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-left hover:-translate-y-1 transition-transform">
                <div className="text-xs text-indigo-400 font-medium mb-3">Research Report</div>
                <h3 className="text-lg font-semibold text-white mb-3">The Role of AI in Community Dynamics {i}</h3>
                <p className="text-slate-400 text-sm mb-4">A deep dive into how large language models are transforming organizational structures and communication.</p>
                <div className="text-xs text-slate-500">2026.09.18</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
