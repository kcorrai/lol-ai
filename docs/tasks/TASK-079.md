# TASK-079 â€” GÃ¶rsel Matchup Matrisi (Champion Pool)

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

Champion pool sayfasÄ±na kullanÄ±cÄ±nÄ±n hangi ÅŸampiyonla kime karÅŸÄ± iyi/kÃ¶tÃ¼ oynadÄ±ÄŸÄ±nÄ±
gÃ¶steren interaktif bir Ä±sÄ± haritasÄ± matrisi ekle. Her hÃ¼cre: o matchup'taki win rate.
HÃ¼creye tÄ±klanÄ±nca AI matchup rehberi aÃ§Ä±lÄ±r. "Global ortalama vs senin oranÄ±n" toggle'Ä±.

---

## User Story

> "Ahri oynuyorum ama Zed karÅŸÄ±sÄ±nda sÃ¼rekli kaybediyorum. Hangi matchup'larda
> gÃ¼Ã§lÃ¼yÃ¼m hangilerinde zayÄ±fÄ±m tek bakÄ±ÅŸta gÃ¶rmek istiyorum."

---

## Acceptance Criteria

- [ ] Champion pool sayfasÄ±nda "Matchup Matrisi" sekmesi var
- [ ] SatÄ±r: kullanÄ±cÄ±nÄ±n oynadÄ±ÄŸÄ± ÅŸampiyonlar (min 3 maÃ§)
- [ ] SÃ¼tun: karÅŸÄ±laÅŸÄ±lan dÃ¼ÅŸman ÅŸampiyonlar (mid lane iÃ§in lane karÅŸÄ±sÄ±ndaki)
- [ ] HÃ¼creler: WR yÃ¼zdesi, renk kodlu (kÄ±rmÄ±zÄ± < %45, sarÄ± %45-55, yeÅŸil > %55)
- [ ] Min sample size: hÃ¼cre baÅŸÄ±na 3 maÃ§ â€” altÄ±ndaysa gri "?" gÃ¶ster
- [ ] Hover: maÃ§ sayÄ±sÄ± ve KDA tooltip
- [ ] TÄ±klama: AI matchup rehberi side panel/modal aÃ§Ä±lÄ±r
- [ ] "Global Ortalama vs Benim" toggle â€” global DDragon/op.gg verisi yoksa sadece kiÅŸisel
- [ ] Filtre: lane seÃ§imi (Mid, Top, Jungle, ADC, Support)
- [ ] Mobile: yatay scroll ile gÃ¶rÃ¼nÃ¼r
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Veri KaynaÄŸÄ±

`match_participants` tablosundan tÃ¼retilecek. Mevcut match verisi:

- `championName` â€” kullanÄ±cÄ±nÄ±n ÅŸampiyonu
- `matchId` â€” aynÄ± maÃ§taki rakip ÅŸampiyon iÃ§in join lazÄ±m

Rakip ÅŸampiyonu bulmak iÃ§in aynÄ± maÃ§taki karÅŸÄ± lane oyuncusunu bul:

```typescript
// Basit yaklaÅŸÄ±m: aynÄ± maÃ§, farklÄ± team, aynÄ± individualPosition
const opponents = await prisma.matchParticipant.findMany({
  where: {
    matchId: { in: userMatchIds },
    teamId: { not: userTeamId },
    individualPosition: userPosition,
  },
});
```

### Matchup Servisi

```typescript
// src/domains/analysis/services/matchupService.ts

export interface MatchupCell {
  playerChampion: string;
  opponentChampion: string;
  wins: number;
  losses: number;
  winRate: number; // 0-100
  avgKda: number;
  gamesPlayed: number;
}

export interface MatchupMatrix {
  playerChampions: string[]; // satÄ±rlar
  opponentChampions: string[]; // sÃ¼tunlar
  cells: MatchupCell[];
  generatedAt: string;
}

export async function buildMatchupMatrix(
  riotAccountId: string,
  position?: string
): Promise<MatchupMatrix>;
```

Sonucu 6 saat cache'le (Redis):

- Key: `matchup:{riotAccountId}:{position}`

### AI Matchup Rehberi

HÃ¼creye tÄ±klanÄ±nca:

```typescript
// app/api/analysis/matchup-guide/route.ts
// POST { playerChampion, opponentChampion, userStats: MatchupCell }
// AI: TÃ¼rkÃ§e, 3-4 bullet point matchup rehberi
// Cache: 7 gÃ¼n (aynÄ± matchup iÃ§in)
```

AI Prompt:

```
Oyuncu {playerChampion} ile {opponentChampion} karÅŸÄ±sÄ±nda {wins}W/{losses}L oynuyor.
KDA ortalamasÄ± {kda}. TÃ¼rkÃ§e, 4 bullet point matchup rehberi yaz:
- En iyi level 1-3 stratejisi
- KaÃ§Ä±nÄ±lmasÄ± gereken 1 hata
- En iyi gank zamanÄ± (eÄŸer varsa)
- GeÃ§ oyun Ã¶nceliÄŸi
```

### Frontend: Matchup Matrix Component

```typescript
// src/domains/champions/components/MatchupMatrix.tsx

// Virtualized grid â€” Ã§ok fazla ÅŸampiyon olabilir
// react-table veya custom CSS grid
// Renk: tailwind bg-red-500/bg-yellow-500/bg-green-500 opacity ile
```

```
     | Zed  | Fizz | Syndra | Viktor | Yone |
Ahri | 58%  |  44% |   61%  |  52%   | 38%  |
     | 7G   |  5G  |   9G   |  4G    | 3G   |
Vic  | 71%  |  55% |   48%  |   -    | 67%  |
```

Renk skalasÄ±:

- â‰¥ 60%: `bg-green-500/70`
- 50-59%: `bg-green-300/50`
- 45-49%: `bg-yellow-400/50`
- 40-44%: `bg-red-400/50`
- < 40%: `bg-red-600/70`
- < 3 maÃ§: `bg-gray-700` + "?"

### Matchup Guide Side Panel

```typescript
// src/domains/champions/components/MatchupGuidePanel.tsx
// Sheet component (shadcn/ui) â€” saÄŸdan kayar
// YÃ¼klenirken skeleton
// Ä°Ã§erik: bullet list + "Bu rehberi kaydet" butonu (pro feature)
```

---

## Files

```
src/domains/analysis/services/matchupService.ts              â† YENÄ°
app/api/analysis/matchup-matrix/route.ts                     â† GET matrix
app/api/analysis/matchup-guide/route.ts                      â† POST AI guide
src/domains/champions/components/MatchupMatrix.tsx            â† YENÄ° (max 200 satÄ±r)
src/domains/champions/components/MatchupMatrixCell.tsx        â† YENÄ°
src/domains/champions/components/MatchupGuidePanel.tsx        â† YENÄ°
src/hooks/useMatchupMatrix.ts                                 â† YENÄ° TanStack Query
src/hooks/useMatchupGuide.ts                                  â† YENÄ° TanStack Query
app/(app)/champions/page.tsx                                  â† "Matchup Matrisi" sekmesi
```

---

## Tier Gating

- **Free:** Sadece en Ã§ok oynanan 3 ÅŸampiyon, AI guide kilitli
- **Pro:** TÃ¼m matris + AI matchup rehberleri
- **Elite:** Global ortalama karÅŸÄ±laÅŸtÄ±rmasÄ± (ileride)

---

## Test Plan

```typescript
describe("matchupService", () => {
  it("buildMatchupMatrix: 3+ maÃ§ olan hÃ¼creler doÄŸru WR hesaplÄ±yor");
  it("3 maÃ§tan az â†’ gamesPlayed < 3 flagleniyor");
  it("farklÄ± position iÃ§in filtre Ã§alÄ±ÅŸÄ±yor");
  it("aynÄ± riotAccountId â†’ Redis cache hit ikinci Ã§aÄŸrÄ±da");
});
```

---

## Dependencies

- `match_participants` tablosu âœ…
- Redis (Upstash) âœ…
- `src/lib/ai/` âœ…

---

## Definition of Done

- Matris champion pool sayfasÄ±nda gÃ¶rÃ¼nÃ¼yor
- Renk kodlama doÄŸru Ã§alÄ±ÅŸÄ±yor
- AI matchup guide panel aÃ§Ä±lÄ±yor
- Mobile yatay scroll Ã§alÄ±ÅŸÄ±yor
- Unit test coverage â‰¥ 80%
- `docs/API_DESIGN.md` gÃ¼ncellendi
