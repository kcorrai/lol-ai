import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Security" };

export default function Page() {
  return <PageClient />;
}
