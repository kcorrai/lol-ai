# TASK-089: Yıllık Ödeme Seçeneği — Annual Billing Toggle

## Status: Open

## Context

Pricing sayfasında sadece aylık plan mevcut. Yıllık ödeme seçeneği hem kullanıcılar için tasarruf sağlar (%20 indirim), hem de şirket için öngörülebilir yıllık gelir ve daha düşük churn demektir. LemonSqueezy'de yıllık plan oluşturulup, pricing sayfasına toggle eklenmesi yeterli.

## Deliverables

### 1. LemonSqueezy'de Plan Oluşturma (Manuel Adım)

- Pro Monthly: mevcut plan
- Pro Yearly: aylık fiyat × 10 (2 ay bedava = ~%17 indirim, "Yıllık al, 2 ay bedava")
- Yeni plan variant ID'sini `.env.example`'a ekle: `LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID`

### 2. Pricing Sayfası — Toggle

`app/(marketing)/pricing/page.tsx`

- "Aylık / Yıllık" toggle (client component `"use client"`)
- Yıllık seçilince fiyat animasyonla değişir
- "2 ay bedava" veya "%17 tasarruf" badge'i göster
- Seçime göre farklı LemonSqueezy checkout URL'si

### 3. Checkout URL Yönlendirmesi

- `GET /api/billing/checkout?plan=pro&period=annual` veya `monthly`
- LemonSqueezy overlay checkout — mevcut aylık akışla aynı pattern

### 4. Subscription Kontrolü

`src/hooks/useSubscription.ts` ve ilgili API route:

- `sub.billingPeriod: "monthly" | "annual"` alanı ekle
- Settings → Billing sayfasında mevcut plan dönemini göster

### 5. env.example Güncellemesi

```env
# LemonSqueezy — Plan Variant IDs
LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID=your_monthly_variant_id
LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID=your_yearly_variant_id
```

## Acceptance Criteria

- [ ] Pricing sayfasında aylık/yıllık toggle çalışıyor
- [ ] Yıllık seçildiğinde doğru fiyat ve checkout URL'si kullanılıyor
- [ ] Toggle state URL query param'ında tutuluyor (`?period=annual`) — sayfa yenilenince kaybolmuyor
- [ ] Settings/Billing'de kullanıcının dönem bilgisi gösteriliyor
- [ ] `.env.example` güncellendi

## Technical Notes

- Toggle için Zustand veya `useState` — bu saf client UI state, Zustand şart değil
- LemonSqueezy checkout URL pattern'ı: `https://lolaicoach.lemonsqueezy.com/checkout/buy/{{variantId}}`
- Mevcut `src/domains/billing/` veya ilgili billing route'unu incele, pattern'ı koru
- `docs/DEPENDENCIES.md`'yi güncelleme — yeni paket yok, sadece config değişikliği
