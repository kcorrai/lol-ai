import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { aliases, repoRoot, webTreeFallback } from "./aliases.ts";

export default defineConfig({
  plugins: [webTreeFallback(), react()],
  resolve: {
    alias: aliases,
    // This repository has two `node_modules`: this app's, and the website's at the root.
    // A website component imported from `../src` resolves its packages from the root one
    // and a screen here resolves from this one — so without this, the bundle carries two
    // Reacts and two query clients. Two Reacts is "Invalid hook call" on first render; two
    // query clients is "No QueryClient set" from every website hook, because a provider
    // from one copy cannot be seen through the other's context.
    //
    // Not solvable by installing the packages here: the root `node_modules` is a junction
    // shared by every git worktree, and an install at either end has detached one before.
    dedupe: ["react", "react-dom", "@tanstack/react-query", "zustand", "lucide-react"],
  },
  server: {
    port: 3010,
    // Fail rather than slide to 3011. `tauri.conf.json` points the window at 3010, so a
    // silent port change means the app loads whatever *else* is on that port — in practice
    // a stale dev server from a previous run, serving a bundle from before your edits.
    strictPort: true,
    // The stylesheet, the API contract and — since ADR-043 — the screens themselves all
    // live in the website's tree, one level up. Without this the dev server refuses to
    // serve them and the app boots unstyled.
    fs: { allow: [repoRoot] },
  },
  // Tauri swallows the default esbuild target's newer syntax on some WebView2 builds;
  // Chromium 105 is the floor Tauri 2 documents for Windows.
  build: { target: "chrome105", sourcemap: true },
});
