import { api } from './client';
import type { ChatRequest, ChatResponse } from '@/types';

export const chatApi = {
  send: (data: ChatRequest) => api.post<ChatResponse>('/chat', data),
};
