import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Profile and rank | Coach Console" };

export default function Page() {
  return <PageClient />;
}
