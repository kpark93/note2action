import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// Where /api/* is forwarded in dev. Locally that's the FastAPI service on
// localhost:8001 (8000 belongs to other local projects); in Docker Compose
// it's the `api` service. Override via env.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8001";
// Where /ai-api/* is forwarded — the Next.js AI app (its routes live under
// /api, so we strip the /ai-api prefix). localhost:3000 locally, `ai` in Compose.
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
