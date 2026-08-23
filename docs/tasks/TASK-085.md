# TASK-085 â€” Discord Entegrasyonu (Bot + Webhook)

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P2

---

## Objective

Ä°ki yÃ¶nlÃ¼ Discord entegrasyonu: kullanÄ±cÄ± Discord hesabÄ±nÄ± baÄŸlayabilsin
ve seÃ§tiÄŸi sunucuya/kanala otomatik bildirimler gÃ¶nderilsin (rank atlama,
rozet kazanma, haftalÄ±k Ã¶zet). Opsiyonel olarak basit bir Discord bot
komutu ekle: `/lolcoach stats` ile kullanÄ±cÄ±nÄ±n Ã¶zetini dÃ¶ndÃ¼rsÃ¼n.

---

## User Story

> "Discord sunucumda arkadaÅŸlarÄ±m var. Rank atladÄ±ÄŸÄ±mda otomatik olarak
> oraya bir mesaj gitse Ã§ok iyi olurdu. AyrÄ±ca /stats yazÄ±nca Ã¶zetimi
> gÃ¶rmek istiyorum."

---

## Acceptance Criteria

- [ ] KullanÄ±cÄ± Discord OAuth2 ile hesabÄ±nÄ± baÄŸlayabiliyor
- [ ] Webhook URL giriÅŸi: kullanÄ±cÄ± kendi Discord kanalÄ±nÄ±n webhook URL'ini giriyor
- [ ] Rank atlama olayÄ±nda webhook'a mesaj gÃ¶nderiliyor (embed formatÄ±nda)
- [ ] Rozet kazanma olayÄ±nda webhook mesajÄ± (opsiyonel, kullanÄ±cÄ± seÃ§iyor)
- [ ] HaftalÄ±k Ã¶zet bildirimi (Pazartesi sabahÄ±)
- [ ] BaÄŸlantÄ± test butonu: "Test GÃ¶nder"
- [ ] Discord hesabÄ± gÃ¼venli saklanÄ±yor (webhook URL encrypted veya hashed)
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### DB Schema

```prisma
model DiscordIntegration {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @unique @db.Uuid
  discordUserId    String?  // OAuth2 ile baÄŸlÄ±ysa
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

Webhook URL ÅŸifreleme: `crypto.createCipheriv` ile AES-256, anahtar env var'dan.

### Webhook GÃ¶nderim Servisi

```typescript
// src/lib/discord/webhookService.ts

export async function sendDiscordWebhook(webhookUrl: string, embed: DiscordEmbed): Promise<void>;

interface DiscordEmbed {
  title: string;
  description: string;
  color: number; // hex renk kodu
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  thumbnail?: { url: string };
}
```

### Rank Atlama MesajÄ±

```typescript
// Rank change event tespit edilince (rankHistory'de tier deÄŸiÅŸimi):
const embed = {
  title: "ğŸ† Rank AtladÄ±!",
  description: `**${gameName}#${tagLine}** yeni ranka ulaÅŸtÄ±!`,
  color: 0xffd700, // altÄ±n
  fields: [
    { name: "Ã–nceki Rank", value: "Gold II", inline: true },
    { name: "Yeni Rank", value: "Platinum IV", inline: true },
  ],
  footer: { text: "lolaicoach.com Â· AI destekli LoL koÃ§luÄŸu" },
};
```

### Rozet Kazanma MesajÄ±

```typescript
const embed = {
  title: `ğŸ–ï¸ Yeni Rozet: ${achievement.name}`,
  description: achievement.description,
  color: TIER_COLORS[achievement.tier], // bronz/gÃ¼mÃ¼ÅŸ/altÄ±n/platin
  thumbnail: { url: `https://lolaicoach.com/achievements/${achievement.iconSlug}` },
};
```

### HaftalÄ±k Ã–zet MesajÄ±

Pazartesi Inngest cron'u (mevcut haftalÄ±k email ile aynÄ± anda):

```typescript
// Mevcut weeklyEmailSender.ts ile aynÄ± veriyi kullan
// Email yerine Discord embed olarak gÃ¶nder
```

### Ayarlar SayfasÄ±

```typescript
// app/(app)/settings/discord/page.tsx

BÃ¶lÃ¼mler:
1. Webhook URL giriÅŸi + "Test GÃ¶nder" butonu
2. Bildirim tercihleri (checkbox Ã— 3)
3. BaÄŸlantÄ±yÄ± KaldÄ±r butonu
```

### API

```
GET  /api/settings/discord          â† mevcut baÄŸlantÄ± durumu
POST /api/settings/discord          â† webhook URL kaydet + tercihler
POST /api/settings/discord/test     â† test mesajÄ± gÃ¶nder
DELETE /api/settings/discord        â† baÄŸlantÄ±yÄ± kaldÄ±r
```

---

## Inngest Entegrasyonu

Mevcut event'lere Discord webhook gÃ¶nderimi ekle:

```typescript
// rankChange event handler'Ä±na:
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
prisma/schema.prisma                                    â† DiscordIntegration model
prisma/migrations/YYYYMMDD_add_discord_integration/     â† YENÄ°
src/lib/discord/webhookService.ts                       â† YENÄ°
src/lib/discord/embeds.ts                               â† YENÄ° (embed builder'lar)
src/lib/crypto/encrypt.ts                               â† YENÄ° (webhook URL ÅŸifreleme)
app/(app)/settings/discord/page.tsx                     â† YENÄ°
app/api/settings/discord/route.ts                       â† GET, POST, DELETE
app/api/settings/discord/test/route.ts                  â† POST test mesaj
src/hooks/useDiscordSettings.ts                         â† YENÄ° TanStack Query
src/inngest/functions/achievementChecker.ts             â† Discord entegre et
src/inngest/functions/weeklyEmailSender.ts              â† Discord webhook de gÃ¶nder
```

---

## GÃ¼venlik Notu

- Webhook URL'ler DB'de plaintext tutulmamalÄ±.
- `DISCORD_ENCRYPTION_KEY` env var'Ä±: 32-byte random hex.
- AES-256-CBC ile encrypt/decrypt.
- `.env.example`'a ekle.

---

## Tier Gating

- **Free:** Sadece rank atlama bildirimi, gÃ¼nde max 3 webhook
- **Pro:** TÃ¼m bildirimler, sÄ±nÄ±rsÄ±z

---

## Test Plan

```typescript
describe("webhookService", () => {
  it("geÃ§erli webhook URL â†’ 204 response bekleniyor (mock HTTP)");
  it("geÃ§ersiz URL â†’ hata fÄ±rlatÄ±yor, kullanÄ±cÄ±ya gÃ¶steriliyor");
  it("ÅŸifreleme/ÅŸifre Ã§Ã¶zme round-trip Ã§alÄ±ÅŸÄ±yor");
});
```

---

## Dependencies

- Inngest âœ…
- `crypto` (Node.js built-in)
- Discord Webhook API (dÄ±ÅŸ servis â€” test ortamÄ±nda mock et)

---

## Definition of Done

- Webhook URL kaydediliyor ve ÅŸifreleniyor
- Test butonu Discord kanalÄ±na mesaj gÃ¶nderiyor
- Rank atlama otomatik bildirim Ã§alÄ±ÅŸÄ±yor
- Ayarlar sayfasÄ± responsive
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi
- `.env.example` gÃ¼ncellendi
