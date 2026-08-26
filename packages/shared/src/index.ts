// Barrel file for @note2action/shared: re-exports every domain module so
// callers do `import { X } from "@note2action/shared"` from one place.
// Python's schemas mirror these shapes by hand and can drift if unsynced.
// Path: [this file] → app/health/items/extraction/meetings.ts.
export * from "./app";
export * from "./health";
export * from "./items";
export * from "./extraction";
export * from "./meetings";
