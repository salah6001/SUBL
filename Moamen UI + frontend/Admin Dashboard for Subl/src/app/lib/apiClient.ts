import { tokenStore } from "./tokenStore";
import type { ProblemDetails } from "./types";

// Accept a token handed off from the user app via the URL hash (role-based
// redirect when an admin signs in on the user page).
(function processHandoff() {
  try {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const t = hash.get("token");
    if (t) {
      tokenStore.setTokens(t);
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  } catch {
    /* no-op */
  }
})();

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:5000";

/** Error thrown for any non-2xx response, carrying the parsed ProblemDetails. */
export class ApiError extends Error {
  public readonly status: number;
  public readonly problem?: ProblemDetails;

  constructor(status: number, message: string, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  /** Flattened, user-friendly message (prefers field validation errors). */
  get displayMessage(): string {
    if (this.problem?.errors) {
      const messages = Object.values(this.problem.errors).flat();
      if (messages.length > 0) {
        return messages.join(" ");
      }
    }
    return this.problem?.detail ?? this.problem?.title ?? this.message;
  }
}

interface RequestOptions {
  /** Query string parameters; undefined/null values are skipped. */
  params?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = new URL(`${BASE_URL}/${path.replace(/^\//, "")}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

let _refreshing: Promise<boolean> | null = null;

// Exchanges the refresh token for a fresh access token. Keeps the admin signed
// in for the full refresh-token window (7 days) instead of logging out after the
// 20-minute access token expires.
async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(buildUrl("users/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };

  const token = tokenStore.getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, options?.params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
  });

  // Access token expired — try a one-time silent refresh, then replay the request.
  if (response.status === 401 && !isRetry && path !== "users/refresh") {
    if (!_refreshing) _refreshing = tryRefresh().finally(() => { _refreshing = null; });
    const refreshed = await _refreshing;
    if (refreshed) {
      return request<T>(method, path, body, options, true);
    }
    // Refresh failed (refresh token also expired/revoked) — sign out and tell
    // the app so it can show a "session expired" message.
    tokenStore.clear();
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  if (!response.ok) {
    let problem: ProblemDetails | undefined;
    try {
      problem = (await response.json()) as ProblemDetails;
    } catch {
      problem = undefined;
    }
    throw new ApiError(
      response.status,
      problem?.title ?? `Request failed with status ${response.status}`,
      problem,
    );
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),

  /** Downloads a file (e.g. CSV export) as a Blob with the auth header. */
  async getBlob(path: string, options?: RequestOptions): Promise<Blob> {
    const token = tokenStore.getAccessToken();
    const response = await fetch(buildUrl(path, options?.params), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: options?.signal,
    });
    if (!response.ok) {
      throw new ApiError(response.status, `Download failed (${response.status})`);
    }
    return response.blob();
  },
};
