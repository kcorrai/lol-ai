"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamDashboardData } from "@/domains/teams/types/teams.types";

async function fetchDashboard(teamId: string, range: string): Promise<TeamDashboardData> {
  const res = await fetch(`/api/teams/${teamId}/dashboard?range=${range}`);
  if (!res.ok) throw new Error("Dashboard yüklenemedi");
  const body = await res.json() as { data: TeamDashboardData };
  return body.data;
}

async function removeMember(teamId: string, userId: string): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Üye çıkarılamadı");
}

async function changeRole(teamId: string, userId: string, role: "COACH" | "PLAYER"): Promise<void> {
  const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Rol değiştirilemedi");
}

export function useTeamDashboard(teamId: string, range: "7d" | "30d" | "90d" = "7d") {
  return useQuery({
    queryKey: ["team-dashboard", teamId, range],
    queryFn: () => fetchDashboard(teamId, range),
  });
}

export function useRemoveTeamMember(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeMember(teamId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });
}

export function useChangeTeamMemberRole(teamId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "COACH" | "PLAYER" }) =>
      changeRole(teamId, userId, role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team-dashboard", teamId] });
    },
  });
}
