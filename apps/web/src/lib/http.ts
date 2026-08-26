/** Thin, typed fetch wrapper shared by the domain `*.api.ts` modules; relative
 * paths keep the Vite proxy working. Path §1 [hop 5/15]: → fetch → proxy → API. */

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

/** Sends one request: attaches the Clerk token, throws HttpError on non-2xx,
 * validates and types the JSON reply via `opts.schema`. */
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
