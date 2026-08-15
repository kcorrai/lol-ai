"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPanel, AuthError } from "./AuthPanel";
import { PasswordField, PasswordMeter, AuthSubmit } from "./AuthControls";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = watch("password") ?? "";

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (res.status === 400) {
        const body = (await res.json()) as { error?: { message?: string } };
        setServerError(body.error?.message ?? "This link is invalid or has expired.");
        return;
      }

      if (!res.ok) {
        setServerError("Something went wrong. Please try again.");
        return;
      }

      router.push("/login?reset=success");
    } catch {
      setServerError("Something went wrong. Please try again.");
    }
  }

  if (!token) {
    return (
      <AuthPanel
        kicker="Dead link"
        heading="Invalid link"
        subheading="This password reset link is missing or malformed."
      >
        <Link
          href="/forgot-password"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent hover:text-acid-400"
        >
          Request a new reset link &rarr;
        </Link>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      kicker="Password reset"
      heading="Set new password"
      subheading="Choose a new password for your account. At least 8 characters."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField
          id="password"
          label="New password"
          placeholder="8+ characters"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordMeter password={password} />

        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {serverError && <AuthError>{serverError}</AuthError>}

        <AuthSubmit pending={isSubmitting}>
          {isSubmitting ? "Updating password" : "Update password"}
        </AuthSubmit>

        <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <Link href="/forgot-password" className="text-text-muted hover:text-accent">
            Request a new reset link
          </Link>
        </p>
      </form>
    </AuthPanel>
  );
}
