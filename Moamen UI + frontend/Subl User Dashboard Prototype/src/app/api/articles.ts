import { api } from "./client";

export interface ArticleAuthor {
  name: string;
  avatar: string;
  date: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  read_time: string;
  author: ArticleAuthor;
  content: string;
}

// Backend list response: PagedResult<ArticleListItemResponse> (no content).
interface ListItemDto {
  id: string;
  title: string;
  author: string | null;
  authorRole: string | null;
  readTime: string | null;
  category: string;
  image: string | null;
  excerpt: string | null;
  publishedAt: string | null;
}

interface PagedDto<T> { items: T[]; totalCount: number; }

// Detail response includes the full content.
interface DetailDto extends ListItemDto { content: string; }

function adapt(d: ListItemDto, content = ""): Article {
  return {
    id: d.id,
    title: d.title,
    excerpt: d.excerpt ?? "",
    image: d.image ?? "",
    tag: d.category,
    read_time: d.readTime ?? "",
    author: { name: d.author ?? "Subl", avatar: "", date: d.publishedAt ?? "" },
    content,
  };
}

export const articlesApi = {
  list: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search)   params.set("search", search);
    const qs = params.toString();
    return api
      .get<PagedDto<ListItemDto>>(`/articles${qs ? `?${qs}` : ""}`)
      .then(res => (res.items ?? []).map(d => adapt(d)));
  },

  getById: (id: string) =>
    api.get<DetailDto>(`/articles/${id}`).then(d => adapt(d, d.content)),
};
