import { Suspense } from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/domains/identity/components/RegisterForm";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
