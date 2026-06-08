import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi Unuttum | LoL AI Coach",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
