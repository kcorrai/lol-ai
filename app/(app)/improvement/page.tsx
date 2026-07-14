import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Improvement Tracking" };

export default function Page() {
  return <PageClient />;
}
