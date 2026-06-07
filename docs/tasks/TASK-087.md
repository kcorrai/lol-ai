# TASK-087: Referral Sistemi — Davet Et, İkisi de Kazan

## Status: Open

## Context
Viral büyüme için referral döngüsü tamamen eksik. Kullanıcılar arkadaşlarını platforma davet ettiğinde her iki tarafa da ödül verilmeli. LemonSqueezy coupon API'si üzerinden indirim kodu üretilebilir ya da uygulama içi XP/Pro deneme süresi verilebilir.

## Deliverables

### 1. DB Schema
```prisma
model Referral {
  id          String   @id @default(cuid())
  referrerId  String
  refereeId   String?
  code        String   @unique
  status      String   @default("pending") // pending | completed | rewarded
  createdAt   DateTime @default(now())
  completedAt DateTime?

  referrer    User     @relation("ReferralsGiven", fields: [referrerId], references: [id])
  referee     User?    @relation("ReferralsReceived", fields: [refereeId], references: [id])
}
```
`User` modeline `referrals Referral[] @relation("ReferralsGiven")` ve `referredBy Referral? @relation("ReferralsReceived")` ekle.

### 2. Service — `referralService.ts`
- Konum: `src/domains/identity/services/referralService.ts`
- `generateReferralCode(userId)` — kullanıcıya özgü 8 karakter kod üret, DB'ye kaydet
- `applyReferralCode(code, newUserId)` — kayıt sırasında kodu uygula, referee'yi bağla
- `completeReferral(refereeId)` — referee ilk Riot hesabını bağladığında tetiklenir, status → completed, her iki kullanıcıya ödül ver
- Ödül: 7 gün Pro trial (XP tabanlı, LemonSqueezy'ye dokunmadan)

### 3. API Routes
- `GET /api/referral/code` — kullanıcının kendi referral kodunu döndür (yoksa üret)
- `POST /api/referral/apply` — body: `{ code }` — giriş yapmış kullanıcıya kodu uygula
- `GET /api/referral/stats` — kaç kişi davet edildi, kaçı tamamlandı

### 4. Kayıt Sayfası Entegrasyonu
- `app/(auth)/register/page.tsx` — URL'de `?ref=CODE` varsa form submit'e ekle
- Kayıt başarılı olduğunda `applyReferralCode` çağır

### 5. Settings Sayfası — Referral Widget
- `app/(app)/settings/profile/page.tsx`'e referral kartı ekle
- Kodu göster + kopyala butonu
- "X arkadaşın katıldı, Y tanesi Pro'ya geçti" istatistikleri

### 6. Share URL
- Format: `https://lolaicoach.gg/register?ref=ABCD1234`
- Native share API veya kopyala butonu ile paylaş

## Acceptance Criteria
- [ ] Her kullanıcının benzersiz bir referral kodu var
- [ ] Kayıt URL'sindeki kod kayıt sonrası otomatik uygulanır
- [ ] Referee Riot hesabı bağladığında her iki tarafa 7 gün Pro trial eklenir
- [ ] Aynı kullanıcı birden fazla kez ödül alamaz
- [ ] Referral istatistikleri settings sayfasında görünür

## Technical Notes
- Pro trial: `user.proTrialEndsAt DateTime?` kolonu yoksa migration'a ekle
- `proTrialEndsAt > now()` ise `isPro = true` döndür (subscription check'e ekle)
- Referral kodu çakışma ihtimaline karşı unique constraint + retry logu
