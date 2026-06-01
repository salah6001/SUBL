import { api } from "./client";

export interface ArticleAuthor {
  name: string;
  avatar: string;
  date: string;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  read_time: string;
  author: ArticleAuthor;
  content: string;
}

export const articlesApi = {
  list:      (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search)   params.set("search", search);
    const qs = params.toString();
    return api.get<Article[]>(`/articles${qs ? `?${qs}` : ""}`);
  },
  getById:   (id: number) => api.get<Article>(`/articles/${id}`),
};
