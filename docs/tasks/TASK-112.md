# TASK-112: Comparison Table ve Plan Limitleri Tutarlılığı

## Status: TODO

## Amaç
Marketing comparison table ile authorization.ts plan limitleri arasındaki uyumsuzlukları gider.

## Yapılacaklar
- [ ] Comparison table'da team için "Maç Geçmişi" 100 yazıyor ama PLAN_LIMITS.team.matchHistoryDepth = 200 — 200'e güncelle
- [ ] "Riot Hesabı" team için 3 yazıyor ama PLAN_LIMITS.team.maxRiotAccounts = 5 — 5'e güncelle
- [ ] Billing sayfasındaki PRO_FEATURES listesini kontrol et, gerçek limitlerle eşleştir

## Etkilenen Dosyalar
- `app/(marketing)/components/PricingComparisonTable.tsx`
- `app/(app)/settings/billing/page.tsx`
