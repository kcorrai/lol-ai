import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "My Sessions" };

export default function Page() {
  return <PageClient />;
}
