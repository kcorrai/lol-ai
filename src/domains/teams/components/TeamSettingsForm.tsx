"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

async function patchTeam(teamId: string, data: { name?: string }): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Güncelleme başarısız");
  }
}

interface TeamSettingsFormProps {
  teamId: string;
  initialName: string;
}

export function TeamSettingsForm({ teamId, initialName }: TeamSettingsFormProps) {
  const [name, setName] = useState(initialName);
  const qc = useQueryClient();

  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: () => patchTeam(teamId, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-teams"] });
      void qc.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });

  const isDirty = name.trim() !== initialName;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <p className="text-sm font-bold text-text">Genel Bilgiler</p>

      <div className="space-y-1.5">
        <label htmlFor="team-name" className="text-xs font-medium text-text-muted">
          Takım Adı
        </label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
        />
      </div>

      {error instanceof Error && (
        <p className="text-xs text-danger">{error.message}</p>
      )}
      {isSuccess && (
        <p className="text-xs text-success">Kaydedildi.</p>
      )}

      <Button
        size="sm"
        onClick={() => mutate()}
        disabled={isPending || !isDirty || name.trim().length < 2}
        className="gap-1.5"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Kaydet
      </Button>
    </div>
  );
}
