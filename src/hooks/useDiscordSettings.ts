import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DiscordSettings {
  discordUsername: string | null;
  webhookUrl: string | null;
  hasWebhook: boolean;
  notifyRankUp: boolean;
  notifyBadge: boolean;
  notifyWeekly: boolean;
}

interface SavePayload {
  webhookUrl: string;
  notifyRankUp: boolean;
  notifyBadge: boolean;
  notifyWeekly: boolean;
}

async function fetchDiscordSettings(): Promise<DiscordSettings | null> {
  const res = await fetch("/api/settings/discord");
  if (!res.ok) throw new Error("Failed to fetch Discord settings");
  const json = await res.json() as { data: DiscordSettings | null };
  return json.data;
}

async function saveDiscordSettings(payload: SavePayload): Promise<void> {
  const res = await fetch("/api/settings/discord", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save Discord settings");
}

async function deleteDiscordIntegration(): Promise<void> {
  const res = await fetch("/api/settings/discord", { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove Discord integration");
}

async function sendTestMessage(): Promise<void> {
  const res = await fetch("/api/settings/discord/test", { method: "POST" });
  if (!res.ok) {
    const json = await res.json() as { message?: string };
    throw new Error(json.message ?? "Test failed");
  }
}

export function useDiscordSettings() {
  return useQuery({ queryKey: ["discord-settings"], queryFn: fetchDiscordSettings, staleTime: 30_000 });
}

export function useSaveDiscordSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: saveDiscordSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discord-settings"] }),
  });
}

export function useDeleteDiscordIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscordIntegration,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discord-settings"] }),
  });
}

export function useSendTestMessage() {
  return useMutation({ mutationFn: sendTestMessage });
}
