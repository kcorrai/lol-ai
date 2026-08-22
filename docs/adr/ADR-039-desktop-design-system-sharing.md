# ADR-039: The desktop app compiles the website's stylesheet

## Status: Accepted

## Context

The desktop companion (ADR-038) has to be visually indistinguishable from the website. Not
similar — the same product. A player who pairs the desktop app and then opens the site
should not be able to tell which one they are looking at from a screenshot of a panel.

ADR-015 put the visual system in two files: `tailwind.config.ts` carries the palette, the
collapsed radius scale, the type stack and the motion curves, and `src/styles/globals.css`
carries what a Tailwind theme cannot express — the CSS custom properties, the chamfer
clip-paths (`.notch`, `.tag-cut`), `.hud-label`, `.gaming-card`, the instrument grid.

The desktop app is a separate Vite build. It has no Next.js, no shared bundler, and no
access to anything Next does at build time. So the question is how a second, unrelated
build gets the same stylesheet without a copy of it drifting.

Four options were considered.

**Copy the files.** Rejected outright. ADR-015 exists because 95 hardcoded gold literals
accumulated across 42 files; duplicating the source of truth invites exactly that again,
and this time across two applications where nobody would notice for months.

**Symlink them.** Rejected. Windows is the primary and, for a League companion, the
overwhelmingly dominant platform, and symlink creation there needs either developer mode
or elevation. A checkout step that silently degrades is worse than one that fails.

**A generated tokens file.** A script reading the web config and emitting TypeScript and
CSS for the desktop build. Rejected as motion without progress: it adds a build step, a
generated artefact to keep in the tree, and a new way to be out of date, to solve a
problem that the CSS toolchain already solves.

**An npm workspace package.** Rejected on a local hazard. Adding a `file:` dependency
means running `npm install` at the repository root, and in this project the root
`node_modules` is a junction shared by every git worktree — a root install has previously
detached one worktree's junction into a standalone copy and broken the others.

## Decision

The desktop app's entry stylesheet imports the website's, by relative path, and lets
PostCSS inline it before Tailwind runs.

```css
/* desktop/src/styles/index.css */
@import "../../../src/styles/globals.css";
@import "./fonts.css";
```

Two things make this work rather than merely look tidy.

`postcss-import` must be first in the desktop's PostCSS plugin chain. The imported file is
not CSS a browser could read — it is `@tailwind` directives, `@layer` blocks and `@apply`
rules. Tailwind has to receive it already inlined. Inlining afterwards would ship those
directives verbatim and the app would render unstyled.

`desktop/tailwind.config.ts` imports the root config and re-exports its `theme` and
`plugins`, overriding only `content`. The globs are resolved relative to the config file,
so the desktop build scans its own screens and emits only the utilities it uses — the
website's ~300 components are not in the denominator.

Fonts are the single exception, and necessarily so. On the web `next/font` defines
`--font-orbitron`, `--font-chakra` and `--font-jetbrains` at build time. There is no Next
here, and there is a stronger reason than that: a companion opens while the machine is
busy running a game and sometimes while it is offline. A face fetched over the network
arrives late, and the HUD reflows in front of a player mid-match. So the three families
are bundled as woff2 on disk, Latin subset only — 91 KB across seven files, because
Orbitron and JetBrains Mono ship as variable fonts and need one file each — and
`desktop/src/styles/fonts.css` declares the same three variables the theme already reads.

The API contract between the two applications follows the same principle for the same
reason: a plain TypeScript module in the website's tree, imported by relative path, with
no package indirection.

## Consequences

**Gained.** One source of truth, enforced by the compiler rather than by discipline. A
token edited in `globals.css` reaches the desktop app on its next build with nothing to
remember. Verified rather than assumed: the desktop bundle was inspected after building
and carries `--acid-500:#c6ff3d`, `--notch:14px`, `--ink-900:#080b0a`, the `.notch`
clip-path and all seven `@font-face` rules.

**Paid.** The desktop build now breaks if the website's stylesheet breaks, and the two are
coupled at the filesystem level — `desktop/` cannot be moved out of this repository
without replacing this import. That is a real constraint and it is the intended one: the
coupling is the feature, and ADR-038 already treats extraction as a deliberate act rather
than a drift.

Tailwind purges per build, so a utility the website uses and the desktop does not simply
is not emitted. That is correct, and it does mean a class only ever referenced from a
string built at runtime would be missing on the desktop side — the same trap Tailwind
always sets, with one more place to fall into it.

**Rejected explicitly.** Restyling anything for the desktop. If a panel needs to look
different in a window than in a tab, that is a layout decision — a narrower rail, a denser
grid — expressed in composition. The tokens do not fork.
