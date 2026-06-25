import { useState, useEffect } from "react";
import { ArrowLeft, Clock, User, Tag, Search, ChevronRight, BookOpen } from "lucide-react";
import { articles as mockArticles } from "../data/mockData";
import { articlesApi } from "../api/articles";
import { usePrefs } from "../lib/prefs";

type ArticleItem = (typeof mockArticles)[number];

const categories = ["All", "Stress Management", "Technology", "Productivity", "Nutrition", "Recovery", "Leadership", "Research", "Wellness", "Health"];

const categoryColors: Record<string, string> = {
  "Stress Management": "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  Technology: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400",
  Productivity: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400",
  Nutrition: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400",
  Recovery: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400",
  Leadership: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400",
  Research: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  Wellness: "bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400",
  Health: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400",
};

export function Articles() {
  const { t } = usePrefs();
  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [selected, setSelected] = useState<ArticleItem | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    articlesApi.list().then((data) => {
      const adapted = data.map((a) => ({
        id: String(a.id),
        title: a.title,
        author: typeof a.author === "object" ? (a.author as { name: string }).name : String(a.author),
        authorRole: "Wellness Expert",
        readTime: a.read_time,
        category: a.tag,
        image: a.image,
        excerpt: a.excerpt,
        content: a.content,
      })) as ArticleItem[];
      setAllArticles(adapted);
    }).catch(() => setAllArticles([]));
  }, []);

  // The list endpoint omits the body; fetch the full content when opening one.
  const openArticle = (article: ArticleItem) => {
    setSelected(article);
    articlesApi.getById(String(article.id))
      .then((full) => setSelected({ ...article, content: full.content }))
      .catch(() => {});
  };

  const filtered = allArticles.filter((a) => {
    const matchCat = activeCategory === "All" || a.category === activeCategory;
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.author.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (selected) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("articles.back")}
        </button>

        {/* Hero banner — clean gradient, no stock photography */}
        <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-5 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-white/70" />
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] ${categoryColors[selected.category] ?? "bg-slate-100 text-slate-700"} backdrop-blur-sm`}
          >
            {selected.category}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {selected.readTime}
          </span>
        </div>

        <h1 className="text-slate-800 dark:text-slate-100 mb-4 leading-snug">{selected.title}</h1>

        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs shrink-0">
            {selected.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <p className="text-sm text-slate-800 dark:text-slate-200">{selected.author}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{selected.authorRole}</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {selected.content.split("\n\n").map((block, idx) => {
            if (/^\*\*[^*]+\*\*$/.test(block.trim())) {
              return (
                <h2 key={idx} className="text-slate-800 dark:text-slate-200 mt-5">
                  {block.replace(/\*\*/g, "")}
                </h2>
              );
            }
            const lines = block.split("\n");
            const hasBullets = lines.some((l) => l.startsWith("• "));
            if (hasBullets) {
              return (
                <ul key={idx} className="space-y-2">
                  {lines.map((line, li) =>
                    line.startsWith("• ") ? (
                      <li key={li} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                      </li>
                    ) : (
                      <p key={li} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
                    )
                  )}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={t("articles.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            {cat === "All" ? t("articles.all") : cat}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        {filtered.length} {filtered.length !== 1 ? t("articles.countPlural") : t("articles.count")}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t("articles.none")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {filtered.map((article) => (
            <button
              key={article.id}
              onClick={() => openArticle(article)}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 text-left flex flex-col"
            >
              {/* Header banner — clean gradient, no stock photography */}
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white/70" />
                <span
                  className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] backdrop-blur-sm ${
                    categoryColors[article.category] ?? "bg-white/80 text-slate-700"
                  }`}
                >
                  {article.category}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                <h4 className="text-sm text-slate-800 dark:text-slate-200 leading-snug mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 flex-1 mb-3">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <User className="w-3 h-3" />
                    {article.author.split(" ").slice(0, 2).join(" ")}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("articles.read")} <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
