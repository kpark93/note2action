// Vitest config for the AI app's unit tests (route + prompt assembly).
// The "@" alias mirrors tsconfig.json's "@/*" → "./*".
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
