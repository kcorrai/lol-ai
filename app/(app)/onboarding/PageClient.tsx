"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Gamepad2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SyncingStep, FinalStep } from "@/domains/onboarding/OnboardingFlow";
import { usePostHog } from "posthog-js/react";

type Step = "welcome" | "connect" | "syncing" | "final";

const VALID_REGIONS = [
  "na1", "euw1", "eun1", "kr", "jp1", "br1", "la1", "la2", "oc1", "tr1", "ru",
] as const;

const schema = z.object({
  gameName: z.string().min(1, "Riot adını gir").max(16),
  tagLine:  z.string().min(2, "Tag gir (örn. EUW)").max(5),
  region:   z.enum(VALID_REGIONS),
});

type FormValues = z.infer<typeof schema>;

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ["welcome", "connect", "syncing", "final"];
  return (
    <div className="mb-10 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full transition-all",
            s === current ? "w-6 bg-accent"
            : steps.indexOf(current) > i ? "bg-accent/50"
            : "bg-border"
          )} />
        </div>
      ))}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Zap className="h-7 w-7 text-accent" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold text-text">LoL AI Coach&apos;a hoş geldin</h1>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          2 dakikada hesabını bağla, ilk AI analiz raporunu al. Ne eksik olduğunu sana söyleyelim.
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
        {["Riot hesabını bağla", "AI koçunla maçlarını analiz et", "Kişisel gelişim planı al"].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {i + 1}
            </div>
            <p className="text-sm text-text">{item}</p>
          </div>
        ))}
      </div>
      <Button className="w-full" size="lg" onClick={onNext}>
        Başlayalım <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

interface ConnectResult { accountId: string; gameName: string }

function ConnectStep({ onSuccess }: { onSuccess: (r: ConnectResult) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const posthog = usePostHog();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { region: "euw1" },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const res = await fetch("/api/riot/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const json = await res.json() as { data?: { id: string; gameName: string }; error?: { message: string } };
    if (!res.ok) {
      setServerError(json.error?.message ?? "Hesap bağlanamadı, tekrar dene.");
      return;
    }
    posthog?.capture("onboarding_riot_connected");
    onSuccess({ accountId: json.data!.id, gameName: json.data!.gameName });
  }

  return (
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Gamepad2 className="h-7 w-7 text-accent" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-text">Riot hesabını bağla</h2>
        <p className="mt-2 text-sm text-text-muted">Riot ID&apos;nı gir. Maç geçmişini çekip analiz edeceğiz.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-text-muted">Oyun Adı</label>
            <Input placeholder="Adın" {...register("gameName")} />
            {errors.gameName && <p className="text-xs text-danger">{errors.gameName.message}</p>}
          </div>
          <div className="w-28 space-y-1.5">
            <label className="text-xs font-medium text-text-muted">Tag</label>
            <Input placeholder="EUW" {...register("tagLine")} />
            {errors.tagLine && <p className="text-xs text-danger">{errors.tagLine.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-muted">Sunucu</label>
          <select className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-ring" {...register("region")}>
            {VALID_REGIONS.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
        </div>
        {serverError && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{serverError}</p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bağlanıyor…</> : <>Hesabı Bağla <ChevronRight className="ml-1 h-4 w-4" /></>}
        </Button>
      </form>
      <p className="text-center text-xs text-text-muted">
        Şunları okuyoruz: maç geçmişi, sıra bilgisi. Hesabında hiçbir değişiklik yapmıyoruz.
      </p>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [accountId, setAccountId] = useState("");
  const [gameName, setGameName] = useState("");
  const [finalReportId, setFinalReportId] = useState<string | null>(null);
  const [emailRequired, setEmailRequired] = useState(false);
  const posthog = usePostHog();

  function handleConnected({ accountId: id, gameName: name }: ConnectResult) {
    setAccountId(id);
    setGameName(name);
    setStep("syncing");
    posthog?.capture("onboarding_step_connect_completed");
  }

  function handleSyncDone(reportId: string | null) {
    setFinalReportId(reportId);
    setEmailRequired(!reportId && step === "syncing");
    setStep("final");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        </div>
        <StepDots current={step} />
        <div className="rounded-2xl border border-border bg-surface p-8">
          {step === "welcome" && <WelcomeStep onNext={() => setStep("connect")} />}
          {step === "connect" && <ConnectStep onSuccess={handleConnected} />}
          {step === "syncing" && <SyncingStep accountId={accountId} gameName={gameName} onComplete={handleSyncDone} />}
          {step === "final"   && <FinalStep gameName={gameName} reportId={finalReportId} emailRequired={emailRequired} />}
        </div>
      </div>
    </div>
  );
}
