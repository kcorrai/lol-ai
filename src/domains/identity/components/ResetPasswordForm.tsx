"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This password reset link is missing or malformed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Choose a new password for your account. Must be at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-text-muted">
              New password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm text-text-muted">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating password…" : "Update password"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          <Link href="/forgot-password" className="text-accent hover:underline">
            Request a new reset link
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
