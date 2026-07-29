import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev server proxies API calls to the FastAPI agent service.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
