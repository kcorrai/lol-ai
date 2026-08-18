import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/domains/identity/components/LoginForm";

export const metadata: Metadata = {
  // The root layout template appends " | LoL AI Coach" — repeating it here is what put
  // the name in the tab twice.
  title: "Log in",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
