import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Ölüm Isı Haritası" };

export default function Page() {
  return <PageClient />;
}
