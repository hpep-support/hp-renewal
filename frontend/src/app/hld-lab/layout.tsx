import Link from "next/link";

export const metadata = {
  title: "HLD Lab | Future Constellation",
  description: "未来の社会実装プラットフォーム HLD Lab",
};

export default function HLDLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/hld-lab" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
            HLD Lab
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
            <Link href="/hld-lab/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/hld-lab/service" className="hover:text-white transition-colors">Service</Link>
            <Link href="/hld-lab/news" className="hover:text-white transition-colors">News</Link>
            <Link href="/hld-lab/fee" className="hover:text-white transition-colors">Fee</Link>
            <Link href="/hld-lab/partner" className="hover:text-white transition-colors">Partner</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden md:block">
              Member Login
            </Link>
            <Link href="/hld-lab/contact" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full transition-colors border border-white/10">
              Contact Us
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/hld-lab" className="text-xl font-bold tracking-tight text-white flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500" />
              HLD Lab
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6">
              未来の社会実装プラットフォーム。<br/>
              多様な熱量をつなぎ、社会へ実装するための<br/>
              統合アーキテクチャ。
            </p>
            <div className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} HLD Lab. All rights reserved.
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">HLD Lab</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/hld-lab/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/hld-lab/service" className="hover:text-white transition-colors">Service</Link></li>
              <li><Link href="/hld-lab/fee" className="hover:text-white transition-colors">Fee</Link></li>
              <li><Link href="/hld-lab/news" className="hover:text-white transition-colors">News</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link href="/hld-lab/partner" className="hover:text-white transition-colors">Partner</Link></li>
              <li><Link href="/hld-lab" className="hover:text-white transition-colors">Future Constellation</Link></li>
              <li><Link href="/hld-lab/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
