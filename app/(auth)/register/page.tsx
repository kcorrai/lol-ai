import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/domains/identity/components/RegisterForm";

export const metadata: Metadata = {
  title: "Hesap Oluştur | LoL AI Coach",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
