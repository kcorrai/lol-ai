"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfileSettings, useUpdateProfileSettings } from "@/hooks/useProfileSettings";
import { Copy, Check, ExternalLink, Download, Trash2 } from "lucide-react";

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
  const [exportState, setExportState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm">("idle");
  const [deleteState, setDeleteState] = useState<"idle" | "loading" | "done" | "error">("idle");

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

  async function requestExport() {
    setExportState("loading");
    try {
      const res = await fetch("/api/account/export", { method: "POST" });
      if (!res.ok) throw new Error("export_failed");
      setExportState("done");
    } catch {
      setExportState("error");
    }
  }

  async function requestDeletion() {
    setDeleteState("loading");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("deletion_failed");
      setDeleteState("done");
      setDeleteStep("idle");
    } catch {
      setDeleteState("error");
    }
  }

  if (isLoading) return <div className="animate-pulse p-6" />;

  const profileUrl = data?.profileSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/u/${data.profileSlug}`
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Privacy Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Control which information appears on your public profile page.
        </p>
      </div>

      {profileUrl && data?.profileSlug && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3">
          <span className="flex-1 truncate text-sm text-text-muted">{profileUrl}</span>
          <Link
            href={`/u/${data.profileSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-accent hover:text-background"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View
          </Link>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-md bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-accent hover:text-background"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface divide-y divide-border px-4">
        <ToggleRow
          label="Profile Public"
          description="If off, no one can access your profile page"
          checked={local.profilePublic}
          onChange={() => toggle("profilePublic")}
          disabled={isPending}
        />
        <ToggleRow
          label="Show Rank"
          description="Show your rank and LP"
          checked={local.showRank}
          onChange={() => toggle("showRank")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Show Win Rate"
          description="Show your overall WR percentage"
          checked={local.showWR}
          onChange={() => toggle("showWR")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Show Badges"
          description="Show achievement badges you've earned"
          checked={local.showBadges}
          onChange={() => toggle("showBadges")}
          disabled={!local.profilePublic || isPending}
        />
        <ToggleRow
          label="Show Champions"
          description="Show your favorite champions"
          checked={local.showChampions}
          onChange={() => toggle("showChampions")}
          disabled={!local.profilePublic || isPending}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-text">Download My Data</h2>
          <p className="mt-1 text-xs text-text-muted">
            Under GDPR, you can request a copy of all your data. Data will be sent to your email as a ZIP file within minutes.
          </p>
        </div>

        {exportState === "done" ? (
          <p className="rounded-lg bg-accent/10 px-4 py-2.5 text-sm text-accent">
            Request received — ZIP with your data will be sent to your email.
          </p>
        ) : exportState === "error" ? (
          <p className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
            An error occurred. Please try again.
          </p>
        ) : (
          <button
            onClick={requestExport}
            disabled={exportState === "loading"}
            className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent hover:text-background disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportState === "loading" ? "Processing…" : "Download My Data"}
          </button>
        )}
      </div>

      <div className="rounded-xl border border-danger/20 bg-surface p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-danger">Delete My Account</h2>
          <p className="mt-1 text-xs text-text-muted">
            If you want to delete your account, remember that all your data will be permanently deleted. Deletion will happen after 30 days — you can cancel during this time.
          </p>
        </div>

        {deleteState === "done" ? (
          <p className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
            Deletion request received. Your account will be deleted within 30 days.
          </p>
        ) : deleteState === "error" ? (
          <p className="rounded-lg bg-danger/10 px-4 py-2.5 text-sm text-danger">
            An error occurred. Please try again.
          </p>
        ) : deleteStep === "confirm" ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-danger">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={requestDeletion}
                disabled={deleteState === "loading"}
                className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleteState === "loading" ? "Processing…" : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setDeleteStep("idle")}
                className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-accent hover:text-background"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDeleteStep("confirm")}
            className="flex items-center gap-2 rounded-lg border border-danger/30 px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete My Account
          </button>
        )}
      </div>
    </div>
  );
}
