// Thin, typed wrapper over fetch, shared by the feature `api.ts` modules.
// Keeps paths relative (`/api/…`) so the Vite dev proxy keeps working.
// Path §1 [hop 5/15]: domain/*.api.ts (hop 4) → [this file] → fetch() →
// Vite proxy (hop 6) → API. Return trip: [hop 14] — the JSON comes back
// here for zod validation before the cache ever sees it.
// (request-paths.md §1, §2, §3 — every journey passes through here)

import { getAuthToken } from "./auth-token";

/** Thrown on a non-2xx response. `status` is the HTTP status code. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Anything with a `.parse(data) -> T` — every Zod schema satisfies this. */
interface Parser<T> {
  parse: (data: unknown) => T;
}

interface RequestOptions<T> {
  method?: string;
  /** JSON-encoded as the body; also flips the default method to POST. */
  body?: unknown;
  /** Validates + types the JSON response (e.g. a shared Zod schema). */
  schema?: Parser<T>;
  signal?: AbortSignal;
}

/**
 * Fetch wrapper used by every domain `*.api.ts` module: attaches the Clerk
 * token, throws HttpError on non-2xx, validates/types via `opts.schema`.
 */
export async function request<T = unknown>(
  path: string,
  opts: RequestOptions<T> = {},
): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? "POST" : "GET");

  // Null (signed out / tests) omits the header — the API 401s if the
  // endpoint requires identity.
  const token = await getAuthToken();

  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    throw new HttpError(
      res.status,
      `${method} ${path} failed (HTTP ${res.status})`,
    );
  }

  // 204 No Content has an empty body — res.json() would throw on it.
  if (res.status === 204) return undefined as T;

  const data: unknown = await res.json();
  return opts.schema ? opts.schema.parse(data) : (data as T);
}
