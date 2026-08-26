/** Vitest config for the ai app's unit tests; "@" mirrors tsconfig's "@/*" → "./*". */
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
  },
});
