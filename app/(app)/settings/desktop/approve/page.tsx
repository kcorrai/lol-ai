import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Approve a device" };

export default function Page() {
  return <PageClient />;
}
