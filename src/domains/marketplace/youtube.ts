// Reading a YouTube video id out of the links coaches actually paste.
//
// Only YouTube, and only a video: a coach's intro is embedded with YouTube's own
// player (we host no video — ADR-021), and an id is all the embed needs. Anything
// else — a channel, a playlist, another site — is refused rather than guessed at.

const ID = /^[A-Za-z0-9_-]{11}$/;
const HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);

/** The 11-character video id, or null when the link is not a YouTube video. */
export function youtubeVideoId(link: string): string | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!HOSTS.has(url.hostname)) return null;

  const parts = url.pathname.split("/").filter(Boolean);
  const candidate =
    url.hostname === "youtu.be"
      ? parts[0]
      : parts[0] === "watch"
        ? url.searchParams.get("v")
        : parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live"
          ? parts[1]
          : null;

  return candidate && ID.test(candidate) ? candidate : null;
}

/** The privacy-enhanced embed address for a video id. */
export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}
