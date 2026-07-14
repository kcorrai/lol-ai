"use client";

import { useState, useEffect } from "react";
import {
  useDiscordSettings,
  useSaveDiscordSettings,
  useDeleteDiscordIntegration,
  useSendTestMessage,
} from "@/hooks/useDiscordSettings";
import { Trash2, Send } from "lucide-react";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${
        checked ? "bg-accent" : "bg-surface-2"
      } ${disabled ? "opacity-50" : ""}`}
      role="switch"
      aria-checked={checked}
    >
      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export default function DiscordSettingsPage() {
  const { data, isLoading } = useDiscordSettings();
  const save = useSaveDiscordSettings();
  const del = useDeleteDiscordIntegration();
  const test = useSendTestMessage();

  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyRankUp, setNotifyRankUp] = useState(true);
  const [notifyBadge, setNotifyBadge] = useState(false);
  const [notifyWeekly, setNotifyWeekly] = useState(true);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setNotifyRankUp(data.notifyRankUp);
      setNotifyBadge(data.notifyBadge);
      setNotifyWeekly(data.notifyWeekly);
    }
  }, [data]);

  function handleSave() {
    setSaveMsg(null);
    save.mutate(
      { webhookUrl, notifyRankUp, notifyBadge, notifyWeekly },
      {
        onSuccess: () => { setWebhookUrl(""); setSaveMsg("✅ Webhook saved!"); },
        onError: (e) => setSaveMsg(`❌ ${e instanceof Error ? e.message : "Save failed"}`),
      }
    );
  }

  async function handleTest() {
    setTestMsg(null);
    test.mutate(undefined, {
      onSuccess: () => setTestMsg("✅ Test message sent!"),
      onError: (e) => setTestMsg(`❌ ${e instanceof Error ? e.message : "Error"}`),
    });
  }

  if (isLoading) return <div className="animate-pulse p-6" />;

  return (
    <div className="mx-auto max-w-lg space-y-6 p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">Discord Integration</h1>
        <p className="mt-1 text-sm text-text-muted">
          Send rank-up and badge notifications to a Discord channel.
        </p>
      </div>

      {/* Webhook URL */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-text">Webhook URL</h2>
        {data?.hasWebhook && (
          <p className="text-xs text-green-400">✓ Webhook registered (URL hidden)</p>
        )}
        <input
          type="url"
          placeholder="https://discord.com/api/webhooks/..."
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder-text-muted focus:border-accent focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          In Discord: Edit Channel → Integrations → Create Webhook → Copy URL
        </p>
        <button
          onClick={handleSave}
          disabled={!webhookUrl || save.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
        >
          {save.isPending ? "Saving..." : "Save"}
        </button>
        {saveMsg && <p className="text-sm">{saveMsg}</p>}
      </div>

      {/* Notification preferences */}
      <div className="divide-y divide-border rounded-xl border border-border bg-surface px-4">
        {[
          { label: "Rank Up", description: "Notify when you rank up", checked: notifyRankUp, onChange: setNotifyRankUp },
          { label: "Badge Earned", description: "Notify when you earn a badge", checked: notifyBadge, onChange: setNotifyBadge },
          { label: "Weekly Summary", description: "Send weekly summary every Monday", checked: notifyWeekly, onChange: setNotifyWeekly },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-text">{item.label}</p>
              <p className="text-xs text-text-muted">{item.description}</p>
            </div>
            <Toggle checked={item.checked} onChange={item.onChange} disabled={!data?.hasWebhook} />
          </div>
        ))}
      </div>

      {/* Test + Delete */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={!data?.hasWebhook || test.isPending}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text disabled:opacity-50 hover:bg-surface-2"
        >
          <Send className="h-4 w-4" />
          {test.isPending ? "Sending..." : "Send Test"}
        </button>
        <button
          onClick={() => del.mutate()}
          disabled={!data?.hasWebhook || del.isPending}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-surface px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50 hover:bg-danger/5"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>

      {testMsg && (
        <p className="text-sm text-text-muted">{testMsg}</p>
      )}
    </div>
  );
}
