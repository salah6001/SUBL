const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

let _token: string | null = localStorage.getItem("subl_user_token");

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem("subl_user_token", token);
  else localStorage.removeItem("subl_user_token");
}

export function getToken(): string | null {
  return _token;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, (body as { message?: string }).message ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, data?: unknown) => request<T>(path, { method: "POST",  body: JSON.stringify(data) }),
  put:    <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT",   body: JSON.stringify(data) }),
  patch:  <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string)                => request<T>(path, { method: "DELETE" }),
};
