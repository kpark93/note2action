import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Where /api/* is forwarded in dev. Locally that's the FastAPI service on
// localhost:8000; in Docker Compose it's the `api` service. Override via env.
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
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
