import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Gelişim Takibi" };

export default function Page() {
  return <PageClient />;
}
