export default function ServicePage() {
  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          Service <span className="text-xl text-slate-500 font-normal ml-2">事業内容</span>
        </h1>
        
        <div className="space-y-12 mt-12">
          {/* Service 1 */}
          <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
            <h2 className="text-2xl font-semibold text-white mb-4 text-indigo-400">戦略総務アドバイザリー＆コンサルティング</h2>
            <p className="text-slate-300 leading-relaxed">
              総務・ファシリティマネジメントの専門家から、組織における「あるべき総務」の姿と、実践的な手法の実装・定着化までのサービスを行います。
            </p>
          </section>

          {/* Service 2 */}
          <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
            <h2 className="text-2xl font-semibold text-white mb-4 text-indigo-400">人事評価制度並びに人財育成プログラム</h2>
            <p className="text-slate-300 leading-relaxed">
              これからの時代に向けた、新しい働き方と組織のあり方をデザインし、従業員のウェルビーイングを高めるプログラムを提供します。
            </p>
          </section>

          {/* Service 3 */}
          <section className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors">
            <h2 className="text-2xl font-semibold text-white mb-4 text-indigo-400">コミュニティマネジメント</h2>
            <p className="text-slate-300 leading-relaxed">
              社内・社外を問わず、多様な人々が共創できる「場」の設計と運営を支援。未来の星座（ネットワーク）を育むエコシステムの構築をサポートします。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
