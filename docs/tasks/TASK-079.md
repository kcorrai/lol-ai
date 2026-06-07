# TASK-079 — Görsel Matchup Matrisi (Champion Pool)

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2 days  
**Priority:** P1

---

## Objective

Champion pool sayfasına kullanıcının hangi şampiyonla kime karşı iyi/kötü oynadığını
gösteren interaktif bir ısı haritası matrisi ekle. Her hücre: o matchup'taki win rate.
Hücreye tıklanınca AI matchup rehberi açılır. "Global ortalama vs senin oranın" toggle'ı.

---

## User Story

> "Ahri oynuyorum ama Zed karşısında sürekli kaybediyorum. Hangi matchup'larda
> güçlüyüm hangilerinde zayıfım tek bakışta görmek istiyorum."

---

## Acceptance Criteria

- [ ] Champion pool sayfasında "Matchup Matrisi" sekmesi var
- [ ] Satır: kullanıcının oynadığı şampiyonlar (min 3 maç)
- [ ] Sütun: karşılaşılan düşman şampiyonlar (mid lane için lane karşısındaki)
- [ ] Hücreler: WR yüzdesi, renk kodlu (kırmızı < %45, sarı %45-55, yeşil > %55)
- [ ] Min sample size: hücre başına 3 maç — altındaysa gri "?" göster
- [ ] Hover: maç sayısı ve KDA tooltip
- [ ] Tıklama: AI matchup rehberi side panel/modal açılır
- [ ] "Global Ortalama vs Benim" toggle — global DDragon/op.gg verisi yoksa sadece kişisel
- [ ] Filtre: lane seçimi (Mid, Top, Jungle, ADC, Support)
- [ ] Mobile: yatay scroll ile görünür
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Veri Kaynağı

`match_participants` tablosundan türetilecek. Mevcut match verisi:
- `championName` — kullanıcının şampiyonu
- `matchId` — aynı maçtaki rakip şampiyon için join lazım

Rakip şampiyonu bulmak için aynı maçtaki karşı lane oyuncusunu bul:
```typescript
// Basit yaklaşım: aynı maç, farklı team, aynı individualPosition
const opponents = await prisma.matchParticipant.findMany({
  where: {
    matchId: { in: userMatchIds },
    teamId: { not: userTeamId },
    individualPosition: userPosition
  }
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
  winRate: number;        // 0-100
  avgKda: number;
  gamesPlayed: number;
}

export interface MatchupMatrix {
  playerChampions: string[];  // satırlar
  opponentChampions: string[]; // sütunlar
  cells: MatchupCell[];
  generatedAt: string;
}

export async function buildMatchupMatrix(
  riotAccountId: string,
  position?: string
): Promise<MatchupMatrix>
```

Sonucu 6 saat cache'le (Redis):
- Key: `matchup:{riotAccountId}:{position}`

### AI Matchup Rehberi

Hücreye tıklanınca:
```typescript
// app/api/analysis/matchup-guide/route.ts
// POST { playerChampion, opponentChampion, userStats: MatchupCell }
// AI: Türkçe, 3-4 bullet point matchup rehberi
// Cache: 7 gün (aynı matchup için)
```

AI Prompt:
```
Oyuncu {playerChampion} ile {opponentChampion} karşısında {wins}W/{losses}L oynuyor.
KDA ortalaması {kda}. Türkçe, 4 bullet point matchup rehberi yaz:
- En iyi level 1-3 stratejisi
- Kaçınılması gereken 1 hata
- En iyi gank zamanı (eğer varsa)
- Geç oyun önceliği
```

### Frontend: Matchup Matrix Component

```typescript
// src/domains/champions/components/MatchupMatrix.tsx

// Virtualized grid — çok fazla şampiyon olabilir
// react-table veya custom CSS grid
// Renk: tailwind bg-red-500/bg-yellow-500/bg-green-500 opacity ile
```

```
     | Zed  | Fizz | Syndra | Viktor | Yone |
Ahri | 58%  |  44% |   61%  |  52%   | 38%  |
     | 7G   |  5G  |   9G   |  4G    | 3G   |
Vic  | 71%  |  55% |   48%  |   -    | 67%  |
```

Renk skalası:
- ≥ 60%: `bg-green-500/70`
- 50-59%: `bg-green-300/50`
- 45-49%: `bg-yellow-400/50`
- 40-44%: `bg-red-400/50`
- < 40%: `bg-red-600/70`
- < 3 maç: `bg-gray-700` + "?"

### Matchup Guide Side Panel

```typescript
// src/domains/champions/components/MatchupGuidePanel.tsx
// Sheet component (shadcn/ui) — sağdan kayar
// Yüklenirken skeleton
// İçerik: bullet list + "Bu rehberi kaydet" butonu (pro feature)
```

---

## Files

```
src/domains/analysis/services/matchupService.ts              ← YENİ
app/api/analysis/matchup-matrix/route.ts                     ← GET matrix
app/api/analysis/matchup-guide/route.ts                      ← POST AI guide
src/domains/champions/components/MatchupMatrix.tsx            ← YENİ (max 200 satır)
src/domains/champions/components/MatchupMatrixCell.tsx        ← YENİ
src/domains/champions/components/MatchupGuidePanel.tsx        ← YENİ
src/hooks/useMatchupMatrix.ts                                 ← YENİ TanStack Query
src/hooks/useMatchupGuide.ts                                  ← YENİ TanStack Query
app/(app)/champions/page.tsx                                  ← "Matchup Matrisi" sekmesi
```

---

## Tier Gating

- **Free:** Sadece en çok oynanan 3 şampiyon, AI guide kilitli
- **Pro:** Tüm matris + AI matchup rehberleri
- **Elite:** Global ortalama karşılaştırması (ileride)

---

## Test Plan

```typescript
describe('matchupService', () => {
  it('buildMatchupMatrix: 3+ maç olan hücreler doğru WR hesaplıyor')
  it('3 maçtan az → gamesPlayed < 3 flagleniyor')
  it('farklı position için filtre çalışıyor')
  it('aynı riotAccountId → Redis cache hit ikinci çağrıda')
})
```

---

## Dependencies

- `match_participants` tablosu ✅
- Redis (Upstash) ✅
- `src/lib/ai/` ✅

---

## Definition of Done

- Matris champion pool sayfasında görünüyor
- Renk kodlama doğru çalışıyor
- AI matchup guide panel açılıyor
- Mobile yatay scroll çalışıyor
- Unit test coverage ≥ 80%
- `docs/API_DESIGN.md` güncellendi
