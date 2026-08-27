import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Following a link out of this window (ADR-047).
 *
 * The companion covers the screens worth having next to a running game and lists only
 * those. It does not advertise the rest of the site — but the website's own components,
 * rendered here, link across all of it, and this is where such a link goes: the operating
 * system's browser, where the player is already signed in, rather than a navigation that
 * would replace this window. `goTo` is the only caller.
 */

export class WebsiteError extends Error {}

/**
 * Opens one page of the website in the player's own browser.
 *
 * Takes a path, never a URL. The host is the core's compiled-in base and the core refuses a
 * path that could name a different one, so the widest thing this call can reach is another
 * page of this same site.
 */
export async function openOnWebsite(path: string): Promise<void> {
  if (!isTauri()) {
    throw new WebsiteError("This preview cannot open the website. Run the desktop app.");
  }

  try {
    await invoke("open_on_website", { path });
  } catch (err) {
    // The core's own message when it has one: it says which of the two failed — the path
    // was refused, or the browser would not start — and those need different answers.
    throw new WebsiteError(typeof err === "string" ? err : "Could not open your browser.");
  }
}
