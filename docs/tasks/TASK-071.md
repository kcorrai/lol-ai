# TASK-071 — Champion Mastery Score: Hesaplama Motoru + DB Migration

**Phase:** 2 — AI Depth & Retention  
**Status:** Pending  
**Estimated Effort:** 2.5 days  
**Priority:** P0

---

## Objective

Riot'un kuru mastery sistemi yerine gerçek oyun performansına dayalı, 6 boyutlu
bir "Mastery Score" (0-100) sistemi yaz. Skor `champion_stats` ve
`match_participants` verisinden hesaplanır. Riot mastery puanı hiç kullanılmaz.

---

## User Story

> "Ahri'de 200.000 mastery puanım var ama hala Silver'dayım. Bu puan benim iyi
> olduğumu söylemiyor. Gerçekten bu şampiyonda ne kadar iyiyim?"

---

## Acceptance Criteria

- [ ] 6 boyut hesaplanıyor: Laning, Vision, Teamfight, Objective Control, Consistency, Carry Potential
- [ ] Her boyut 0-100 arası normalize ediliyor
- [ ] Toplam skor ağırlıklı ortalama (aşağıda ağırlıklar)
- [ ] `champion_stats` tablosuna `masteryScore` ve `masterySubScores` alanları eklendi
- [ ] Skor, `championStatsService` ile birlikte hesaplanıp DB'ye yazılıyor
- [ ] `GET /api/champions/[championId]/mastery` endpoint'i çalışıyor
- [ ] Geçmiş trend: son 4 haftalık snapshot (haftalık yeniden hesapla)
- [ ] Minimum 5 maç şartı (istatistiksel güvenilirlik)
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### DB Migration

```prisma
// prisma/schema.prisma — ChampionStat modeline ekle
model ChampionStat {
  // ... mevcut alanlar ...
  masteryScore      Int?      // 0-100 composite score
  masteryScoreAt    DateTime? // son hesaplanma zamanı
  masterySubScores  Json?     // { laning, vision, teamfight, objectiveCtrl, consistency, carry }
}
```

Migration dosyası: `prisma/migrations/YYYYMMDD_add_mastery_score/migration.sql`

### Skor Hesaplama Servisi

**Dosya:** `src/domains/champions/services/masteryScoreService.ts`

```typescript
export interface MasterySubScores {
  laning: number;          // CS/min normalize (ağırlık: 0.20)
  vision: number;          // vision score normalize (ağırlık: 0.15)
  teamfight: number;       // damage share + CC (ağırlık: 0.20)
  objectiveCtrl: number;   // objective participation (ağırlık: 0.15)
  consistency: number;     // KDA variance (ağırlık: 0.15)
  carry: number;           // KDA + damage share (ağırlık: 0.15)
}

export interface ChampionMasteryScore {
  championId: number;
  championName: string;
  total: number;           // 0-100
  subScores: MasterySubScores;
  tier: MasteryTier;       // Apprentice | Adept | Expert | Master | Legend
  gamesAnalyzed: number;
  computedAt: string;
  trend: number[];         // son 4 haftalık skor (haftalık hesaplanmış)
}

type MasteryTier = 'Apprentice' | 'Adept' | 'Expert' | 'Master' | 'Legend';
```

### Normalize Fonksiyonu

```typescript
// Değeri [min, max] aralığından [0, 100]'e normalize et, sınırla
function normalize(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max((value - min) / (max - min), 0), 1) * 100);
}
```

### Boyut Referans Değerleri (rank bazlı değil — genel LoL ortalamalarına göre)

| Boyut | Min | Max | Kaynak |
|---|---|---|---|
| Laning (CS/min) | 3.0 | 9.0 | `avgCsPerMinute` |
| Vision | 8 | 45 | `avgVisionScore` |
| Teamfight | hesaplanmış | — | damage share + CC/min |
| Objective Ctrl | hesaplanmış | — | turrets + objectives stolen |
| Consistency | hesaplanmış | — | KDA std deviation (inverse) |
| Carry | 1.0 | 6.0 | `avgKda` |

### Teamfight Skoru

```typescript
// Son N maçta damage_dealt / takım toplam damage
// CC contribution: totalTimeCCDealt / gameDuration (normalize)
function computeTeamfightScore(matches: MatchParticipant[]): number {
  // match_participants'tan son 20 ranked maç çek
  // damage share ortalaması (0-30% range → normalize)
  // CC/min ortalaması ekle
}
```

### Consistency Skoru

```typescript
// KDA standart sapması (düşük = daha tutarlı = daha yüksek skor)
function computeConsistency(kdaValues: number[]): number {
  const mean = kdaValues.reduce((a, b) => a + b) / kdaValues.length;
  const variance = kdaValues.reduce((s, v) => s + (v - mean) ** 2, 0) / kdaValues.length;
  const stdDev = Math.sqrt(variance);
  // stdDev 0-3 aralığı → reverse normalize → 0-100
  return normalize(3 - stdDev, 0, 3);
}
```

### Mastery Tier Eşiği

| Skor | Tier |
|---|---|
| 0–39 | Apprentice |
| 40–54 | Adept |
| 55–69 | Expert |
| 70–84 | Master |
| 85–100 | Legend |

### Endpoint

```
GET /api/champions/[championId]/mastery?riotAccountId=<uuid>

Response 200: ChampionMasteryScore
Response 422: { error: "insufficient_data", minGames: 5, currentGames: N }
```

### Haftalık Yeniden Hesaplama

`championStatsService.ts`'teki mevcut compute fonksiyonuna mastery hesabı ekle.
Match sync tamamlandığında otomatik çağrılır.

---

## Files

```
prisma/schema.prisma                                           ← masteryScore, masterySubScores ekle
prisma/migrations/YYYYMMDD_add_mastery_score/migration.sql    ← YENİ
src/domains/champions/services/masteryScoreService.ts         ← YENİ
src/domains/champions/services/championStatsService.ts        ← compute çağrısına mastery ekle
src/domains/champions/types/champion.types.ts                 ← MasteryScore tipler
src/domains/champions/index.ts                                ← export ekle
app/api/champions/[championId]/mastery/route.ts               ← YENİ
src/hooks/useChampionMastery.ts                               ← YENİ (TanStack Query)
```

---

## Tier Gating

- **Free:** Toplam mastery skoru (0-100) görür, tier rozeti görür
- **Pro:** 6 boyut alt skorları + trend grafiği
- **Elite:** AI tavsiyesi "En çok hangi boyuta odaklanmalısın"

---

## Test Plan

```typescript
describe('masteryScoreService', () => {
  it('normalize: sınır değerler 0 ve 100 döner')
  it('normalize: orta değer ~50 döner')
  it('consistency: düşük std dev = yüksek skor')
  it('tier: 74 → Expert')
  it('tier: 85 → Legend')
  it('5 maç altında hata fırlatır')
  it('toplam skor ağırlıklı ortalama ile eşleşiyor')
})
```

---

## Dependencies

- TASK-004 (match sync) ✅
- Prisma migration çalıştırılmalı: `npx prisma migrate dev`

---

## Definition of Done

- Migration production'da çalışıyor
- Skor formülü dokümante edildi (bu dosya yeterli)
- Endpoint Postman'da test edildi
- Unit test coverage ≥ 85%
- `docs/DATABASE_SCHEMA.md` güncellendi
