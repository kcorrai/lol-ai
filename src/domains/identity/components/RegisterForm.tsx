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
import { OAuthButton } from "./OAuthButton";

const registerSchema = z
  .object({
    name: z.string().min(2, "İsim en az 2 karakter olmalı").max(50),
    email: z.string().email("Geçerli bir e-posta adresi gir"),
    password: z.string().min(8, "Şifre en az 8 karakter olmalı"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref")?.toUpperCase() ?? null;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
        refCode,
      }),
    });

    const data = (await res.json()) as { error?: { message: string } };

    if (!res.ok) {
      setServerError(data.error?.message ?? "Kayıt başarısız. Lütfen tekrar dene.");
      return;
    }

    router.push("/login?registered=1&callbackUrl=%2Fonboarding");
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Hesap Oluştur</CardTitle>
        <CardDescription>
          {refCode
            ? `Davet kodu aktif: ${refCode} — Kayıt olunca ikiniz de 7 gün Pro kazanırsınız!`
            : "Ücretsiz — kredi kartı gerekli değil"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButton provider="google" />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-text-muted">Veya e-posta ile kaydol</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm text-text-muted">
              Görünen Ad
            </label>
            <Input
              id="name"
              type="text"
              placeholder="OyuncuAdı"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-text-muted">
              E-posta
            </label>
            <Input
              id="email"
              type="email"
              placeholder="oyuncu@ornek.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-text-muted">
              Şifre
            </label>
            <Input
              id="password"
              type="password"
              placeholder="En az 8 karakter"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm text-text-muted">
              Şifreyi Onayla
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
            {isSubmitting ? "Hesap oluşturuluyor…" : "Hesap Oluştur"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Giriş Yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
