// Barrel file for @note2action/shared: re-exports every domain module below
// so callers can `import { X } from "@note2action/shared"` from one place.
// Consumed by apps/web (lib/http.ts parses every API response against these
// schemas) and apps/ai (extract/route.ts, lib/extraction.ts); the Python API
// has no import of this package — its app/schemas/*.py mirror these shapes
// by hand, so the two sides can drift if not kept in sync manually.
// Path: web or ai app → [this file] → app.ts / health.ts / items.ts /
// extraction.ts / meetings.ts.
export * from "./app";
export * from "./health";
export * from "./items";
export * from "./extraction";
export * from "./meetings";
