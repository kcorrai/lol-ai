import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "OTP Assistant" };

export default function Page() {
  return <PageClient />;
}
