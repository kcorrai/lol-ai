# TASK-084 â€” Draft SimÃ¼latÃ¶rÃ¼ & Win Condition Analyzer

**Phase:** 3 â€” Growth & Conversion  
**Status:** Done  
**Estimated Effort:** 2.5 days  
**Priority:** P2

---

## Objective

KullanÄ±cÄ± iki takÄ±mÄ±n ÅŸampiyonlarÄ±nÄ± manuel seÃ§erek draft simÃ¼le edebilsin.
AI, kompo arketipini (engage/poke/split/teamfight) tespit etsin ve
"senin takÄ±mÄ±n hangi win condition'da kazanÄ±r" yorumunu yapsÄ±n.
MaÃ§ Ã¶ncesi araÃ§ olarak da kullanÄ±labilir.

---

## User Story

> "TakÄ±m arkadaÅŸlarÄ±m seÃ§imlerini yapÄ±yor, ben ne seÃ§sem bilmiyorum.
> Bir yere girip 'onlar Zed + Leona aldÄ±, sen ne almalÄ±sÄ±n' sormak istiyorum."

---

## Acceptance Criteria

- [ ] `/draft` sayfasÄ±nda iki taraf iÃ§in ÅŸampiyon seÃ§imi (5v5)
- [ ] TÃ¼m ÅŸampiyonlar DDragon'dan yÃ¼kleniyor, arama + filtre var
- [ ] AI kompo analizi: arketip tespiti + win condition (TÃ¼rkÃ§e, 4-5 bullet)
- [ ] "Senin iÃ§in en iyi pick" Ã¶nerisi (kendi champion pool'una gÃ¶re, opsiyonel)
- [ ] "Draft'Ä± kaydet" â†’ URL olarak paylaÅŸÄ±labilir (state query string'de)
- [ ] Mobile uyumlu (sÃ¼tun bazlÄ± layout)
- [ ] TypeScript strict â€” no `any`

---

## Technical Approach

### Åampiyon Listesi

DDragon'dan mevcut `championCacheService` kullan:

```typescript
// TÃ¼m ÅŸampiyonlarÄ± client'a ver
GET /api/public/champions
Response: { champions: { id: number; name: string; roles: string[]; iconUrl: string }[] }
```

### Draft State (URL-based)

```typescript
// /draft?blue=Ahri,Viktor,Leona&red=Zed,Thresh,Jinx&pos=mid
// URL state management â€” sayfa yenilenince kaybolmaz, paylaÅŸÄ±labilir
```

React state â†’ URL query string senkronizasyonu.
DB'ye kaydetme yok â€” tamamen client-side state.

### AI Draft Analizi

```typescript
// app/api/draft/analyze/route.ts
// POST { blueTeam: string[], redTeam: string[] }

interface DraftAnalysis {
  blueComp: {
    archetype: string;      // "Engage + Protect"
    strengths: string[];    // ["Teamfight dominance", "Frontline presence"]
    winConditions: string[];
    earlyGame: 'strong' | 'average' | 'weak';
    lateGame: 'strong' | 'average' | 'weak';
  };
  redComp: { ... };         // aynÄ± yapÄ±
  overallAssessment: string; // "Mavi takÄ±m geÃ§ oyun kazanÄ±r, KÄ±rmÄ±zÄ± takÄ±m early baskÄ± yapmalÄ±"
  recommendation: string;    // "Mavi takÄ±m olarak 20. dakikaya kadar savunmacÄ± oyna, baron etrafÄ±nda teamfight ara"
}
```

AI Prompt:

```
Blue team: {champions}.
Red team: {champions}.
Analyze both compositions in Turkish:
1. Blue team archetype and win conditions (2-3 bullet points)
2. Red team archetype and win conditions (2-3 bullet points)
3. Who wins early/mid/late game and why
4. One specific strategic recommendation for blue team
Keep it tactical and actionable.
```

Cache: aynÄ± draft kombinasyonu iÃ§in 24 saat Redis cache.
Key: `draft:{sorted_blue_champions}:{sorted_red_champions}`

### Åampiyon Rol Arketipleri (Local Data)

AI Ã§aÄŸrÄ±sÄ±nÄ± beslemek iÃ§in temel rol verileri:

```typescript
const CHAMPION_ARCHETYPES: Record<string, string> = {
  Ahri: "assassin-mage",
  Viktor: "poke-mage",
  Leona: "engage-support",
  Thresh: "utility-support",
  Zed: "assassin",
  Jinx: "hypercarry-adc",
  // ...
};
```

DDragon'dan Ã§ekilebilir veya static JSON olarak tutulabilir.

### Frontend: Draft Board

```
app/(app)/draft/page.tsx

Layout:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  MAVÄ° TAKIM â”‚   [Analiz Et]    â”‚  KIRMIZI    â”‚
â”‚             â”‚                  â”‚  TAKIM      â”‚
â”‚  [+Pick]    â”‚                  â”‚  [+Pick]    â”‚
â”‚  [+Pick]    â”‚                  â”‚  [+Pick]    â”‚
â”‚  [+Pick]    â”‚                  â”‚  [+Pick]    â”‚
â”‚  [+Pick]    â”‚                  â”‚  [+Pick]    â”‚
â”‚  [+Pick]    â”‚                  â”‚  [+Pick]    â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  [AI Analiz sonuÃ§larÄ± â€” bullet list]         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

Åampiyon seÃ§im modalÄ±: arama kutusu + rol filtresi + ikon grid.

### "Benim Ä°Ã§in Ã–neri" Modu

EÄŸer kullanÄ±cÄ± giriÅŸ yapmÄ±ÅŸsa:

- Kendi champion pool'u Ã¶ne Ã§Ä±karÄ±lÄ±r
- "Bu kompo iÃ§in Ahri iyi bir seÃ§im, Viktor daha gÃ¼Ã§lÃ¼ olurdu" yorumu

---

## Files

```
app/(app)/draft/page.tsx                                â† YENÄ°
src/domains/coaching/components/DraftBoard.tsx          â† YENÄ° (max 200 satÄ±r)
src/domains/coaching/components/ChampionPickModal.tsx   â† YENÄ°
src/domains/coaching/components/DraftAnalysisPanel.tsx  â† YENÄ°
src/domains/coaching/services/draftAnalysisService.ts   â† YENÄ°
app/api/draft/analyze/route.ts                          â† YENÄ°
app/api/public/champions/route.ts                       â† GET tÃ¼m ÅŸampiyonlar
src/hooks/useDraftAnalysis.ts                           â† YENÄ° TanStack Query
src/components/layout/Sidebar.tsx                       â† "Draft" linki ekle
```

---

## Tier Gating

- **Free:** 3 analiz/gÃ¼n
- **Pro:** SÄ±nÄ±rsÄ±z analiz + "Benim iÃ§in Ã¶neri" Ã¶zelliÄŸi
- **Elite:** Rakip profil analizi (summoner adÄ± gir, son pick pattern'i)

---

## Test Plan

```typescript
describe('draftAnalysisService', () => {
  it('buildDraftPrompt: 5v5 ÅŸampiyon listesi prompt'a doÄŸru ekleniyor')
  it('analyzeDraft: cache hit ikinci Ã§aÄŸrÄ±da AI Ã§aÄŸrÄ±sÄ± yapmÄ±yor')
})
```

---

## Dependencies

- `championCacheService` âœ…
- `src/lib/ai/` âœ…
- Redis âœ…

---

## Definition of Done

- Draft board'da 5v5 seÃ§im yapÄ±labiliyor
- AI analizi TÃ¼rkÃ§e, bullet point formatÄ±nda dÃ¶nÃ¼yor
- URL paylaÅŸÄ±mÄ± Ã§alÄ±ÅŸÄ±yor (aynÄ± link aynÄ± draft'Ä± gÃ¶steriyor)
- Analiz sonuÃ§larÄ± cache'leniyor
- Sidebar'da "Draft" linki var
