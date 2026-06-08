"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CreateTeamPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logoUrl: logoUrl.trim() || undefined }),
      });

      if (!res.ok) {
        const body = await res.json() as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Takım oluşturulamadı");
      }

      const body = await res.json() as { data: { id: string } };
      router.push(`/teams/${body.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <PageHeader
        title="Takım Oluştur"
        subtitle="Esports takımınız veya koçluk akademiniz için bir profil oluşturun"
      />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Takım Adı <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={64}
            placeholder="Örn: Team Wolves"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Logo URL <span className="text-text-muted">(isteğe bağlı)</span>
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
          >
            İptal
          </Button>
          <Button type="submit" className="flex-1" disabled={loading || !name.trim()}>
            {loading ? "Oluşturuluyor…" : "Takım Oluştur"}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <p className="text-xs font-medium text-text-muted">Team Plan Gerekli</p>
        <p className="mt-1 text-xs text-text-muted/70">
          Takım özellikleri yalnızca aktif Team aboneliği ile kullanılabilir.
          Üye sayısı en fazla 20 olabilir.
        </p>
      </div>
    </div>
  );
}
