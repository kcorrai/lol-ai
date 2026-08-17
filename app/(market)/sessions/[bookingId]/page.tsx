import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Session" };

export default function Page({ params }: { params: { bookingId: string } }) {
  return <PageClient bookingId={params.bookingId} />;
}
