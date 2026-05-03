import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AppLayout } from '@/components/AppLayout';
import { articlesApi } from '@/api/articles';
import type { Article } from '@/types';
import { ArrowLeft, Clock } from 'lucide-react';
import { getArticlePlaceholder, avatarPlaceholder } from '@/lib/articlePlaceholder';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    articlesApi.get(Number(id))
      .then(setArticle)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppLayout title="Article">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-64 bg-subl-grey-100" />
          <div className="p-8 space-y-4">
            <div className="h-4 bg-subl-grey-100 rounded w-1/2" />
            <div className="h-6 bg-subl-grey-100 rounded" />
            <div className="h-4 bg-subl-grey-100 rounded w-3/4" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !article) {
    return (
      <AppLayout title="Article">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-subl-grey-600 mb-4">Failed to load article.</p>
          <button
            onClick={() => navigate('/articles')}
            className="px-4 py-2 bg-subl-blue-500 text-white rounded-xl text-sm hover:bg-subl-blue-600 transition-colors"
          >
            Back to Articles
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={article.title}>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
        <img src={article.image || getArticlePlaceholder(article.tag)} alt={article.title} onError={(e) => { e.currentTarget.src = getArticlePlaceholder(article.tag); e.currentTarget.onerror = null; }} className="w-full h-64 object-cover" />
        <div className="p-8">
          <button
            onClick={() => navigate('/articles')}
            className="flex items-center gap-2 text-sm text-subl-grey-500 hover:text-subl-grey-800 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Articles
          </button>
          <div className="flex items-center gap-2 text-xs text-subl-grey-500 mb-4">
            <Clock size={14} />
            {article.read_time}
          </div>
          <div className="flex items-center gap-3 mb-4">
            <img src={article.author.avatar || avatarPlaceholder(article.author.name)} alt={article.author.name} onError={(e) => { e.currentTarget.src = avatarPlaceholder(article.author.name); e.currentTarget.onerror = null; }} className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-sm font-medium text-subl-grey-800">{article.author.name}</p>
              <p className="text-xs text-subl-grey-500">{article.author.date}</p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-subl-grey-900 mb-4">{article.title}</h1>
          <div className="prose prose-sm max-w-none text-subl-grey-700 whitespace-pre-line leading-relaxed">
            {article.content}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
