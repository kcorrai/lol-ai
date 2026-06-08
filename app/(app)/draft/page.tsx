import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Draft Analizci" };

export default function Page() {
  return <PageClient />;
}
