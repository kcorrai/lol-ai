# TASK-071 â€” Champion Mastery Score: Hesaplama Motoru + DB Migration

**Phase:** 2 â€” AI Depth & Retention  
**Status:** Done  
**Estimated Effort:** 2.5 days  
**Priority:** P0

---

## Objective

Riot'un kuru mastery sistemi yerine gerÃ§ek oyun performansÄ±na dayalÄ±, 6 boyutlu
bir "Mastery Score" (0-100) sistemi yaz. Skor `champion_stats` ve
`match_participants` verisinden hesaplanÄ±r. Riot mastery puanÄ± hiÃ§ kullanÄ±lmaz.

---

## User Story

> "Ahri'de 200.000 mastery puanÄ±m var ama hala Silver'dayÄ±m. Bu puan benim iyi
> olduÄŸumu sÃ¶ylemiyor. GerÃ§ekten bu ÅŸampiyonda ne kadar iyiyim?"

---

## Acceptance Criteria

- [ ] 6 boyut hesaplanÄ±yor: Laning, Vision, Teamfight, Objective Control, Consistency, Carry Potential
- [ ] Her boyut 0-100 arasÄ± normalize ediliyor
- [ ] Toplam skor aÄŸÄ±rlÄ±klÄ± ortalama (aÅŸaÄŸÄ±da aÄŸÄ±rlÄ±klar)
- [ ] `champion_stats` tablosuna `masteryScore` ve `masterySubScores` alanlarÄ± eklendi
- [ ] Skor, `championStatsService` ile birlikte hesaplanÄ±p DB'ye yazÄ±lÄ±yor
- [ ] `GET /api/champions/[championId]/mastery` endpoint'i Ã§alÄ±ÅŸÄ±yor
- [ ] GeÃ§miÅŸ trend: son 4 haftalÄ±k snapshot (haftalÄ±k yeniden hesapla)
- [ ] Minimum 5 maÃ§ ÅŸartÄ± (istatistiksel gÃ¼venilirlik)
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### DB Migration

```prisma
// prisma/schema.prisma â€” ChampionStat modeline ekle
model ChampionStat {
  // ... mevcut alanlar ...
  masteryScore      Int?      // 0-100 composite score
  masteryScoreAt    DateTime? // son hesaplanma zamanÄ±
  masterySubScores  Json?     // { laning, vision, teamfight, objectiveCtrl, consistency, carry }
}
```

Migration dosyasÄ±: `prisma/migrations/YYYYMMDD_add_mastery_score/migration.sql`

### Skor Hesaplama Servisi

**Dosya:** `src/domains/champions/services/masteryScoreService.ts`

```typescript
export interface MasterySubScores {
  laning: number; // CS/min normalize (aÄŸÄ±rlÄ±k: 0.20)
  vision: number; // vision score normalize (aÄŸÄ±rlÄ±k: 0.15)
  teamfight: number; // damage share + CC (aÄŸÄ±rlÄ±k: 0.20)
  objectiveCtrl: number; // objective participation (aÄŸÄ±rlÄ±k: 0.15)
  consistency: number; // KDA variance (aÄŸÄ±rlÄ±k: 0.15)
  carry: number; // KDA + damage share (aÄŸÄ±rlÄ±k: 0.15)
}

export interface ChampionMasteryScore {
  championId: number;
  championName: string;
  total: number; // 0-100
  subScores: MasterySubScores;
  tier: MasteryTier; // Apprentice | Adept | Expert | Master | Legend
  gamesAnalyzed: number;
  computedAt: string;
  trend: number[]; // son 4 haftalÄ±k skor (haftalÄ±k hesaplanmÄ±ÅŸ)
}

type MasteryTier = "Apprentice" | "Adept" | "Expert" | "Master" | "Legend";
```

### Normalize Fonksiyonu

```typescript
// DeÄŸeri [min, max] aralÄ±ÄŸÄ±ndan [0, 100]'e normalize et, sÄ±nÄ±rla
function normalize(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max((value - min) / (max - min), 0), 1) * 100);
}
```

### Boyut Referans DeÄŸerleri (rank bazlÄ± deÄŸil â€” genel LoL ortalamalarÄ±na gÃ¶re)

| Boyut           | Min           | Max | Kaynak                      |
| --------------- | ------------- | --- | --------------------------- |
| Laning (CS/min) | 3.0           | 9.0 | `avgCsPerMinute`            |
| Vision          | 8             | 45  | `avgVisionScore`            |
| Teamfight       | hesaplanmÄ±ÅŸ | â€” | damage share + CC/min       |
| Objective Ctrl  | hesaplanmÄ±ÅŸ | â€” | turrets + objectives stolen |
| Consistency     | hesaplanmÄ±ÅŸ | â€” | KDA std deviation (inverse) |
| Carry           | 1.0           | 6.0 | `avgKda`                    |

### Teamfight Skoru

```typescript
// Son N maÃ§ta damage_dealt / takÄ±m toplam damage
// CC contribution: totalTimeCCDealt / gameDuration (normalize)
function computeTeamfightScore(matches: MatchParticipant[]): number {
  // match_participants'tan son 20 ranked maÃ§ Ã§ek
  // damage share ortalamasÄ± (0-30% range â†’ normalize)
  // CC/min ortalamasÄ± ekle
}
```

### Consistency Skoru

```typescript
// KDA standart sapmasÄ± (dÃ¼ÅŸÃ¼k = daha tutarlÄ± = daha yÃ¼ksek skor)
function computeConsistency(kdaValues: number[]): number {
  const mean = kdaValues.reduce((a, b) => a + b) / kdaValues.length;
  const variance = kdaValues.reduce((s, v) => s + (v - mean) ** 2, 0) / kdaValues.length;
  const stdDev = Math.sqrt(variance);
  // stdDev 0-3 aralÄ±ÄŸÄ± â†’ reverse normalize â†’ 0-100
  return normalize(3 - stdDev, 0, 3);
}
```

### Mastery Tier EÅŸiÄŸi

| Skor     | Tier       |
| -------- | ---------- |
| 0â€“39   | Apprentice |
| 40â€“54  | Adept      |
| 55â€“69  | Expert     |
| 70â€“84  | Master     |
| 85â€“100 | Legend     |

### Endpoint

```
GET /api/champions/[championId]/mastery?riotAccountId=<uuid>

Response 200: ChampionMasteryScore
Response 422: { error: "insufficient_data", minGames: 5, currentGames: N }
```

### HaftalÄ±k Yeniden Hesaplama

`championStatsService.ts`'teki mevcut compute fonksiyonuna mastery hesabÄ± ekle.
Match sync tamamlandÄ±ÄŸÄ±nda otomatik Ã§aÄŸrÄ±lÄ±r.

---

## Files

```
prisma/schema.prisma                                           â† masteryScore, masterySubScores ekle
prisma/migrations/YYYYMMDD_add_mastery_score/migration.sql    â† YENÄ°
src/domains/champions/services/masteryScoreService.ts         â† YENÄ°
src/domains/champions/services/championStatsService.ts        â† compute Ã§aÄŸrÄ±sÄ±na mastery ekle
src/domains/champions/types/champion.types.ts                 â† MasteryScore tipler
src/domains/champions/index.ts                                â† export ekle
app/api/champions/[championId]/mastery/route.ts               â† YENÄ°
src/hooks/useChampionMastery.ts                               â† YENÄ° (TanStack Query)
```

---

## Tier Gating

- **Free:** Toplam mastery skoru (0-100) gÃ¶rÃ¼r, tier rozeti gÃ¶rÃ¼r
- **Pro:** 6 boyut alt skorlarÄ± + trend grafiÄŸi
- **Elite:** AI tavsiyesi "En Ã§ok hangi boyuta odaklanmalÄ±sÄ±n"

---

## Test Plan

```typescript
describe("masteryScoreService", () => {
  it("normalize: sÄ±nÄ±r deÄŸerler 0 ve 100 dÃ¶ner");
  it("normalize: orta deÄŸer ~50 dÃ¶ner");
  it("consistency: dÃ¼ÅŸÃ¼k std dev = yÃ¼ksek skor");
  it("tier: 74 â†’ Expert");
  it("tier: 85 â†’ Legend");
  it("5 maÃ§ altÄ±nda hata fÄ±rlatÄ±r");
  it("toplam skor aÄŸÄ±rlÄ±klÄ± ortalama ile eÅŸleÅŸiyor");
});
```

---

## Dependencies

- TASK-004 (match sync) âœ…
- Prisma migration Ã§alÄ±ÅŸtÄ±rÄ±lmalÄ±: `npx prisma migrate dev`

---

## Definition of Done

- Migration production'da Ã§alÄ±ÅŸÄ±yor
- Skor formÃ¼lÃ¼ dokÃ¼mante edildi (bu dosya yeterli)
- Endpoint Postman'da test edildi
- Unit test coverage â‰¥ 85%
- `docs/DATABASE_SCHEMA.md` gÃ¼ncellendi
