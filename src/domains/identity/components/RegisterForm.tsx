"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { claimQuery, parseClaim } from "@/lib/riot/claim";
import { AuthPanel, AuthTabs, AuthError } from "./AuthPanel";
import {
  AuthField,
  AuthInput,
  AuthCheckbox,
  PasswordField,
  PasswordMeter,
  AuthSubmit,
} from "./AuthControls";
import { OAuthButton } from "./OAuthButton";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref")?.toUpperCase() ?? null;
  const claimed = parseClaim(searchParams);
  const [serverError, setServerError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") ?? "";

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(refCode !== null ? { refCode } : {}),
      }),
    });

    const data = (await res.json()) as { error?: { message: string } };

    if (!res.ok) {
      setServerError(data.error?.message ?? "Registration failed. Please try again.");
      return;
    }

    // A claim rides through sign-in on the callback URL, so a player who arrived from "this is
    // me" on a public profile lands on a dashboard that is already connecting their account —
    // rather than on /settings/accounts, retyping the Riot ID they just searched for.
    const claim = parseClaim(searchParams);
    const destination = claim ? `/dashboard?${claimQuery(claim)}` : "/dashboard";
    router.push(`/login?registered=1&callbackUrl=${encodeURIComponent(destination)}`);
  }

  const subheading = claimed
    ? `${claimed.gameName}#${claimed.tagLine} connects automatically once you're in — nothing else to fill in.`
    : refCode
      ? `Referral code active: ${refCode} — you both get 7 days of Pro.`
      : "Connect a Riot ID after sign-up and your first report lands in about 90 seconds.";

  return (
    <AuthPanel
      kicker="New account"
      heading="Create account"
      subheading={subheading}
      badge="Free while in beta"
      tabs={<AuthTabs active="signup" />}
    >
      <div className="space-y-4">
        <OAuthButton provider="google" dividerLabel="or with email" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <AuthField label="Display name" htmlFor="name" error={errors.name?.message}>
            <AuthInput
              id="name"
              type="text"
              icon={UserRound}
              placeholder="PlayerName"
              autoComplete="name"
              {...register("name")}
            />
          </AuthField>

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
            placeholder="8+ characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />

          <PasswordMeter password={password} />

          <PasswordField
            id="confirmPassword"
            label="Confirm password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <AuthCheckbox id="terms" checked={acceptedTerms} onChange={setAcceptedTerms}>
            I agree to the{" "}
            <Link href="/terms" className="text-accent hover:text-acid-400">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-accent hover:text-acid-400">
              privacy policy
            </Link>
          </AuthCheckbox>

          {serverError && <AuthError>{serverError}</AuthError>}

          <AuthSubmit pending={isSubmitting} disabled={!acceptedTerms}>
            {isSubmitting ? "Creating account" : "Create account"}
          </AuthSubmit>
        </form>

        <p className="text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-acid-400">
            Log in
          </Link>
        </p>
      </div>
    </AuthPanel>
  );
}
