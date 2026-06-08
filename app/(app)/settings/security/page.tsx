import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Güvenlik" };

export default function Page() {
  return <PageClient />;
}
