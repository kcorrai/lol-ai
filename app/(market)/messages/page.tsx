import type { Metadata } from "next";
import { Suspense } from "react";
import PageClient from "./PageClient";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}
