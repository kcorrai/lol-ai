import { Suspense } from "react";
import { ResetPasswordForm } from "@/domains/identity/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
