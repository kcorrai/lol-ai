"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
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
      setServerError("Bir sorun oluştu. Lütfen tekrar deneyin.");
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>E-postanı kontrol et</CardTitle>
          <CardDescription>
            Bu adrese kayıtlı bir hesap varsa sıfırlama bağlantısı gönderdik. 1 saat içinde geçersiz olur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login" className="text-sm text-accent hover:underline">
            ← Girişe dön
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Şifremi unuttum</CardTitle>
        <CardDescription>
          E-posta adresini gir, sana sıfırlama bağlantısı gönderelim.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {errors.email && (
              <p className="text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          {serverError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </Button>
        </form>

        <p className="text-center text-sm text-text-muted">
          Hatırladın mı?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Giriş yap
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
