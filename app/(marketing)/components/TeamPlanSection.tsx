import Link from "next/link";
import { Users, BarChart2, Mail, Trophy, Shield } from "lucide-react";

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
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-warning">
            <Users className="h-3.5 w-3.5" />
            Team Plan
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-text md:text-4xl">
            Takımın için{" "}
            <span className="text-warning">AI Koçu</span>
          </h2>
          <p className="mt-3 mx-auto max-w-xl text-text-muted">
            Esports akademileri, okul ligleri ve arkadaş grupları için. Tüm takımı tek panelden yönet, haftalık raporlarla gelişimi takip et.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          {/* Feature cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-background p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <f.icon className="h-4 w-4 shrink-0 text-warning" />
                  <p className="text-sm font-semibold text-text">{f.title}</p>
                </div>
                <p className="text-xs text-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Pricing card */}
          <div className="rounded-2xl border border-warning/30 bg-warning/5 p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-warning">Team Plan</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-text">$29.99</span>
                <span className="text-text-muted">/ay</span>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Tüm Pro özellikleri dahil · 5 takım · 5 üye/takım
              </p>
            </div>

            <ul className="space-y-2">
              {PLAN_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-text">
                  <span className="shrink-0 text-warning">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3">
              <Link
                href="/settings/billing"
                className="block w-full rounded-xl bg-warning px-5 py-3 text-center text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Team Başlat — $29.99/ay
              </Link>
              <a
                href="mailto:team@lolaicoach.gg"
                className="block w-full rounded-xl border border-border px-5 py-3 text-center text-sm font-semibold text-text-muted transition-colors hover:text-text"
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
