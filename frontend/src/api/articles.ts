import { api } from './client';
import type { Article } from '@/types';

export const articlesApi = {
  list: (sort?: string) =>
    api.get<Article[]>(`/articles${sort ? `?sort=${sort}` : ''}`),
  get: (id: number) => api.get<Article>(`/articles/${id}`),
};
