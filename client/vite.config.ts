import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  server: {
    port: 5173,
    proxy: {
      "/reconcile": "http://localhost:3001",
      "/health": "http://localhost:3001",
      "/questions": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true
      }
    }
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true
  }
});
