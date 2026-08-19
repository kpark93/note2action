// Thin, typed wrapper over fetch, shared by the feature `api.ts` modules.
//
// - method defaults to GET (or POST when a body is present)
// - a JSON body is encoded and its Content-Type set automatically
// - a non-2xx response throws HttpError (carrying the status code)
// - an optional parser (any Zod schema) validates and types the JSON response
//
// Paths stay relative (`/api/…`, `/ai-api/…`) so the Vite dev proxy keeps
// working; add a base URL here if the app is ever deployed on split origins.

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
  /** JSON-encoded into the request body; also flips the default method to POST. */
  body?: unknown;
  /** Validates + types the JSON response (e.g. a shared Zod schema). */
  schema?: Parser<T>;
  signal?: AbortSignal;
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions<T> = {},
): Promise<T> {
  const method = opts.method ?? (opts.body !== undefined ? "POST" : "GET");
  const res = await fetch(path, {
    method,
    headers:
      opts.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
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
