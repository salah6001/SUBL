import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { articlesApi } from '@/api/articles';
import type { Article } from '@/types';
import { Clock } from 'lucide-react';
import { getArticlePlaceholder, avatarPlaceholder } from '@/lib/articlePlaceholder';

export default function Articles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(false);
    articlesApi.list(sortBy || undefined)
      .then(setArticles)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [sortBy, retryCount]);

  return (
    <AppLayout title="Articles">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-subl-grey-900">Explore your interests</h2>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-white border border-subl-grey-100 rounded-xl px-4 py-2 text-sm text-subl-grey-600 focus:outline-none focus:ring-2 focus:ring-subl-blue-200"
        >
          <option value="">Sort by</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
              <div className="h-44 bg-subl-grey-100" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-subl-grey-100 rounded w-1/3" />
                <div className="h-4 bg-subl-grey-100 rounded" />
                <div className="h-4 bg-subl-grey-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-subl-grey-600 mb-4">Failed to load articles.</p>
          <button
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-4 py-2 bg-subl-blue-500 text-white rounded-xl text-sm hover:bg-subl-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-subl-grey-500 text-sm">No articles found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => navigate('/articles/' + article.id)}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={article.image || getArticlePlaceholder(article.tag)}
                  alt={article.title}
                  onError={(e) => { e.currentTarget.src = getArticlePlaceholder(article.tag); e.currentTarget.onerror = null; }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-medium text-subl-grey-700">
                  {article.tag}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-subl-grey-500 mb-3">
                  <Clock size={14} />
                  {article.read_time}
                </div>
                <h3 className="text-base font-semibold text-subl-grey-900 mb-2 line-clamp-2 group-hover:text-subl-blue-500 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-subl-grey-500 line-clamp-2 mb-4">{article.excerpt}</p>
                <div className="flex items-center gap-2">
                  <img src={article.author.avatar || avatarPlaceholder(article.author.name)} alt={article.author.name} onError={(e) => { e.currentTarget.src = avatarPlaceholder(article.author.name); e.currentTarget.onerror = null; }} className="w-6 h-6 rounded-full" />
                  <span className="text-xs font-medium text-subl-grey-700">{article.author.name}</span>
                  <span className="text-xs text-subl-grey-400">{article.author.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
