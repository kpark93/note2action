/** Vitest prefers this file over vite.config.ts — keeps the React/Tailwind
 * build plugins out of the test runner. Only the "@" alias must stay mirrored. */
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
