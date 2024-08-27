import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import inlineSource from "vite-plugin-inline-source";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), inlineSource()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: () => "everything.js",
      },
    },
  },
});
