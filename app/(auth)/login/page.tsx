import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/domains/identity/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş Yap | LoL AI Coach",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
