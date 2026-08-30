import { describe, it, expect, afterEach } from "vitest";
import { getDesktopRelease, pickDownload, type DesktopRelease } from "./release";

const VARS = [
  "NEXT_PUBLIC_DESKTOP_RELEASE_VERSION",
  "NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS",
  "NEXT_PUBLIC_DESKTOP_RELEASE_MACOS",
  "NEXT_PUBLIC_DESKTOP_RELEASE_LINUX",
] as const;

afterEach(() => {
  for (const key of VARS) delete process.env[key];
});

describe("getDesktopRelease", () => {
  it("answers null when nothing has been published", () => {
    expect(getDesktopRelease()).toBeNull();
  });

  it("treats a blank variable as absent", () => {
    // What a fresh `.env.local` copied from `.env.example` actually looks like. Counting it
    // as present would render a download button pointing at "".
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS = "   ";
    expect(getDesktopRelease()).toBeNull();
  });

  it("publishes only the platforms that have a file", () => {
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS = "https://example.test/app-setup.exe";

    const release = getDesktopRelease();

    expect(release?.downloads).toHaveLength(1);
    expect(release?.downloads[0]).toMatchObject({
      platform: "windows",
      url: "https://example.test/app-setup.exe",
    });
  });

  it("keeps the platforms in a stable order regardless of which are set", () => {
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_LINUX = "https://example.test/app.AppImage";
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS = "https://example.test/app-setup.exe";

    expect(getDesktopRelease()?.downloads.map((d) => d.platform)).toEqual(["windows", "linux"]);
  });

  it("carries the version when one is given, and null when it is not", () => {
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS = "https://example.test/app-setup.exe";
    expect(getDesktopRelease()?.version).toBeNull();

    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_VERSION = "0.1.0";
    expect(getDesktopRelease()?.version).toBe("0.1.0");
  });

  it("refuses a URL that is not http(s)", () => {
    // The environment is not a trusted author: these strings become an anchor's href, and a
    // misconfigured deploy should render no button rather than a click target that runs script.
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_WINDOWS = "javascript:alert(1)";
    expect(getDesktopRelease()).toBeNull();
  });

  it("refuses a value that is not a URL at all", () => {
    process.env.NEXT_PUBLIC_DESKTOP_RELEASE_MACOS = "coming soon";
    expect(getDesktopRelease()).toBeNull();
  });
});

describe("pickDownload", () => {
  const release: DesktopRelease = {
    version: "0.1.0",
    downloads: [
      { platform: "windows", label: "Windows", format: "Installer (.exe)", url: "https://w.test" },
      { platform: "macos", label: "macOS", format: "Disk image (.dmg)", url: "https://m.test" },
      { platform: "linux", label: "Linux", format: "AppImage", url: "https://l.test" },
    ],
  };

  it.each([
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "windows"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "macos"],
    ["Mozilla/5.0 (X11; Linux x86_64)", "linux"],
  ])("picks %s → %s", (ua, expected) => {
    expect(pickDownload(release, ua)?.platform).toBe(expected);
  });

  it("falls back to the first download for an agent it does not recognise", () => {
    expect(pickDownload(release, "")?.platform).toBe("windows");
  });

  it("falls back to a published platform rather than the guessed one", () => {
    // A Mac visitor when only Windows shipped. Offering nothing would be worse than
    // offering the file that exists, which they can still ignore.
    const windowsOnly: DesktopRelease = { version: null, downloads: [release.downloads[0]] };
    expect(pickDownload(windowsOnly, "Macintosh; Intel Mac OS X")?.platform).toBe("windows");
  });
});
