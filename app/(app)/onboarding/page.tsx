"use client";

import { useState, useEffect } from "react";
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

function DoneStep({ gameName }: { gameName: string }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(4);

  useEffect(() => {
    if (seconds <= 0) {
      router.push("/coaching");
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, router]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/15">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-text">
            Hazırsın, {gameName}!
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Maç verilerin hazırlanıyor. İlk AI raporunu almaya hazır mısın?
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
        {[
          { label: "Riot hesabı bağlandı", done: true },
          { label: "Maç geçmişi senkronize ediliyor", done: false, loading: true },
          { label: "AI koçun seni bekliyor", done: false, loading: false },
        ].map(({ label, done, loading }, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              done ? "bg-green-500/20" : loading ? "bg-accent/15" : "bg-border/50"
            )}>
              {done && <CheckCircle2 className="h-3 w-3 text-green-400" />}
              {!done && loading && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
              {!done && !loading && <div className="h-1.5 w-1.5 rounded-full bg-text-muted/40" />}
            </div>
            <p className={cn(
              "text-sm",
              done ? "text-text" : loading ? "text-accent font-medium" : "text-text-muted/60"
            )}>
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <a
          href="/coaching"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 text-base font-bold text-background transition-opacity hover:opacity-90"
        >
          İlk Raporumu Al <ChevronRight className="h-5 w-5" />
        </a>
        <p className="text-center text-xs text-text-muted">
          {seconds > 0
            ? `${seconds} saniye içinde otomatik yönlendiriliyorsun…`
            : "Yönlendiriliyor…"}
        </p>
        <p className="text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-text-muted/50 underline-offset-2 hover:text-text-muted transition-colors hover:underline"
          >
            Şimdilik dashboard&apos;a git
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("welcome");
  const [connectedName, setConnectedName] = useState("");

  function handleConnected(gameName: string) {
    setConnectedName(gameName);
    setStep("done");
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
          {step === "done"    && <DoneStep gameName={connectedName} />}
        </div>
      </div>
    </div>
  );
}
