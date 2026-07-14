import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Champion Pool" };

export default function Page() {
  return <PageClient />;
}
