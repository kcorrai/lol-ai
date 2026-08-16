import type { Metadata } from "next";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Leaderboard" };

export default function Page() {
  return <PageClient />;
}
