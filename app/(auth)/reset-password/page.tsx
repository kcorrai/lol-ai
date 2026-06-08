import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/domains/identity/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Şifre Sıfırla | LoL AI Coach",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
