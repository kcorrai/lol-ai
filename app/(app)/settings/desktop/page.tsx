import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Desktop App" };

export default function Page() {
  return <PageClient />;
}
