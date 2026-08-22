import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import PageClient from "./PageClient";

export const metadata: Metadata = {
  title: "Match Search",
  description:
    "Search your whole League of Legends match history — by champion, role, queue, patch, teammate or your own stat line — and see the record for every search.",
};

// The search lives in the query string, so the screen reads `useSearchParams`. Next needs that
// behind a Suspense boundary or the whole route opts out of prerendering.
export default function Page(): React.JSX.Element {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageClient />
    </Suspense>
  );
}
