import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/s3-proxy': {
        target: 'https://thedalnew.s3.ap-south-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/s3-proxy/, ''),
        secure: true,
      },
    },
  },

  css: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    reporters: ["default", "html"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
