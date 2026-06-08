import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Takım Oluştur" };

export default function Page() {
  return <PageClient />;
}
