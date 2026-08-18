import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Career Timeline" };

export default function Page() {
  return <PageClient />;
}
