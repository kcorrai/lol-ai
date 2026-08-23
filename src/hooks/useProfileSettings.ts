import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfileSettings } from "@/domains/identity/services/profileService";

type FullSettings = ProfileSettings & { profilePublic: boolean; profileSlug: string | null };

async function fetchSettings(): Promise<FullSettings> {
  const res = await fetch("/api/user/profile-settings");
  if (!res.ok) throw new Error("Failed to fetch profile settings");
  const json = (await res.json()) as { data: FullSettings };
  return json.data;
}

async function patchSettings(update: Partial<FullSettings>): Promise<void> {
  const res = await fetch("/api/user/profile-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error("Failed to save settings");
}

export function useProfileSettings() {
  return useQuery({ queryKey: ["profile-settings"], queryFn: fetchSettings, staleTime: 60_000 });
}

export function useUpdateProfileSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-settings"] }),
  });
}
