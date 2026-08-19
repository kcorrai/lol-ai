import { Suspense } from "react";
import type { Metadata } from "next";
import { TwoFactorForm } from "@/domains/identity/components/TwoFactorForm";

export const metadata: Metadata = {
  title: "Two-factor check",
  robots: { index: false, follow: false },
};

export default function TwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorForm />
    </Suspense>
  );
}
