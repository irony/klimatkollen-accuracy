import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/stage': {
        target: 'https://stage-api.klimatkollen.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stage/, ''),
      },
      '/api/prod': {
        target: 'https://api.klimatkollen.se',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prod/, ''),
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
