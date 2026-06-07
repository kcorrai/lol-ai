# TASK-086: Re-engagement Email — 7 Gün Giriş Yapmayana Otomatik Nudge

## Status: Open

## Context
`retentionService.ts` kullanıcının kaybetme serisi, death spike, CS düşüşü, tilt pattern ve geniş champion havuzu gibi sinyalleri hesaplıyor. Ancak bu sinyaller hiçbir zaman email olarak iletilmiyor. 7+ gün giriş yapmayan kullanıcılara otomatik bir re-engagement emaili göndermek için Inngest cron job ve email renderer gerekiyor.

## Deliverables

### 1. Inngest Function — `sendReengagementEmails.ts`
- Her gün 09:00 UTC çalışan cron
- Son `lastLoginAt` üzerinden 7-14 gün arası giriş yapmayan kullanıcıları bul
- Kullanıcı başına `computeRetentionSignals` çağır
- `primaryNudge` değerine göre kişiselleştirilmiş konu satırı ve içerik seç
- `webhookEvent` tablosuna idempotency key kaydet (aynı hafta ikinci email gitmesin)
- Gönderdikten sonra kullanıcıya `reengagement_sent_at` güncelle (ya da webhookEvent yeterli)

### 2. Email Renderer — `reengagementEmailRenderer.ts`
- Konum: `src/domains/coaching/services/reengagementEmailRenderer.ts`
- Nudge tipine göre farklı konu + HTML içerik döndür
- Türkçe içerik
- Nudge tipleri: `stop_queuing`, `pool_too_wide`, `loss_streak`, `death_spike`, `cs_drop`, `generic` (sinyal yoksa genel davet)

### 3. Email Konu Satırları (örnek)
- `stop_queuing` → "Dur bir dakika — verilerin tilt'te olduğunu gösteriyor"
- `loss_streak` → "{{n}} maçlık seri kaybın var. Koçun nedenini biliyor."
- `pool_too_wide` → "Çok fazla şampiyonla oynuyorsun — odaklan ve yüksel"
- `generic` → "Bir haftadır görünmüyorsun — hesabında neler oldu?"

### 4. API Route (opsiyonel test amaçlı)
- `GET /api/admin/reengagement-preview?userId=xxx` — email önizlemesi

## Acceptance Criteria
- [ ] Cron her gün çalışır, 7-14 gün sessiz kullanıcıları bulur
- [ ] Aynı kullanıcıya aynı haftada 1'den fazla email gitmez
- [ ] Her nudge tipinin kendine özgü konu ve body'si var
- [ ] `computeRetentionSignals` hata verirse kullanıcı atlanır, diğerleri devam eder
- [ ] Yeni Inngest function `src/inngest/index.ts`'e register edilir

## Technical Notes
- `sendWeeklyReportEmails.ts` ve `monthlyMilestoneService.ts` pattern'ını takip et
- Email gönderimi için mevcut `nodemailer` / transport kurulumunu kullan
- `lastLoginAt` yoksa `user.createdAt`'a bak; ilk kaydolma gününden 7 gün sonra da gönderilmeli
- Hata yakalama: her kullanıcı için `try/catch`, bir kullanıcı patlasa tüm batch durmasın
