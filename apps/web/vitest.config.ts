import { defineConfig } from "vitest/config";
import path from "path";

// Vitest prefers this file over vite.config.ts, which keeps the React and
// Tailwind build plugins out of the test runner. Only the "@" alias must
// stay mirrored with vite.config.ts / tsconfig.json.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
