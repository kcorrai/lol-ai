"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save } from "lucide-react";

interface Flag {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  userSegment: string[];
  createdAt: string;
}

export default function FeatureFlagsAdminPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/feature-flags");
    const json = await res.json() as { data: Flag[] };
    setFlags(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!newKey.match(/^[a-z0-9_]+$/)) return;
    await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: newKey, description: newDesc }),
    });
    setNewKey("");
    setNewDesc("");
    await load();
  }

  async function update(flag: Flag) {
    setSaving(flag.id);
    await fetch("/api/admin/feature-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: flag.id,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
        description: flag.description,
        userSegment: flag.userSegment,
      }),
    });
    setSaving(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this flag?")) return;
    await fetch(`/api/admin/feature-flags?id=${id}`, { method: "DELETE" });
    await load();
  }

  function patchLocal(id: string, patch: Partial<Flag>) {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  if (loading) return <div className="animate-pulse p-6 text-text-muted text-sm">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Feature Flags</h1>
      </div>

      {/* New flag form */}
      <div className="rounded-xl border border-border bg-surface p-4 flex gap-3 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-text-muted">Key (snake_case)</label>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="my_flag_key"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-text-muted">Description</label>
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="What does this flag control?"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text"
          />
        </div>
        <button
          onClick={create}
          disabled={!newKey}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent/90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {/* Flags table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-muted">
              <th className="px-4 py-3 text-left">Key</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center w-20">Enabled</th>
              <th className="px-4 py-3 text-center w-24">Rollout %</th>
              <th className="px-4 py-3 text-left w-32">Segment</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {flags.map((flag) => (
              <tr key={flag.id} className="hover:bg-surface-2/50">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-accent">{flag.key}</span>
                </td>
                <td className="px-4 py-3">
                  <input
                    value={flag.description}
                    onChange={(e) => patchLocal(flag.id, { description: e.target.value })}
                    className="w-full bg-transparent text-xs text-text-muted focus:text-text focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={(e) => patchLocal(flag.id, { enabled: e.target.checked })}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={flag.rolloutPercentage}
                    onChange={(e) => patchLocal(flag.id, { rolloutPercentage: Number(e.target.value) })}
                    className="w-16 rounded bg-surface-2 px-2 py-1 text-center text-xs text-text"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={flag.userSegment.join(",")}
                    onChange={(e) => patchLocal(flag.id, { userSegment: e.target.value.split(",").map(s => s.trim()) })}
                    className="w-full rounded bg-surface-2 px-2 py-1 text-xs text-text"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => update(flag)}
                      disabled={saving === flag.id}
                      className="text-accent hover:text-accent/70 disabled:opacity-50"
                      title="Save"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(flag.id)}
                      className="text-danger hover:text-danger"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
