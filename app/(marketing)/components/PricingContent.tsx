"use client";

import { useState } from "react";
import { PricingCard } from "./PricingCard";
import { PricingComparisonTable } from "./PricingComparisonTable";

const FREE_FEATURES = [
  { label: "Ayda 3 AI koçluk raporu" },
  { label: "1 Riot hesabı" },
  { label: "10 maçlık geçmiş" },
  { label: "Maç detay analizi" },
  { label: "Rank takibi" },
  { label: "Counter Pick (3 counter)" },
  { label: "Draft Analizci" },
];

const PRO_BASE_FEATURES = [
  { label: "Sınırsız AI koçluk raporu" },
  { label: "3 Riot hesabı" },
  { label: "100 maçlık geçmiş" },
  { label: "Counter Pick (tam liste)" },
  { label: "Öncelikli AI işleme" },
];

const PRO_EXCLUSIVE_FEATURES = [
  { label: "Matchup Zekası" },
  { label: "Şampiyon Ustalık Skoru" },
  { label: "Alışkanlık Tespit Motoru" },
  { label: "Gelişim Planı & Geçmişi" },
  { label: "Paylaşılabilir AI Rapor Kartları" },
  { label: "Haftalık AI Gelişim E-postası" },
  { label: "Sesli Koçluk (TTS)" },
];

const TEAM_BASE_FEATURES = [
  { label: "Tüm Pro özellikleri" },
  { label: "5'e kadar takım oluşturma" },
  { label: "5 kişilik takım (tam kadro)" },
];

const TEAM_EXCLUSIVE_FEATURES = [
  { label: "Takım performans panosu" },
  { label: "Coach / Oyuncu rolleri" },
  { label: "E-posta ile üye daveti" },
  { label: "Toplu üye analizi" },
];

const MONTHLY_PRICE = "$9.99";
const ANNUAL_PRICE_PER_MONTH = "$8.33";
const ANNUAL_TOTAL = "$99.90";
const TEAM_PRICE = "$29.99";

export function PricingContent() {
  const [isAnnual, setIsAnnual] = useState(false);

  const proPrice = isAnnual ? ANNUAL_PRICE_PER_MONTH : MONTHLY_PRICE;
  const proPeriod = isAnnual ? "/ay (yıllık)" : "/ay";
  const proCtaLabel = isAnnual
    ? `Pro Başlat — ${ANNUAL_TOTAL}/yıl`
    : `Pro Başlat — ${MONTHLY_PRICE}/ay`;
  const proCtaHref = isAnnual
    ? `/settings/billing?period=annual`
    : `/settings/billing`;

  return (
    <>
      {/* Period toggle */}
      <div className="mb-12 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-1">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              !isAnnual ? "bg-accent text-background" : "text-text-muted hover:text-text"
            }`}
          >
            Aylık
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors ${
              isAnnual ? "bg-accent text-background" : "text-text-muted hover:text-text"
            }`}
          >
            Yıllık
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isAnnual ? "bg-background/20 text-background" : "bg-success/15 text-success"
              }`}
            >
              2 ay bedava
            </span>
          </button>
        </div>
        {isAnnual && (
          <p className="text-xs text-text-muted">
            Yıllık ödeme ile{" "}
            <span className="font-semibold text-success">toplam {ANNUAL_TOTAL}</span> — aylıktan %17 ucuz.
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="mx-auto mb-20 grid max-w-5xl gap-8 md:grid-cols-3 md:items-start">
        <PricingCard
          plan="free"
          name="Free"
          price="$0"
          description="Başlamak için gereken her şey."
          features={FREE_FEATURES}
          cta="Ücretsiz Başla"
          ctaHref="/register"
        />
        <PricingCard
          plan="pro"
          name="Pro"
          price={proPrice}
          period={proPeriod}
          description="Rank yükseltmeye ciddi bakanlar için."
          features={PRO_BASE_FEATURES}
          proFeatures={PRO_EXCLUSIVE_FEATURES}
          cta={proCtaLabel}
          ctaHref={proCtaHref}
        />
        <PricingCard
          plan="team"
          name="Team"
          price={TEAM_PRICE}
          period="/ay"
          description="Takımlarını analiz et, koçluk yap."
          features={TEAM_BASE_FEATURES}
          proFeatures={TEAM_EXCLUSIVE_FEATURES}
          cta={`Team Başlat — ${TEAM_PRICE}/ay`}
          ctaHref="/settings/billing"
        />
      </div>

      {/* Comparison table */}
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center font-display text-2xl font-bold text-text">
          Özellik Karşılaştırması
        </h2>
        <PricingComparisonTable />
      </div>

      <p className="mt-10 text-center text-sm text-text-muted">
        Tüm planlara sınırsız maç senkronizasyonu ve dashboard erişimi dahildir.{" "}
        <span className="text-text">Gizli ücret yok.</span>
      </p>
    </>
  );
}
