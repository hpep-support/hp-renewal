export default function AboutPage() {
  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          About Us <span className="text-xl text-slate-500 font-normal ml-2">HLD Labについて</span>
        </h1>
        
        <div className="prose prose-invert prose-lg max-w-none mt-12 text-slate-300">
          <p className="lead text-xl text-indigo-300 font-medium mb-8">
            組織社会で「働く」時間は人生時間の多くを占めています。<br/>
            でも、人間は働くことが人生の目的ではありません。
          </p>
          
          <p>
            人生で「働く」意味とは、生きる糧を得るだけではなく、自己実現や生きている意味を感じ、喜びや悲しみを受け止めながら「わくわく」できる幸福人生を楽しむことです。
          </p>
          
          <p>
            働く人たちが「わくわく」しながら、個性を発揮し、イノベーションを起こす。そんな未来の社会実装プラットフォームを目指しています。
          </p>

          <h3 className="text-2xl font-semibold text-white mt-16 mb-6">会社概要</h3>
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-400 w-1/3">会社名</th>
                  <td className="px-6 py-4 text-white">株式会社HLD Lab (エイチエルディ・ラボ)</td>
                </tr>
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-400">設立</th>
                  <td className="px-6 py-4 text-white">2019年</td>
                </tr>
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-400">代表者</th>
                  <td className="px-6 py-4 text-white">岡田 大士郎 (Daishiro Okada)</td>
                </tr>
                <tr>
                  <th className="px-6 py-4 font-medium text-slate-400">事業内容</th>
                  <td className="px-6 py-4 text-white">
                    ・戦略総務コンサルティング<br/>
                    ・組織・人財開発プログラムの提供<br/>
                    ・コミュニティマネジメント支援
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
