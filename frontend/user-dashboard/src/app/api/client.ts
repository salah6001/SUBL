const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

// Accept token handed off from the admin app via URL hash after role-based redirect
(function processHandoff() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const t = hash.get("token");
  if (t) {
    localStorage.setItem("subl_user_token", t);
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
})();

let _token: string | null = localStorage.getItem("subl_user_token");
let _refreshToken: string | null = localStorage.getItem("subl_refresh_token");
let _refreshing: Promise<boolean> | null = null;

export function setToken(token: string | null, refreshToken?: string | null) {
  _token = token;
  if (token) localStorage.setItem("subl_user_token", token);
  else localStorage.removeItem("subl_user_token");

  if (refreshToken !== undefined) {
    _refreshToken = refreshToken ?? null;
    if (refreshToken) localStorage.setItem("subl_refresh_token", refreshToken);
    else localStorage.removeItem("subl_refresh_token");
  }
}

export function getToken(): string | null {
  return _token;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ASP.NET returns RFC7807 ProblemDetails ({ title, detail, status, errors }).
// Prefer the human-readable detail, then title, then any message/statusText —
// so the UI shows "Invalid email or password" instead of "Bad Request".
async function errorMessage(res: Response): Promise<string> {
  const body = await res.json().catch(() => null) as
    | { detail?: string; title?: string; message?: string; errors?: Record<string, string[]> }
    | null;
  if (body) {
    if (body.errors) {
      const first = Object.values(body.errors).flat()[0];
      if (first) return first;
    }
    return body.detail || body.title || body.message || res.statusText;
  }
  return res.statusText;
}

async function tryRefresh(): Promise<boolean> {
  if (!_refreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });
    if (!res.ok) {
      setToken(null, null);
      return false;
    }
    const data = await res.json() as { accessToken: string; refreshToken: string };
    setToken(data.accessToken, data.refreshToken);
    return true;
  } catch {
    setToken(null, null);
    return false;
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

  if (res.status === 401 && _refreshToken) {
    if (!_refreshing) _refreshing = tryRefresh().finally(() => { _refreshing = null; });
    const refreshed = await _refreshing;
    if (refreshed) {
      const retryHeaders: Record<string, string> = { ...headers, Authorization: `Bearer ${_token}` };
      const retry = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: retryHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      if (retry.status === 204) return undefined as T;
      if (!retry.ok) {
        throw new ApiError(retry.status, await errorMessage(retry));
      }
      return retry.json() as Promise<T>;
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await errorMessage(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Fetch a non-JSON (e.g. CSV) response body as text, with auth. */
export async function getText(path: string): Promise<string> {
  const headers: Record<string, string> = {};
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new ApiError(res.status, await errorMessage(res));
  return res.text();
}

export const api = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, data?: unknown) => request<T>(path, { method: "POST",   body: JSON.stringify(data) }),
  put:    <T>(path: string, data?: unknown) => request<T>(path, { method: "PUT",    body: JSON.stringify(data) }),
  patch:  <T>(path: string, data?: unknown) => request<T>(path, { method: "PATCH",  body: JSON.stringify(data) }),
  delete: <T>(path: string)                 => request<T>(path, { method: "DELETE" }),
};
