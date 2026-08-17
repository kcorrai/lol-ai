import { Suspense } from "react";
import type { Metadata } from "next";
import { DraftRoomShell } from "@/domains/draft/components/DraftRoomShell";

// A draft room is a private scrim link, not content. Keep it out of the index
// while /draft itself stays crawlable.
export const metadata: Metadata = {
  title: "Draft Room | LaneIQ",
  robots: { index: false, follow: false },
};

interface Props {
  params: { code: string };
}

export default function DraftRoomPage({ params }: Props): React.ReactElement {
  return (
    <Suspense fallback={<p className="p-8 text-center text-[13px] text-text-muted">Loading…</p>}>
      <DraftRoomShell code={params.code} />
    </Suspense>
  );
}
