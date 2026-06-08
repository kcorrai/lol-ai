import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "AI Koç Raporları" };

export default function Page() {
  return <PageClient />;
}
