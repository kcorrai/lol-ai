# ADR-049: The download page reads its release from the environment, and admits when there is none

## Status: Accepted

## Context

The desktop companion is the product's only claim a competitor's website cannot answer:
Riot's Live Client Data API listens on `127.0.0.1:2999` and no server reaches it
(ADR-005, ADR-038). Twenty-odd commits of it have shipped — pairing (ADR-048), the overlay,
the live panels, the tray, the post-game handoff, the lifted screens (ADR-044, ADR-047) —
and until now the marketing site did not mention it once. There was no `/download` route,
no link, and no marketing copy anywhere in `app/(marketing)`.

The obvious fix is a download button. The problem is that there is nothing to download.
`desktop/README.md` states the remainder of phase 5 plainly: *"signing needs a certificate
and a release pipeline that do not exist yet"*. A code-signing certificate is a recurring
bill, and this project has no budget for one — so the gap is not a scheduling problem that
will close next week.

That leaves three ways to put a download button on a site with no installer behind it:

1. Link to a release URL that does not exist yet and let it 404.
2. Ship a "coming soon" with a date nobody can commit to, or an email capture — which needs
   a table, a migration and a promise to actually send the mail.
3. Build the whole page for real, drive the link from configuration, and render an honest
   empty state until that configuration is filled in.

## Decision

The third. `src/lib/desktop/release.ts` is the only place that reads
`NEXT_PUBLIC_DESKTOP_RELEASE_VERSION|WINDOWS|MACOS|LINUX` and it answers `DesktopRelease |
null`. `null` — which is what an unconfigured deploy produces — is a first-class render, not
an error path:

- `/download` says there is no installer, says why (no signed release), and points at what
  the browser can do instead. Everything below it is what the application already does, not
  a roadmap.
- The landing page's `DesktopBand` degrades its call to action from a download to a link to
  `/download`. **The landing page never offers a download that 404s.**

A partially published release is a normal state, not a half-failure: League is played on
Windows, so a Windows-only first release is the likely one and the page offers it alone
rather than waiting for three. Platform detection picks a default from the user agent and
lists every other platform underneath, so a wrong guess costs a glance.

Only `http(s)` URLs are accepted. These strings land in an anchor's `href` and the
environment is not a trusted author; a `javascript:` value in a misconfigured deploy renders
no button rather than a click target.

Distribution is deliberately left unnamed. The variables are URLs, so GitHub Releases — free,
already available — satisfies them, and nothing in the code has to change if that moves.

## Consequences

**Good.**

- The feature ships today at the honest size it actually is, instead of waiting on a
  purchase. The page, the copy, the detection and the tests are all real.
- Publishing a build is a configuration change and a deploy. No code, no PR, no second pass.
- The empty state is covered by tests (`release.test.ts`, `DesktopBand.test.tsx`) rather than
  being the branch nobody looks at — which matters, because it is the branch everybody sees.
- Nothing here costs money, needs a schema change, or adds a dependency.

**Bad.**

- `NEXT_PUBLIC_*` is inlined at build time, so flipping the release on requires a redeploy
  rather than a config toggle. Acceptable: cutting a release is already a deploy.
- The page advertises something a visitor cannot have yet. That is a real cost, and it is
  the one being chosen deliberately over the alternative — a broken button, which spends
  trust rather than merely testing patience.
- Two places now describe the desktop app to a stranger (`/download` and `DesktopBand`), and
  they can drift. `DesktopBand` is the trailer and `/download` the full account; the band
  links to the page rather than repeating it.

**Superseded when** a signing certificate and a release pipeline exist. At that point the
honest empty state stops being reachable in production, but it stays in the code and in the
tests — a build that fails to publish should fall back to telling the truth, not to a dead
link.
