import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: { port: 4173, strictPort: false },
  build: { target: "es2022", outDir: "dist", emptyOutDir: true }
});
