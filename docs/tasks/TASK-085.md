# TASK-085 — Discord Entegrasyonu (Bot + Webhook)

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P2

---

## Objective

İki yönlü Discord entegrasyonu: kullanıcı Discord hesabını bağlayabilsin
ve seçtiği sunucuya/kanala otomatik bildirimler gönderilsin (rank atlama,
rozet kazanma, haftalık özet). Opsiyonel olarak basit bir Discord bot
komutu ekle: `/lolcoach stats` ile kullanıcının özetini döndürsün.

---

## User Story

> "Discord sunucumda arkadaşlarım var. Rank atladığımda otomatik olarak
> oraya bir mesaj gitse çok iyi olurdu. Ayrıca /stats yazınca özetimi
> görmek istiyorum."

---

## Acceptance Criteria

- [ ] Kullanıcı Discord OAuth2 ile hesabını bağlayabiliyor
- [ ] Webhook URL girişi: kullanıcı kendi Discord kanalının webhook URL'ini giriyor
- [ ] Rank atlama olayında webhook'a mesaj gönderiliyor (embed formatında)
- [ ] Rozet kazanma olayında webhook mesajı (opsiyonel, kullanıcı seçiyor)
- [ ] Haftalık özet bildirimi (Pazartesi sabahı)
- [ ] Bağlantı test butonu: "Test Gönder"
- [ ] Discord hesabı güvenli saklanıyor (webhook URL encrypted veya hashed)
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### DB Schema

```prisma
model DiscordIntegration {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @unique @db.Uuid
  discordUserId    String?  // OAuth2 ile bağlıysa
  discordUsername  String?
  webhookUrl       String   // encrypted
  notifyRankUp     Boolean  @default(true)
  notifyBadge      Boolean  @default(false)
  notifyWeekly     Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("discord_integrations")
}
```

Webhook URL şifreleme: `crypto.createCipheriv` ile AES-256, anahtar env var'dan.

### Webhook Gönderim Servisi

```typescript
// src/lib/discord/webhookService.ts

export async function sendDiscordWebhook(
  webhookUrl: string,
  embed: DiscordEmbed
): Promise<void>

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;          // hex renk kodu
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  thumbnail?: { url: string };
}
```

### Rank Atlama Mesajı

```typescript
// Rank change event tespit edilince (rankHistory'de tier değişimi):
const embed = {
  title: '🏆 Rank Atladı!',
  description: `**${gameName}#${tagLine}** yeni ranka ulaştı!`,
  color: 0xFFD700, // altın
  fields: [
    { name: 'Önceki Rank', value: 'Gold II', inline: true },
    { name: 'Yeni Rank', value: 'Platinum IV', inline: true },
  ],
  footer: { text: 'lolaicoach.com · AI destekli LoL koçluğu' }
};
```

### Rozet Kazanma Mesajı

```typescript
const embed = {
  title: `🎖️ Yeni Rozet: ${achievement.name}`,
  description: achievement.description,
  color: TIER_COLORS[achievement.tier], // bronz/gümüş/altın/platin
  thumbnail: { url: `https://lolaicoach.com/achievements/${achievement.iconSlug}` }
};
```

### Haftalık Özet Mesajı

Pazartesi Inngest cron'u (mevcut haftalık email ile aynı anda):
```typescript
// Mevcut weeklyEmailSender.ts ile aynı veriyi kullan
// Email yerine Discord embed olarak gönder
```

### Ayarlar Sayfası

```typescript
// app/(app)/settings/discord/page.tsx

Bölümler:
1. Webhook URL girişi + "Test Gönder" butonu
2. Bildirim tercihleri (checkbox × 3)
3. Bağlantıyı Kaldır butonu
```

### API

```
GET  /api/settings/discord          ← mevcut bağlantı durumu
POST /api/settings/discord          ← webhook URL kaydet + tercihler
POST /api/settings/discord/test     ← test mesajı gönder
DELETE /api/settings/discord        ← bağlantıyı kaldır
```

---

## Inngest Entegrasyonu

Mevcut event'lere Discord webhook gönderimi ekle:

```typescript
// rankChange event handler'ına:
if (discordIntegration?.notifyRankUp) {
  await sendDiscordWebhook(decrypt(discordIntegration.webhookUrl), rankUpEmbed);
}

// achievementChecker'a:
if (discordIntegration?.notifyBadge) {
  await sendDiscordWebhook(...);
}
```

---

## Files

```
prisma/schema.prisma                                    ← DiscordIntegration model
prisma/migrations/YYYYMMDD_add_discord_integration/     ← YENİ
src/lib/discord/webhookService.ts                       ← YENİ
src/lib/discord/embeds.ts                               ← YENİ (embed builder'lar)
src/lib/crypto/encrypt.ts                               ← YENİ (webhook URL şifreleme)
app/(app)/settings/discord/page.tsx                     ← YENİ
app/api/settings/discord/route.ts                       ← GET, POST, DELETE
app/api/settings/discord/test/route.ts                  ← POST test mesaj
src/hooks/useDiscordSettings.ts                         ← YENİ TanStack Query
src/inngest/functions/achievementChecker.ts             ← Discord entegre et
src/inngest/functions/weeklyEmailSender.ts              ← Discord webhook de gönder
```

---

## Güvenlik Notu

- Webhook URL'ler DB'de plaintext tutulmamalı.
- `DISCORD_ENCRYPTION_KEY` env var'ı: 32-byte random hex.
- AES-256-CBC ile encrypt/decrypt.
- `.env.example`'a ekle.

---

## Tier Gating

- **Free:** Sadece rank atlama bildirimi, günde max 3 webhook
- **Pro:** Tüm bildirimler, sınırsız

---

## Test Plan

```typescript
describe('webhookService', () => {
  it('geçerli webhook URL → 204 response bekleniyor (mock HTTP)')
  it('geçersiz URL → hata fırlatıyor, kullanıcıya gösteriliyor')
  it('şifreleme/şifre çözme round-trip çalışıyor')
})
```

---

## Dependencies

- Inngest ✅
- `crypto` (Node.js built-in)
- Discord Webhook API (dış servis — test ortamında mock et)

---

## Definition of Done

- Webhook URL kaydediliyor ve şifreleniyor
- Test butonu Discord kanalına mesaj gönderiyor
- Rank atlama otomatik bildirim çalışıyor
- Ayarlar sayfası responsive
- `docs/DATABASE_SCHEMA.md` güncellendi
- `.env.example` güncellendi
