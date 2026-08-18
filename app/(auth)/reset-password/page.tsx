import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/domains/identity/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
