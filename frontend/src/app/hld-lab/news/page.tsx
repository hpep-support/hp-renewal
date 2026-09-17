"use client";

import { useEffect, useState } from "react";

interface Article {
  id: number;
  title: string;
  body: string;
  category: string | null;
  published_at: string | null;
  author_name: string | null;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/blog/public`);
        if (res.ok) {
          const data = await res.json();
          setArticles(data);
        }
      } catch (err) {
        console.error("Failed to fetch news", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  return (
    <main className="w-full min-h-screen bg-slate-950 pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 border-b border-slate-800 pb-4">
          News <span className="text-xl text-slate-500 font-normal ml-2">新着情報</span>
        </h1>
        
        <div className="mt-12 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-4 w-32 bg-slate-800 rounded"></div>
                <div className="h-4 w-64 bg-slate-800 rounded"></div>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-slate-500">記事はまだありません。</p>
            </div>
          ) : (
            articles.map((article) => (
              <article 
                key={article.id} 
                className="group flex flex-col md:flex-row md:items-start gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col md:items-start gap-2 md:w-1/4 shrink-0 mt-1">
                  <div className="flex items-center gap-3">
                    <time className="text-slate-400 font-mono text-sm">
                      {article.published_at 
                        ? new Date(article.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') 
                        : "----.--.--"}
                    </time>
                  </div>
                  {article.category && (
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded-full border border-indigo-500/20 inline-block w-fit">
                      {article.category}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl text-slate-200 font-medium group-hover:text-white transition-colors mb-2">
                    {article.title}
                  </h2>
                  <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">
                    {article.body}
                  </p>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                      {article.author_name ? article.author_name.charAt(0).toUpperCase() : "U"}
                    </div>
                    {article.author_name || "Unknown Author"}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        
        {/* Pagination mock */}
        {!loading && articles.length > 0 && (
          <div className="mt-12 flex justify-center gap-2">
            <button className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">1</button>
          </div>
        )}
      </div>
    </main>
  );
}
