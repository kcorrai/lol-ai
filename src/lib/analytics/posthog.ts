import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  if (!key) return null;

  if (!_client) {
    _client = new PostHog(key, {
      host,
      // Disable in-memory queue flushing on each capture to avoid cold-start latency
      flushAt: 20,
      flushInterval: 10_000,
    });
  }

  return _client;
}

export async function capture(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({ distinctId, event, properties });
  await client.flush().catch(() => undefined);
}
