import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "AI Koçun" };

export default function Page() {
  return <PageClient />;
}
