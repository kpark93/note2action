/** Vite config: dev server + the /api and /ai-api proxies. Path §1 [hop 6/15]:
 * lib/http.ts fetch("/api/…") → this proxy → FastAPI on :8001. */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** Where /api/* forwards in dev: FastAPI on localhost:8001 (8000 is taken
 * locally); the `api` service in Docker Compose. Override via env. */
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8001";

/** Where /ai-api/* forwards — the Next.js AI app, with the /ai-api prefix
 * stripped (its routes live under /api). localhost:3000, `ai` in Compose. */
const aiTarget = process.env.VITE_AI_PROXY_TARGET ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Must mirror the "@/*" path in tsconfig.json so Vite resolves @/… imports
    // (e.g. shadcn's @/components/ui/*) at dev/build time, not just in the editor.
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    // Forward /api/* to FastAPI and /ai-api/* to the Next.js AI app, so the
    // browser stays same-origin and no CORS config is needed in dev.
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
      "/ai-api": {
        target: aiTarget,
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-api/, "/api"),
      },
    },
  },
});
