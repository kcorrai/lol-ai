"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Gamepad2, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type Step = "welcome" | "connect" | "done";

const VALID_REGIONS = [
  "na1", "euw1", "eun1", "kr", "jp1", "br1", "la1", "la2", "oc1", "tr1", "ru",
] as const;

const schema = z.object({
  gameName: z.string().min(1, "Riot adını gir").max(16),
  tagLine:  z.string().min(2, "Tag gir (örn. EUW)").max(5),
  region:   z.enum(VALID_REGIONS),
});

type FormValues = z.infer<typeof schema>;

// ── Step indicator ────────────────────────────────────────────────────────────

function StepDots({ current }: { current: Step }) {
  const steps: Step[] = ["welcome", "connect", "done"];
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              s === current
                ? "w-6 bg-accent"
                : steps.indexOf(current) > i
                ? "bg-accent/50"
                : "bg-border"
            )}
          />
        </div>
      ))}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Zap className="h-7 w-7 text-accent" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold text-text">
          LoL AI Coach&apos;a hoş geldin
        </h1>
        <p className="mt-3 text-base text-text-muted leading-relaxed">
          2 dakikada hesabını bağla, ilk AI analiz raporunu al.
          Ne eksik olduğunu sana söyleyelim.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
        {[
          "Riot hesabını bağla",
          "AI koçunla maçlarını analiz et",
          "Kişisel gelişim planı al",
        ].map((item, i) => (
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

function ConnectStep({ onSuccess }: { onSuccess: (gameName: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

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
    const json = (await res.json()) as { error?: { message: string } };
    if (!res.ok) {
      setServerError(json.error?.message ?? "Hesap bağlanamadı, tekrar dene.");
      return;
    }
    onSuccess(values.gameName);
  }

  return (
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Gamepad2 className="h-7 w-7 text-accent" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-text">Riot hesabını bağla</h2>
        <p className="mt-2 text-sm text-text-muted">
          Riot ID&apos;nı gir. Maç geçmişini çekip analiz edeceğiz.
        </p>
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
          <select
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-ring"
            {...register("region")}
          >
            {VALID_REGIONS.map((r) => (
              <option key={r} value={r}>{r.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {serverError && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Bağlanıyor…</>
          ) : (
            <>Hesabı Bağla <ChevronRight className="ml-1 h-4 w-4" /></>
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-text-muted">
        Şunları okuyoruz: maç geçmişi, sıra bilgisi. Hesabında hiçbir değişiklik yapmıyoruz.
      </p>
    </div>
  );
}

function DoneStep({ gameName, onFinish }: { gameName: string; onFinish: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15">
        <CheckCircle2 className="h-7 w-7 text-green-400" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-text">
          Hazırsın, {gameName}!
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Maç verilerini çekiyoruz. Dashboard&apos;da her şeyi görebilirsin.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "İlk Raporu Al", href: "/coaching", accent: true },
          { label: "Dashboard", href: "/dashboard", accent: false },
          { label: "Champion Pool", href: "/champions", accent: false },
          { label: "Counter Pick", href: "/counter", accent: false },
        ].map(({ label, href, accent }) => (
          <a
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-medium transition-colors",
              accent
                ? "border-accent bg-accent/10 text-accent hover:bg-accent/20"
                : "border-border text-text-muted hover:border-accent/40 hover:text-text"
            )}
          >
            {label}
          </a>
        ))}
      </div>

      <Button className="w-full" size="lg" onClick={onFinish}>
        Dashboard&apos;a Git
      </Button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [connectedName, setConnectedName] = useState("");

  function handleConnected(gameName: string) {
    setConnectedName(gameName);
    setStep("done");
  }

  function handleFinish() {
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <Zap className="h-5 w-5 text-accent" />
          <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
        </div>

        <StepDots current={step} />

        <div className="rounded-2xl border border-border bg-surface p-8">
          {step === "welcome" && <WelcomeStep onNext={() => setStep("connect")} />}
          {step === "connect" && <ConnectStep onSuccess={handleConnected} />}
          {step === "done"    && <DoneStep gameName={connectedName} onFinish={handleFinish} />}
        </div>
      </div>
    </div>
  );
}
