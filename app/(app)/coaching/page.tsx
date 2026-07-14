import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "AI Coach Reports" };

export default function Page() {
  return <PageClient />;
}
