# TASK-070 — Matchup Intelligence: Kişisel Matchup İstatistikleri

**Phase:** 2 — AI Depth & Retention  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P0

---

## Objective

`personalCounterService.ts` şu an boş (`export {}`). Oyuncunun kendi maç geçmişine
dayanarak şampiyona özel matchup win rate'leri, ban önerileri ve trend analizi
döndüren servisi ve API endpoint'i yaz.

---

## User Story

> "Ahri oynarken Yasuo'ya karşı %61 WR'ım var ama Malzahar'a karşı sadece %22.
> Ban kararımı bu veriye göre vermek istiyorum."

---

## Acceptance Criteria

- [ ] `personalCounterService.ts` en az 3 maç oynanan her matchup için win rate hesaplıyor
- [ ] Aynı lane'deki rakip şampiyon doğru tespit ediliyor (position eşleştirme)
- [ ] `GET /api/champions/[championId]/matchups` endpoint'i çalışıyor
- [ ] Yanıt: `best[]`, `worst[]`, `banSuggestion`, `totalMatchups` içeriyor
- [ ] Minimum 3 maç filtresi uygulanıyor (istatistiksel güvenilirlik)
- [ ] Redis cache: 1 saat TTL
- [ ] Boş durum: yetersiz maç varsa açıklayıcı mesaj
- [ ] TypeScript strict — no `any`
- [ ] Unit test: hesaplama mantığı

---

## Technical Approach

### Servis: `src/domains/counter/services/personalCounterService.ts`

```typescript
export interface MatchupEntry {
  opponentChampionId: number;
  opponentChampionName: string;
  games: number;
  wins: number;
  winRate: number;       // 0-100
  avgKda: number;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
}

export interface PersonalMatchupReport {
  championId: number;
  championName: string;
  best: MatchupEntry[];    // top 5, WR desc
  worst: MatchupEntry[];   // bottom 5, WR asc
  banSuggestion: MatchupEntry | null;  // worst WR ile en çok oynanan
  totalMatchupsAnalyzed: number;
}

export async function getPersonalMatchups(
  riotAccountId: string,
  championId: number,
  minGames = 3
): Promise<PersonalMatchupReport>
```

### Sorgu Mantığı

```sql
-- Oyuncunun bu şampiyonla oynadığı maçlarda karşı lane'deki rakibi bul
SELECT
  opp.champion_id         AS opponent_champion_id,
  opp.champion_name       AS opponent_champion_name,
  COUNT(*)                AS games,
  SUM(CASE WHEN mp.won THEN 1 ELSE 0 END) AS wins,
  AVG((mp.kills + mp.assists)::float / GREATEST(mp.deaths, 1)) AS avg_kda
FROM match_participants mp
JOIN match_participants opp
  ON opp.match_id     = mp.match_id
 AND opp.team_id     != mp.team_id
 AND opp.position    = mp.position
WHERE mp.riot_account_id = $riotAccountId
  AND mp.champion_id     = $championId
GROUP BY opp.champion_id, opp.champion_name
HAVING COUNT(*) >= $minGames
ORDER BY wins::float / COUNT(*) DESC
```

> Prisma `$queryRaw` ile yaz. CLAUDE.md: raw query gerekçesi = Prisma fluent API
> self-join + same-position filtresini tek sorguda ifade edemiyor.

### Trend Hesabı

Son 5 maç WR vs önceki 5 maç WR karşılaştır:
- `>= +15%` → `improving`
- `<= -15%` → `declining`
- Diğer → `stable`
- `< 5 maç` → `insufficient_data`

### Endpoint: `app/api/champions/[championId]/matchups/route.ts`

```
GET /api/champions/[championId]/matchups?riotAccountId=<uuid>
Authorization: session required

Response 200:
{
  "championId": 103,
  "championName": "Ahri",
  "best": [ MatchupEntry[], max 5 ],
  "worst": [ MatchupEntry[], max 5 ],
  "banSuggestion": MatchupEntry | null,
  "totalMatchupsAnalyzed": 12
}

Response 404: Riot account not found
Response 422: Not enough data (< 3 games on this champion)
```

### Cache

```typescript
const cacheKey = `matchups:${riotAccountId}:${championId}`;
// TTL: 3600s (1 saat)
// Invalidate: yeni maç sync olduğunda
```

---

## Files

```
src/domains/counter/services/personalCounterService.ts   ← YAZ (stub var)
src/domains/counter/types/counter.types.ts               ← MatchupEntry, PersonalMatchupReport ekle
src/domains/counter/index.ts                             ← export ekle
app/api/champions/[championId]/matchups/route.ts         ← YENİ
src/hooks/usePersonalMatchups.ts                         ← YENİ (TanStack Query)
```

---

## Tier Gating

- **Free:** En iyi ve en kötü 3 matchup (top/bottom 3)
- **Pro:** Tüm matchuplar + ban önerisi + trend
- **Elite:** AI açıklaması (mini model, optional prompt)

---

## Test Plan

```typescript
// personalCounterService.test.ts
describe('getPersonalMatchups', () => {
  it('minimum 3 maç filtresini uygular')
  it('win rate doğru hesaplanır')
  it('trend: improving tespit edilir (son 5 > önceki 5)')
  it('banSuggestion: en kötü WR ile en çok oynanan döner')
  it('boş dizi: şampiyon üzerinde hiç maç yoksa 422 döner')
})
```

---

## Dependencies

- TASK-004 (match sync) ✅ — match_participants populated
- TASK-069 (counter UI) ✅ — counter domain yapısı hazır

---

## Definition of Done

- Servis tüm acceptance criteria'yı geçiyor
- Endpoint Postman'da test edildi
- Unit test coverage ≥ 80%
- TypeScript: no `any`, strict geçiyor
- `docs/API_DESIGN.md` güncellendi
