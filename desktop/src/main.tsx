import React from "react";
import { createRoot } from "react-dom/client";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { App } from "./App";
import { OverlayScreen } from "./screens/OverlayScreen";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("#root missing from index.html");

/**
 * Both windows are served the same `index.html`, so which one this is has to be read at
 * run time rather than built in.
 *
 * The label is the window's own identity and comes from the core, not from the URL — a
 * query string is something a page could be loaded with by mistake. Outside Tauri there
 * is no core to ask, so the query fallback exists for `npm run dev`, where the overlay
 * layout is opened by hand at `?window=overlay`.
 */
function isOverlay(): boolean {
  if (isTauri()) {
    try {
      return getCurrentWindow().label === "overlay";
    } catch {
      // A core that will not name its own window is not a reason to render nothing.
      return false;
    }
  }
  return new URLSearchParams(window.location.search).get("window") === "overlay";
}

const overlay = isOverlay();

// The overlay has to let the game show through it. `globals.css` paints `body` with the
// ink fill and the instrument grid for the main window, and this is the only place that
// can know this window wants neither. Set as an inline style rather than a class so it
// wins over the stylesheet without depending on rule order.
if (overlay) {
  document.body.style.background = "transparent";
}

createRoot(container).render(
  <React.StrictMode>{overlay ? <OverlayScreen /> : <App />}</React.StrictMode>
);
