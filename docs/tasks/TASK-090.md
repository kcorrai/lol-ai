# TASK-090: Admin Funnel Analytics Dashboard

## Status: Open

## Context
`/ai-cost` admin sayfasında AI harcamaları takip ediliyor. Ancak büyüme metrikleri (DAU/MAU, kayıt funnel'ı, free→pro dönüşüm, en çok kullanılan özellikler) hiç izlenmiyor. Bu veriler olmadan hangi özelliğin çalışıp hangisinin çalışmadığını anlamak imkânsız.

## Deliverables

### 1. Admin Metrics Service — `adminMetricsService.ts`
- Konum: `src/domains/admin/services/adminMetricsService.ts`
- Sorgular (Prisma, ham sayım):
  - `getDau(date)` — verilen günde giriş yapan tekil kullanıcı sayısı
  - `getMau(month)` — verilen ayda aktif tekil kullanıcı sayısı
  - `getSignupFunnel()` → `{ registered, riotConnected, firstReport, proPlan }`
  - `getConversionRate()` → free → pro oran (yüzde)
  - `getFeatureUsage(days)` → son N günde her özellik kaç kez kullanıldı
  - `getChurnedUsers(days)` → son N günde Pro'dan Free'ye düşen kullanıcı sayısı

### 2. API Route
`app/(admin)/analytics/route.ts`
- `GET /api/admin/analytics?range=7|30|90`
- Admin session kontrolü (mevcut ai-cost route'ındaki pattern)
- Tüm metrikleri tek yanıtta döndür

### 3. Admin Analytics Sayfası
`app/(admin)/analytics/page.tsx`
- Kart grid: DAU (bugün), MAU (bu ay), Toplam Kullanıcı, Pro Kullanıcı, Dönüşüm Oranı
- Signup Funnel: yatay bar — Kayıt → Riot Bağlı → İlk Rapor → Pro
- Range seçici: 7 gün / 30 gün / 90 gün
- En çok kullanılan özellikler: sıralı liste (rapor üretme, coach chat, recap, heatmap vs.)
- Mevcut `/ai-cost` sayfasına nav linki ekle

### 4. Feature Usage Tracking
Özellik kullanımını saymak için mevcut verilerden türet (yeni event tablosu açma):
- Rapor üretimi: `CoachingReport` kayıt sayısı
- Coach chat: `ChatMessage` kayıt sayısı
- Recap: `RecapCache` kayıt sayısı
- Heatmap: `heatmapService` API çağrısı — API route'una Prisma sayım ekle
- `matchParticipant` toplam kayıt sayısı → senkronize edilmiş maç sayısı

## Acceptance Criteria
- [ ] `/admin/analytics` sayfası admin session olmadan açılmıyor
- [ ] DAU, MAU, funnel ve dönüşüm oranı doğru hesaplanıyor
- [ ] Range seçici (7/30/90 gün) çalışıyor
- [ ] Sayfa 2 saniye içinde yükleniyor (N+1 sorgu yok)
- [ ] `/ai-cost` admin sayfasında analytics'e link var

## Technical Notes
- DAU için `session` tablosu veya `User.updatedAt` proxy olarak kullanılabilir; alternatif olarak `RiotAccount.updatedAt` son sync zamanı gösterir
- `adminMetricsService` tüm sorgularını paralel `Promise.all` ile çalıştır
- Bu sayfa SSR — React Query yok, server component
- `aiCostService.ts` pattern'ını takip et
