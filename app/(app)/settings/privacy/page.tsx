import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Privacy Settings" };

export default function Page() {
  return <PageClient />;
}
