import type { Metadata } from "next";
import Link from "next/link";
import { readLinkToken } from "@/domains/discord/linkToken";
import LinkClient from "./LinkClient";

export const metadata: Metadata = { title: "Link Discord" };
export const dynamic = "force-dynamic";

// Reached from the button /lolai link posts into Discord. Unauthenticated
// visitors are sent to sign in by middleware and come back here with the token
// still on the URL.
export default function Page({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token ?? "";
  // Verified here rather than on submit, so an expired link says so on arrival
  // instead of after someone has clicked Confirm.
  const claims = token ? readLinkToken(token) : null;

  if (!claims) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-text">Link expired</h1>
        <p className="text-sm text-text-muted">
          Discord link invitations are good for 10 minutes. Run <code>/lolai link</code> again to get
          a fresh one.
        </p>
        <Link href="/settings/discord" className="text-sm text-accent hover:underline">
          Back to Discord settings
        </Link>
      </div>
    );
  }

  return <LinkClient token={token} discordUsername={claims.discordUsername} />;
}
