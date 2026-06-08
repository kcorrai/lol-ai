import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Şampiyon Havuzu" };

export default function Page() {
  return <PageClient />;
}
