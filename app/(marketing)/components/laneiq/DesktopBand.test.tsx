import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DesktopRelease } from "@/lib/desktop/release";

// `DesktopBand` reads the release at module scope, because `NEXT_PUBLIC_*` is a build-time
// constant. Mocking the module rather than `process.env` is what lets both branches be
// tested in one file — the import has to be re-evaluated per case, hence `resetModules`.
const release = vi.hoisted(() => ({ current: null as DesktopRelease | null }));

vi.mock("@/lib/desktop/release", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/desktop/release")>();
  return { ...actual, getDesktopRelease: () => release.current };
});

async function renderBand(): Promise<void> {
  vi.resetModules();
  const { DesktopBand } = await import("./DesktopBand");
  render(<DesktopBand />);
}

// jsdom has no IntersectionObserver, and `HudStagger` animates on `whileInView`. The stub
// never fires, which is the state this suite wants: it asserts on links and copy, not on
// whether an entrance animation played.
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return [];
      }
    }
  );
  release.current = null;
});

afterEach(() => {
  vi.resetModules();
});

describe("DesktopBand with nothing published", () => {
  it("offers no download at all", async () => {
    // The whole point of the env-driven release: with no build, the landing page must not
    // put a download in front of anyone. A dead installer link is worse than no button.
    await renderBand();

    expect(screen.queryByRole("link", { name: /download the app/i })).not.toBeInTheDocument();
  });

  it("sends the reader to the page that explains why", async () => {
    await renderBand();

    expect(screen.getByRole("link", { name: /see the desktop app/i })).toHaveAttribute(
      "href",
      "/download"
    );
    expect(screen.getByRole("link", { name: /why it is not out yet/i })).toHaveAttribute(
      "href",
      "/download"
    );
  });
});

describe("DesktopBand with a published release", () => {
  beforeEach(() => {
    release.current = {
      version: "0.1.0",
      downloads: [
        {
          platform: "windows",
          label: "Windows",
          format: "Installer (.exe)",
          url: "https://example.test/setup.exe",
        },
      ],
    };
  });

  it("puts the installer behind the primary button", async () => {
    await renderBand();

    expect(screen.getByRole("link", { name: /download the app/i })).toHaveAttribute(
      "href",
      "https://example.test/setup.exe"
    );
  });

  it("still links out to what the app does", async () => {
    await renderBand();

    expect(screen.getByRole("link", { name: /what it does/i })).toHaveAttribute(
      "href",
      "/download"
    );
  });
});

describe("DesktopBand copy", () => {
  it("names the address that is the reason the app exists", async () => {
    // If this claim ever softens into "syncs with your game", the section has stopped
    // saying the one thing a competitor's website cannot answer.
    await renderBand();

    expect(screen.getByText(/127\.0\.0\.1:2999/)).toBeInTheDocument();
  });
});
