import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Availability | Coach Console" };

export default function Page() {
  return <PageClient />;
}
