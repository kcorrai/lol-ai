"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

async function deleteTeamRequest(teamId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Takım silinemedi");
  }
}

interface DangerZoneProps {
  teamId: string;
  teamName: string;
}

export function DangerZone({ teamId, teamName }: DangerZoneProps) {
  const [confirm, setConfirm] = useState(false);
  const [input, setInput] = useState("");
  const router = useRouter();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => deleteTeamRequest(teamId),
    onSuccess: () => {
      router.push("/teams");
    },
  });

  const canDelete = input === teamName;

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <p className="text-sm font-bold text-danger">Tehlikeli Bölge</p>
      </div>

      <p className="text-xs text-text-muted leading-relaxed">
        Takımı silmek geri alınamaz. Tüm üyelik verileri, davetler ve takım geçmişi silinir.
      </p>

      {!confirm ? (
        <Button size="sm" variant="ghost"
          className="gap-1.5 border border-danger/40 text-danger hover:bg-danger/10 hover:text-danger"
          onClick={() => setConfirm(true)}>
          <Trash2 className="h-3.5 w-3.5" />
          Takımı Sil
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-text">
            Onaylamak için takım adını yazın: <span className="text-danger font-bold">{teamName}</span>
          </p>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={teamName}
            className="w-full rounded-lg border border-danger/30 bg-surface px-3 py-2 text-sm text-text focus:border-danger/60 focus:outline-none"
          />
          {error instanceof Error && (
            <p className="text-xs text-danger">{error.message}</p>
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setConfirm(false); setInput(""); }}
              className="text-text-muted">
              İptal
            </Button>
            <Button size="sm" onClick={() => mutate()} disabled={isPending || !canDelete}
              className="gap-1.5 bg-danger hover:bg-danger/90 text-white">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Sil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
