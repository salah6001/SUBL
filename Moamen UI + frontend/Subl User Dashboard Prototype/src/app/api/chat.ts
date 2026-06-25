// The chatbot is a standalone Flask service (SublChatbot / chat.py) exposing
// POST /chat -> { reply }. It has open CORS and no auth, so we call it directly
// rather than through the authenticated web-api client.
const CHAT_URL = (import.meta.env.VITE_CHAT_URL as string | undefined) ?? "http://localhost:5005";

export interface ChatResponse {
  reply: string;
}

export const chatApi = {
  send: async (message: string): Promise<ChatResponse> => {
    const res = await fetch(`${CHAT_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    // The service returns a JSON { reply } even for 400/429/500 — surface those messages.
    const data = await res.json().catch(() => null);
    if (data && typeof data.reply === "string") return data as ChatResponse;
    throw new Error(`Chat request failed: ${res.status}`);
  },
};
