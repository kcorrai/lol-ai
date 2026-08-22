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
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: webConfig.theme,
  plugins: webConfig.plugins,
};

export default config;
