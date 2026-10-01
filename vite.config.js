import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("react-router-dom")
            ) {
              return "vendor-react";
            }
            if (id.includes("@reduxjs") || id.includes("redux")) {
              return "vendor-redux";
            }
            if (
              id.includes("bootstrap") ||
              id.includes("react-icons") ||
              id.includes("react-toastify")
            ) {
              return "vendor-ui";
            }
          }
        },
      },
    },
  },
});
