import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Become a Coach" };

export default function Page() {
  return <PageClient />;
}
