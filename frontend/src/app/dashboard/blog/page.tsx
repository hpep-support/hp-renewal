"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Article {
  id: number;
  title: string;
  body: string;
  category: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const CATEGORIES = ["お知らせ", "プレスリリース", "プロジェクト", "イベント", "その他"];

export default function BlogDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("お知らせ");
  const [isPublished, setIsPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const router = useRouter();

  const fetchArticles = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/blog/articles`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error("Failed to fetch articles", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setCategory("お知らせ");
    setIsPublished(false);
    setEditingArticle(null);
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setBody(article.body);
    setCategory(article.category || "お知らせ");
    setIsPublished(article.is_published);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("本当にこの記事を削除しますか？")) return;
    
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/blog/articles/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchArticles();
        if (editingArticle?.id === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Failed to delete article", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    
    setSubmitting(true);
    const token = localStorage.getItem("access_token");
    
    try {
      const url = editingArticle 
        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/blog/articles/${editingArticle.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/blog/articles`;
        
      const method = editingArticle ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          body,
          category,
          is_published: isPublished
        })
      });

      if (res.ok) {
        resetForm();
        fetchArticles();
      }
    } catch (err) {
      console.error("Failed to save article", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Blog Manager</h1>
          <p className="text-slate-400 mt-1">WordPress風の記事投稿・管理</p>
        </div>
      </div>

      {/* Editor Area */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 opacity-50" />
        <h2 className="text-xl font-semibold text-white mb-4">
          {editingArticle ? "記事を編集" : "新規記事を作成"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="記事のタイトルを入力"
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">本文</label>
            <textarea 
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="記事の本文を入力（マークダウン等には未対応）"
              className="w-full h-48 bg-slate-950/50 border border-slate-800 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y transition-all"
              required
            ></textarea>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-slate-300">公開する（Newsページに表示）</span>
              </label>
            </div>
            
            <div className="flex gap-2">
              {editingArticle && (
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                >
                  キャンセル
                </button>
              )}
              <button 
                type="submit"
                disabled={submitting || !title.trim() || !body.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold transition-all shadow-[0_0_20px_-5px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "保存中..." : (editingArticle ? "更新する" : "保存する")}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* List of articles */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
          あなたの記事
          {loading && <span className="text-sm font-normal text-slate-500 animate-pulse">読み込み中...</span>}
        </h2>
        
        {!loading && articles.length === 0 && (
          <div className="text-center p-12 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500">記事がありません。新しく作成してください。</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <div key={article.id} className="glass-panel p-5 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-medium border rounded-full ${
                    article.is_published 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {article.is_published ? "公開済み" : "下書き"}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                    {article.category || "未分類"}
                  </span>
                  {article.published_at && (
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(article.published_at).toLocaleString()}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-medium text-slate-200 mb-1">{article.title}</h3>
                <p className="text-slate-400 text-sm line-clamp-2">
                  {article.body}
                </p>
              </div>
              
              <div className="flex items-center gap-2 md:shrink-0">
                <button 
                  onClick={() => handleEdit(article)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button 
                  onClick={() => handleDelete(article.id)}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
