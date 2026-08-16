import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Discord Integration" };

export default function Page() {
  return <PageClient />;
}
