# TASK-070 â€” Matchup Intelligence: KiÅŸisel Matchup Ä°statistikleri

**Phase:** 2 â€” AI Depth & Retention  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P0

---

## Objective

`personalCounterService.ts` ÅŸu an boÅŸ (`export {}`). Oyuncunun kendi maÃ§ geÃ§miÅŸine
dayanarak ÅŸampiyona Ã¶zel matchup win rate'leri, ban Ã¶nerileri ve trend analizi
dÃ¶ndÃ¼ren servisi ve API endpoint'i yaz.

---

## User Story

> "Ahri oynarken Yasuo'ya karÅŸÄ± %61 WR'Ä±m var ama Malzahar'a karÅŸÄ± sadece %22.
> Ban kararÄ±mÄ± bu veriye gÃ¶re vermek istiyorum."

---

## Acceptance Criteria

- [ ] `personalCounterService.ts` en az 3 maÃ§ oynanan her matchup iÃ§in win rate hesaplÄ±yor
- [ ] AynÄ± lane'deki rakip ÅŸampiyon doÄŸru tespit ediliyor (position eÅŸleÅŸtirme)
- [ ] `GET /api/champions/[championId]/matchups` endpoint'i Ã§alÄ±ÅŸÄ±yor
- [ ] YanÄ±t: `best[]`, `worst[]`, `banSuggestion`, `totalMatchups` iÃ§eriyor
- [ ] Minimum 3 maÃ§ filtresi uygulanÄ±yor (istatistiksel gÃ¼venilirlik)
- [ ] Redis cache: 1 saat TTL
- [ ] BoÅŸ durum: yetersiz maÃ§ varsa aÃ§Ä±klayÄ±cÄ± mesaj
- [ ] TypeScript strict â€” no `any`
- [ ] Unit test: hesaplama mantÄ±ÄŸÄ±

---

## Technical Approach

### Servis: `src/domains/counter/services/personalCounterService.ts`

```typescript
export interface MatchupEntry {
  opponentChampionId: number;
  opponentChampionName: string;
  games: number;
  wins: number;
  winRate: number; // 0-100
  avgKda: number;
  trend: "improving" | "declining" | "stable" | "insufficient_data";
}

export interface PersonalMatchupReport {
  championId: number;
  championName: string;
  best: MatchupEntry[]; // top 5, WR desc
  worst: MatchupEntry[]; // bottom 5, WR asc
  banSuggestion: MatchupEntry | null; // worst WR ile en Ã§ok oynanan
  totalMatchupsAnalyzed: number;
}

export async function getPersonalMatchups(
  riotAccountId: string,
  championId: number,
  minGames = 3
): Promise<PersonalMatchupReport>;
```

### Sorgu MantÄ±ÄŸÄ±

```sql
-- Oyuncunun bu ÅŸampiyonla oynadÄ±ÄŸÄ± maÃ§larda karÅŸÄ± lane'deki rakibi bul
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

> Prisma `$queryRaw` ile yaz. CLAUDE.md: raw query gerekÃ§esi = Prisma fluent API
> self-join + same-position filtresini tek sorguda ifade edemiyor.

### Trend HesabÄ±

Son 5 maÃ§ WR vs Ã¶nceki 5 maÃ§ WR karÅŸÄ±laÅŸtÄ±r:

- `>= +15%` â†’ `improving`
- `<= -15%` â†’ `declining`
- DiÄŸer â†’ `stable`
- `< 5 maÃ§` â†’ `insufficient_data`

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
// Invalidate: yeni maÃ§ sync olduÄŸunda
```

---

## Files

```
src/domains/counter/services/personalCounterService.ts   â† YAZ (stub var)
src/domains/counter/types/counter.types.ts               â† MatchupEntry, PersonalMatchupReport ekle
src/domains/counter/index.ts                             â† export ekle
app/api/champions/[championId]/matchups/route.ts         â† YENÄ°
src/hooks/usePersonalMatchups.ts                         â† YENÄ° (TanStack Query)
```

---

## Tier Gating

- **Free:** En iyi ve en kÃ¶tÃ¼ 3 matchup (top/bottom 3)
- **Pro:** TÃ¼m matchuplar + ban Ã¶nerisi + trend
- **Elite:** AI aÃ§Ä±klamasÄ± (mini model, optional prompt)

---

## Test Plan

```typescript
// personalCounterService.test.ts
describe("getPersonalMatchups", () => {
  it("minimum 3 maÃ§ filtresini uygular");
  it("win rate doÄŸru hesaplanÄ±r");
  it("trend: improving tespit edilir (son 5 > Ã¶nceki 5)");
  it("banSuggestion: en kÃ¶tÃ¼ WR ile en Ã§ok oynanan dÃ¶ner");
  it("boÅŸ dizi: ÅŸampiyon Ã¼zerinde hiÃ§ maÃ§ yoksa 422 dÃ¶ner");
});
```

---

## Dependencies

- TASK-004 (match sync) âœ… â€” match_participants populated
- TASK-069 (counter UI) âœ… â€” counter domain yapÄ±sÄ± hazÄ±r

---

## Definition of Done

- Servis tÃ¼m acceptance criteria'yÄ± geÃ§iyor
- Endpoint Postman'da test edildi
- Unit test coverage â‰¥ 80%
- TypeScript: no `any`, strict geÃ§iyor
- `docs/API_DESIGN.md` gÃ¼ncellendi
