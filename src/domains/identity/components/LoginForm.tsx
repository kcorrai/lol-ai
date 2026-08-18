"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthPanel, AuthTabs, AuthError, AuthNotice } from "./AuthPanel";
import { AuthField, AuthInput, PasswordField, AuthSubmit } from "./AuthControls";
import { OAuthButton } from "./OAuthButton";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "success";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (result?.error) {
      setServerError("Email or password is incorrect. Please try again.");
      return;
    }

    // NextAuth rejects a sign-in two different ways. Bad credentials set `error`;
    // a CSRF mismatch answers 200 with `ok: true`, no error, and a url pointing
    // back at its own sign-in page. Without this second check the form reads that
    // as success and pushes to /dashboard, where middleware bounces the visitor
    // straight back to /login having been told nothing at all. Submitting again
    // works, because by then the CSRF cookie has settled.
    if (result?.url?.includes("/api/auth/signin")) {
      setServerError("Your login session expired before it was sent. Please try again.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthPanel
      kicker="Session"
      heading="Log in"
      subheading="Your reports and plan are where you left them."
      tabs={<AuthTabs active="login" />}
    >
      <div className="space-y-4">
        {justRegistered && <AuthNotice>Account created — log in to get started.</AuthNotice>}
        {justReset && (
          <AuthNotice>Password updated. Log in with your new password.</AuthNotice>
        )}

        <OAuthButton provider="google" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthField label="Email" htmlFor="email" error={errors.email?.message}>
            <AuthInput
              id="email"
              type="email"
              icon={Mail}
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
          </AuthField>

          <PasswordField
            id="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {serverError && <AuthError>{serverError}</AuthError>}

          <AuthSubmit pending={isSubmitting}>{isSubmitting ? "Logging in" : "Log in"}</AuthSubmit>
        </form>

        <div className="flex justify-between gap-3 font-mono text-[10.5px] uppercase tracking-[0.14em]">
          <Link href="/forgot-password" className="text-accent hover:text-acid-400">
            Forgot password
          </Link>
          <Link href="/register" className="text-text-muted hover:text-accent">
            Create account
          </Link>
        </div>
      </div>
    </AuthPanel>
  );
}
