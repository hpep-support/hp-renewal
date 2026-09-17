export default function ContactPage() {
  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          Contact <span className="text-xl text-slate-500 font-normal ml-2">お問い合わせ</span>
        </h1>
        
        <div className="mt-12 bg-slate-900/50 p-8 md:p-12 rounded-2xl border border-slate-800">
          <p className="text-slate-300 mb-8 text-sm">
            サービスに関するご相談、パートナーシップに関するお問い合わせなど、お気軽にご連絡ください。<br/>
            内容を確認次第、担当者よりご連絡させていただきます。
          </p>

          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">会社名・団体名 <span className="text-indigo-400">*</span></label>
                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="株式会社HLD Lab" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">お名前 <span className="text-indigo-400">*</span></label>
                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="山田 太郎" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">メールアドレス <span className="text-indigo-400">*</span></label>
              <input type="email" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="info@hld-lab.jp" required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">お問い合わせ種別 <span className="text-indigo-400">*</span></label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                <option value="">選択してください</option>
                <option value="service">サービスに関するご相談</option>
                <option value="partner">パートナーシップ・協賛について</option>
                <option value="media">取材・メディア掲載について</option>
                <option value="other">その他のお問い合わせ</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">お問い合わせ内容 <span className="text-indigo-400">*</span></label>
              <textarea rows={6} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="具体的なご相談内容をご記入ください..." required></textarea>
            </div>

            <div className="pt-4">
              <button type="button" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                送信内容を確認する
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
