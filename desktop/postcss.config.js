/**
 * `postcss-import` is not optional here and must run first.
 *
 * The stylesheet this app compiles is the *web app's* `globals.css`, pulled in by relative
 * path (ADR-039). Tailwind has to see that file already inlined — its `@layer` blocks and
 * `@apply` rules are Tailwind syntax, not CSS the browser could ever read. Inlining after
 * Tailwind would ship them verbatim and the app would render unstyled.
 */
export default {
  plugins: {
    "postcss-import": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
