import type { Config } from "tailwindcss";
import webConfig from "../tailwind.config";

/**
 * The desktop app's Tailwind theme *is* the website's theme (ADR-039).
 *
 * Only `content` differs, and it has to: Tailwind's globs are resolved relative to this
 * file, and scanning the website's ~300 components from here would emit a stylesheet full
 * of classes this app never renders.
 */
const config: Config = {
  darkMode: webConfig.darkMode,
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // Since ADR-043 this app renders the website's own client components, and Tailwind
    // purges per build: a class this app puts on screen but does not scan for is simply
    // not emitted, and the panel arrives unstyled with nothing in the console to say so.
    //
    // This is the cost ADR-039 predicted when it kept the globs narrow — the website's
    // ~300 components are now in the denominator, so the stylesheet is larger. Correct and
    // larger beats small and missing, and the file is loaded from disk on a machine that
    // is already running a game.
    "../src/**/*.{ts,tsx}",
    "../app/**/*.{ts,tsx}",
  ],
  theme: webConfig.theme,
  plugins: webConfig.plugins,
};

export default config;
