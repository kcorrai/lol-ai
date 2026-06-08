import Link from "next/link";
import { Users, BarChart2, Mail, Trophy, Shield, Check } from "lucide-react";

const FEATURES = [
  {
    icon: Users,
    title: "5 Kişilik Takım",
    desc: "Tam kadro 5v5 desteği. Her üye için ayrı AI analiz ve koçluk raporu.",
  },
  {
    icon: BarChart2,
    title: "Koç Panosu",
    desc: "Tüm oyuncuların rankını, KDA ve CS istatistiklerini tek ekranda gör.",
  },
  {
    icon: Mail,
    title: "Haftalık Takım Raporu",
    desc: "Her Pazartesi otomatik e-posta: kim form tuttu, kim geriledi, kim müdahale istiyor.",
  },
  {
    icon: Trophy,
    title: "5'e Kadar Takım",
    desc: "Farklı grupları, ligleri veya jenerasyon katmanlarını ayrı takımlar olarak yönet.",
  },
  {
    icon: Shield,
    title: "Coach & Oyuncu Rolleri",
    desc: "Koç olarak tüm üyeleri yönet, oyuncular sadece kendi verilerine odaklanır.",
  },
];

const PLAN_FEATURES = [
  "Sınırsız AI koçluk raporu",
  "5 adet 5 kişilik takım (25 üye)",
  "Takım performans panosu",
  "Coach ve oyuncu rolleri",
  "E-posta ile üye daveti",
  "Haftalık otomatik takım raporu",
  "Toplu üye analizi",
  "Tüm Pro özellikleri dahil",
];

export function TeamPlanSection() {
  return (
    <section className="relative overflow-hidden bg-background py-24">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute left-1/4 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-warning/8 blur-[140px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-accent/6 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
            <Users className="h-3.5 w-3.5" />
            Esports Akademileri &amp; Takımlar
          </span>
          <h2 className="mt-5 font-display text-4xl font-bold text-text md:text-5xl lg:text-6xl">
            Takımın için{" "}
            <span className="text-warning">AI Koçu</span>
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-base text-text-muted md:text-lg">
            Esports akademileri, okul ligleri ve arkadaş grupları için. Tüm takımı tek panelden yönet,
            haftalık raporlarla gelişimi takip et.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Feature cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-surface p-5 space-y-2 transition-colors hover:border-warning/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <f.icon className="h-4 w-4 shrink-0 text-warning" />
                  </div>
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing card */}
          <div className="relative rounded-2xl border-2 border-warning/40 bg-surface p-8 space-y-6 shadow-[0_0_60px_-15px_rgba(245,158,11,0.25)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-warning px-4 py-1 text-xs font-bold uppercase tracking-wider text-background">
                En Popüler
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-warning">Team Plan</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold text-text">$29.99</span>
                <span className="text-text-muted">/ay</span>
              </div>
              <p className="mt-1.5 text-sm text-text-muted">
                Tüm Pro özellikleri dahil · 5 takım · 5 üye/takım
              </p>
            </div>

            <ul className="space-y-2.5">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-text">
                  <Check className="h-4 w-4 shrink-0 text-warning" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="block w-full rounded-xl bg-warning px-5 py-3.5 text-center text-sm font-bold text-background transition-opacity hover:opacity-90"
              >
                Team Başlat — $29.99/ay
              </Link>
              <a
                href="mailto:team@lolaicoach.gg"
                className="block w-full rounded-xl border border-border px-5 py-3.5 text-center text-sm font-semibold text-text-muted transition-colors hover:border-warning/40 hover:text-text"
              >
                Kurumsal Teklif Al
              </a>
            </div>

            <p className="text-center text-xs text-text-muted">
              LemonSqueezy ile güvenli ödeme · İstediğin zaman iptal et
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
