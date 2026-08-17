import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Coach Review | Admin" };

export default function Page() {
  return <PageClient />;
}
