import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Lider Tablosu" };

export default function Page() {
  return <PageClient />;
}
