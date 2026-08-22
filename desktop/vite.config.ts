import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3010,
    // Fail rather than slide to 3011. `tauri.conf.json` points the window at 3010, so a
    // silent port change means the app loads whatever *else* is on that port — in practice
    // a stale dev server from a previous run, serving a bundle from before your edits.
    strictPort: true,
    // The stylesheet and the API contract both live in the website's tree, one level up.
    // Without this the dev server refuses to serve them and the app boots unstyled.
    fs: { allow: [repoRoot] },
  },
  // Tauri swallows the default esbuild target's newer syntax on some WebView2 builds;
  // Chromium 105 is the floor Tauri 2 documents for Windows.
  build: { target: "chrome105", sourcemap: true },
});
