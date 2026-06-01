import { api } from "./client";

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const usersApi = {
  list: (page = 1, pageSize = 20, search?: string) =>
    api.get<PagedResult<UserResponse>>(
      `/users?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    ),
  getById: (id: string) => api.get<UserResponse>(`/users/${id}`),
  activate:   (id: string) => api.put<void>(`/users/${id}/activate`),
  deactivate: (id: string) => api.put<void>(`/users/${id}/deactivate`),
  suspend:    (id: string) => api.put<void>(`/users/${id}/suspend`),
  delete:     (id: string) => api.delete<void>(`/users/${id}`),
};
