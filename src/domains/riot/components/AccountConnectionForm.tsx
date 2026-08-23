"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RIOT_REGION_OPTIONS } from "@/domains/riot/config/regions";
import type { RiotRegion } from "@/domains/riot/config/regions";

const schema = z.object({
  gameName: z.string().min(1, "Enter your Riot game name").max(16),
  tagLine: z.string().min(2, "Enter tag (e.g., EUW)").max(5),
  region: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AccountConnectionForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { region: "euw1" as RiotRegion },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch("/api/riot/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = (await res.json()) as { error?: { message: string } };
    if (!res.ok) {
      setServerError(json.error?.message ?? "Could not connect account");
      return;
    }
    // Refetch the accounts list so it shows the new account without a hard refresh (TASK-229).
    await queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    // data-tour anchor: the forced first-journey (TASK-217) spotlights this card on its connect
    // step. Without it the guide overlay can't cut a hole and freezes the page (TASK-220).
    <Card data-tour="connect-form">
      <CardHeader>
        <CardTitle>Connect Your Riot Account</CardTitle>
        <CardDescription>Enter your Riot ID (GameName#TAG)</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-sm text-text-muted">Game Name</label>
              <Input placeholder="YourName" {...register("gameName")} />
              {errors.gameName && <p className="text-xs text-danger">{errors.gameName.message}</p>}
            </div>
            <div className="w-24 space-y-1">
              <label className="text-sm text-text-muted">Tag</label>
              <Input placeholder="EUW" {...register("tagLine")} />
              {errors.tagLine && <p className="text-xs text-danger">{errors.tagLine.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-text-muted">Server / Region</label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              {...register("region")}
            >
              {RIOT_REGION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-xs text-danger">{errors.region.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connecting…" : "Connect Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
