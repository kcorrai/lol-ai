"use client";

import { useState, useEffect } from "react";
import { useProfileSettings, useUpdateProfileSettings } from "@/hooks/useProfileSettings";
import { Copy, Check } from "lucide-react";

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
          checked ? "bg-accent" : "bg-surface-2"
        } ${disabled ? "opacity-50" : ""}`}
        aria-checked={checked}
        role="switch"
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function PrivacySettingsPage() {
  const { data, isLoading } = useProfileSettings();
  const { mutate, isPending } = useUpdateProfileSettings();
  const [copied, setCopied] = useState(false);

  const [local, setLocal] = useState({
    profilePublic: true,
    showRank: true,
    showWR: true,
    showBadges: true,
    showChampions: true,
  });

  useEffect(() => {
    if (data) {
      setLocal({
        profilePublic: data.profilePublic,
        showRank: data.showRank,
        showWR: data.showWR,
        showBadges: data.showBadges,
        showChampions: data.showChampions,
      });
    }
  }, [data]);

  function toggle(key: keyof typeof local) {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    mutate(next);
  }

  async function copyLink() {
    const slug = data?.profileSlug;
    if (!slug) return;
    const url = `${window.location.origin}/u/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return <div className="animate-pulse p-6" />;

  const profileUrl = data?.profileSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${data.profileSlug}`
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Gizlilik Ayarları</h1>
        <p className="mt-1 text-sm text-text-muted">
          Public profil sayfanda hangi bilgilerin görüneceğini kontrol et.
        </p>
      </div>

      {profileUrl && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <span className="flex-1 truncate text-sm text-text-muted">{profileUrl}</span>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-accent hover:text-background"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface divide-y divide-border px-4">
        <ToggleRow
          label="Profil Herkese Açık"
          description="Kapalıysa profil sayfana kimse erişemez"
          checked={local.profilePublic}
          onChange={() => toggle("profilePublic")}
          disabled={isPending}
        />
        <ToggleRow
          label="Rank Göster"
          description="Rank ve LP bilgin görünsün"
          checked={local.showRank}
          onChange={() => toggle("showRank")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Kazanma Oranı Göster"
          description="Genel WR yüzdeniz görünsün"
          checked={local.showWR}
          onChange={() => toggle("showWR")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Rozetler Göster"
          description="Kazandığın achievement rozetleri görünsün"
          checked={local.showBadges}
          onChange={() => toggle("showBadges")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Şampiyonlar Göster"
          description="Favori şampiyonların görünsün"
          checked={local.showChampions}
          onChange={() => toggle("showChampions")}
          disabled={!local.profilePublic || isPending}
        />
      </div>
    </div>
  );
}
