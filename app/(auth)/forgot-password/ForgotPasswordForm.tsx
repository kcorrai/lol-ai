"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, MailCheck } from "lucide-react";
import { AuthPanel, AuthError } from "@/domains/identity/components/AuthPanel";
import { AuthField, AuthInput, AuthSubmit } from "@/domains/identity/components/AuthControls";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm(): React.ReactElement {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSent(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  if (sent) {
    return (
      <AuthPanel
        kicker="Check your email"
        heading="Link sent"
        subheading="One email, one link, one hour."
      >
        <div className="space-y-4">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-label text-accent">
            <MailCheck className="h-5 w-5" strokeWidth={1.75} />
            {"// Link sent"}
          </p>
          <p className="text-sm text-text-body">
            If there&apos;s an account on this address, the reset link is on its way. It expires in
            one hour — look in spam before requesting another.
          </p>
          <Link
            href="/login"
            className="tag-cut flex h-10 w-full items-center justify-center border border-line-2 bg-surface-2 font-display text-xs font-bold uppercase tracking-[0.1em] text-text transition-colors duration-150 hover:border-accent hover:bg-ink-500"
          >
            Back to log in
          </Link>
        </div>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      kicker="Password reset"
      heading="Reset password"
      subheading="Enter the email on your account and we send a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          label="Email"
          htmlFor="email"
          hint="We send one link. It expires in one hour."
          error={errors.email?.message}
        >
          <AuthInput
            id="email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
        </AuthField>

        {serverError && <AuthError>{serverError}</AuthError>}

        <AuthSubmit pending={isSubmitting}>
          {isSubmitting ? "Sending" : "Send reset link"}
        </AuthSubmit>

        <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <Link href="/login" className="text-text-muted hover:text-accent">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthPanel>
  );
}
