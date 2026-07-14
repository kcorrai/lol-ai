import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Death Heat Map" };

export default function Page() {
  return <PageClient />;
}
