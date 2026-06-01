import { api } from "./client";

export interface ChatResponse {
  reply: string;
}

export const chatApi = {
  send: (message: string) => api.post<ChatResponse>("/ai/chat", { message }),
};
