// The meta snapshot is rewarmed daily (`/api/cron/warm-meta`, vercel.json). Three days
// allows for a missed run or two; past that, "Last update 22d ago" argues the opposite of
// what the strip is there to prove, so the strip stops saying it.
export const STALE_AFTER_HOURS = 72;

export function isStale(iso: string, now: number = Date.now()): boolean {
  return now - new Date(iso).getTime() > STALE_AFTER_HOURS * 3_600_000;
}

export function relativeAge(iso: string, now: number = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}
