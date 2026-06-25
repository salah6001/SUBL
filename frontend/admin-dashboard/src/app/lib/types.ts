// Shared API types that mirror the backend's response envelopes.

/** A page of results, matching the backend `PagedResult<T>`. */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/** RFC 7807 ProblemDetails, as returned by the backend on errors. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  /** Per-field validation messages, when present. */
  errors?: Record<string, string[]>;
}
