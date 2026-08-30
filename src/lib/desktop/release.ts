/**
 * Where the desktop companion's installers live, if they live anywhere yet.
 *
 * There is no release pipeline and no signing certificate (`desktop/README.md`, phase 5d),
 * so on most days this answers `null` and the download page says so. That is the point:
 * the alternative is a button that 404s, which costs a visitor their trust to save us
 * admitting a thing is unfinished.
 *
 * Reading the environment happens here and nowhere else, so a component never has to know
 * which variable is which — and so the "not published" branch is something a test can reach
 * without touching `process.env`.
 *
 * `NEXT_PUBLIC_*` is inlined at build time, which is correct for this: the URLs change when
 * a release is cut, and a release is a deploy.
 */

/** The platforms `desktop/src-tauri/tauri.conf.json` actually bundles for. */
export type DesktopPlatform = "windows" | "macos" | "linux";

export interface DesktopDownload {
  platform: DesktopPlatform;
  /** Shown on the button. */
  label: string;
  /** What the file is, for the line under it. */
  format: string;
  url: string;
}

export interface DesktopRelease {
  /** Whatever the release was tagged, e.g. "0.1.0". Free-form: we do not parse it. */
  version: string | null;
  /** Only the platforms that actually have a published file. Never empty. */
  downloads: readonly DesktopDownload[];
}

const PLATFORM_META: Record<DesktopPlatform, { label: string; format: string }> = {
  // NSIS is listed before MSI in the bundle targets and is the one a player double-clicks.
  windows: { label: "Windows", format: "Installer (.exe)" },
  macos: { label: "macOS", format: "Disk image (.dmg)" },
  linux: { label: "Linux", format: "AppImage" },
};

/**
 * A blank string is what an unset variable looks like once `.env.example` has been copied,
 * so it has to count as absent exactly like `undefined` does — otherwise every fresh
 * checkout renders a button pointing at "".
 */
function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Only `http(s)` gets through. These strings are inlined into an anchor's `href`, and the
 * environment is not a trusted author — a `javascript:` value in a misconfigured deploy
 * should render nothing rather than become a click target.
 */
function safeUrl(value: string | undefined): string | null {
  const raw = clean(value);
  if (raw === null) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? raw : null;
  } catch {
    return null;
  }
}

/**
 * The published release, or `null` when nothing has been published.
 *
 * Partial is a real state and not an error: Windows is where League is played, so a
 * Windows-only release is the likely first one and the page should offer it alone rather
 * than wait for three.
 */
export function getDesktopRelease(): DesktopRelease | null {
  const urls: Record<DesktopPlatform, string | null> = {
    windows: safeUrl(process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS),
    macos: safeUrl(process.env.NEXT_PUBLIC_DESKTOP_RELEASE_MACOS),
    linux: safeUrl(process.env.NEXT_PUBLIC_DESKTOP_RELEASE_LINUX),
  };

  const downloads: DesktopDownload[] = (
    Object.keys(PLATFORM_META) as readonly DesktopPlatform[]
  ).flatMap((platform) => {
    const url = urls[platform];
    return url === null ? [] : [{ platform, url, ...PLATFORM_META[platform] }];
  });

  if (downloads.length === 0) return null;

  return { version: clean(process.env.NEXT_PUBLIC_DESKTOP_RELEASE_VERSION), downloads };
}

/**
 * Which download to put under the primary button, from a user agent string.
 *
 * Deliberately crude. It picks a default the visitor can override — every platform stays
 * listed underneath — so being wrong costs one extra click, and the alternative (a
 * platform API that only modern browsers answer) costs the page a render on the ones that
 * do not. An unrecognised agent falls back to the first published download.
 */
export function pickDownload(
  release: DesktopRelease,
  userAgent: string
): DesktopDownload | undefined {
  const ua = userAgent.toLowerCase();
  const guess: DesktopPlatform | null = ua.includes("windows")
    ? "windows"
    : // "like mac os x" appears on iOS too. An iPhone cannot run this app, but neither can
      // it run any of the others, so the macOS guess is the least useless of three wrong ones.
      ua.includes("mac os")
      ? "macos"
      : ua.includes("linux") || ua.includes("x11")
        ? "linux"
        : null;

  return (
    (guess === null ? undefined : release.downloads.find((d) => d.platform === guess)) ??
    release.downloads[0]
  );
}
