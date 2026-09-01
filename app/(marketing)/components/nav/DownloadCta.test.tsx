import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DesktopRelease } from "@/lib/desktop/release";

// The component reads the release at module scope, because `NEXT_PUBLIC_*` is a build-time
// constant. Mocking the module rather than `process.env` is what lets both branches be tested
// in one file — the import has to be re-evaluated per case, hence `resetModules`.
const release = vi.hoisted(() => ({ current: null as DesktopRelease | null }));

vi.mock("@/lib/desktop/release", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/desktop/release")>();
  return { ...actual, getDesktopRelease: () => release.current };
});

async function renderCta(props: Record<string, unknown> = {}): Promise<void> {
  vi.resetModules();
  const { DownloadCta } = await import("./DownloadCta");
  render(<DownloadCta {...props} />);
}

beforeEach(() => {
  release.current = null;
});

afterEach(() => {
  vi.resetModules();
});

describe("with nothing published", () => {
  it("does not promise a file it cannot hand over", async () => {
    // The whole point of the env-driven release. A button reading "Download" that produces a
    // paragraph costs more trust than the paragraph costs on its own.
    await renderCta();

    expect(screen.queryByRole("link", { name: /^download/i })).not.toBeInTheDocument();
  });

  it("still puts the desktop app on the bar, pointing at the page that explains it", async () => {
    await renderCta();

    expect(screen.getByRole("link", { name: /desktop app/i })).toHaveAttribute("href", "/download");
  });
});

describe("with a published release", () => {
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

  it("puts the installer behind the button the day one exists", async () => {
    // No code changes on release day: the label and the href both come from the environment.
    await renderCta();

    expect(screen.getByRole("link", { name: /download for windows/i })).toHaveAttribute(
      "href",
      "https://example.test/setup.exe"
    );
  });
});

describe("compact, for the bar below xl", () => {
  it("keeps a name for a screen reader after dropping the visible label", async () => {
    // The label is what a 390px bar has no room for. The accessible name is not optional,
    // and an icon-only link without one announces as its URL.
    await renderCta({ compact: true });

    const link = screen.getByRole("link", { name: /desktop app/i });
    expect(link).toHaveAttribute("href", "/download");
    expect(link).toHaveTextContent("");
  });
});
