import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
// Where /api/* is forwarded in dev. Locally that's the FastAPI service on
// localhost:8000; in Docker Compose it's the `api` service. Override via env.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Must mirror the "@/*" path in tsconfig.json so Vite resolves @/… imports
    // (e.g. shadcn's @/components/ui/*) at dev/build time, not just in the editor.
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    // Forward /api/* to FastAPI so there's no CORS config needed in dev.
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
