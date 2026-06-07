# TASK-084 — Draft Simülatörü & Win Condition Analyzer

**Phase:** 3 — Growth & Conversion  
**Status:** Pending  
**Estimated Effort:** 2.5 days  
**Priority:** P2

---

## Objective

Kullanıcı iki takımın şampiyonlarını manuel seçerek draft simüle edebilsin.
AI, kompo arketipini (engage/poke/split/teamfight) tespit etsin ve
"senin takımın hangi win condition'da kazanır" yorumunu yapsın.
Maç öncesi araç olarak da kullanılabilir.

---

## User Story

> "Takım arkadaşlarım seçimlerini yapıyor, ben ne seçsem bilmiyorum.
> Bir yere girip 'onlar Zed + Leona aldı, sen ne almalısın' sormak istiyorum."

---

## Acceptance Criteria

- [ ] `/draft` sayfasında iki taraf için şampiyon seçimi (5v5)
- [ ] Tüm şampiyonlar DDragon'dan yükleniyor, arama + filtre var
- [ ] AI kompo analizi: arketip tespiti + win condition (Türkçe, 4-5 bullet)
- [ ] "Senin için en iyi pick" önerisi (kendi champion pool'una göre, opsiyonel)
- [ ] "Draft'ı kaydet" → URL olarak paylaşılabilir (state query string'de)
- [ ] Mobile uyumlu (sütun bazlı layout)
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Şampiyon Listesi

DDragon'dan mevcut `championCacheService` kullan:
```typescript
// Tüm şampiyonları client'a ver
GET /api/public/champions
Response: { champions: { id: number; name: string; roles: string[]; iconUrl: string }[] }
```

### Draft State (URL-based)

```typescript
// /draft?blue=Ahri,Viktor,Leona&red=Zed,Thresh,Jinx&pos=mid
// URL state management — sayfa yenilenince kaybolmaz, paylaşılabilir
```

React state → URL query string senkronizasyonu.
DB'ye kaydetme yok — tamamen client-side state.

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
  redComp: { ... };         // aynı yapı
  overallAssessment: string; // "Mavi takım geç oyun kazanır, Kırmızı takım early baskı yapmalı"
  recommendation: string;    // "Mavi takım olarak 20. dakikaya kadar savunmacı oyna, baron etrafında teamfight ara"
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

Cache: aynı draft kombinasyonu için 24 saat Redis cache.
Key: `draft:{sorted_blue_champions}:{sorted_red_champions}`

### Şampiyon Rol Arketipleri (Local Data)

AI çağrısını beslemek için temel rol verileri:
```typescript
const CHAMPION_ARCHETYPES: Record<string, string> = {
  Ahri: 'assassin-mage',
  Viktor: 'poke-mage',
  Leona: 'engage-support',
  Thresh: 'utility-support',
  Zed: 'assassin',
  Jinx: 'hypercarry-adc',
  // ...
};
```
DDragon'dan çekilebilir veya static JSON olarak tutulabilir.

### Frontend: Draft Board

```
app/(app)/draft/page.tsx

Layout:
┌─────────────┬──────────────────┬─────────────┐
│  MAVİ TAKIM │   [Analiz Et]    │  KIRMIZI    │
│             │                  │  TAKIM      │
│  [+Pick]    │                  │  [+Pick]    │
│  [+Pick]    │                  │  [+Pick]    │
│  [+Pick]    │                  │  [+Pick]    │
│  [+Pick]    │                  │  [+Pick]    │
│  [+Pick]    │                  │  [+Pick]    │
├─────────────┴──────────────────┴─────────────┤
│  [AI Analiz sonuçları — bullet list]         │
└──────────────────────────────────────────────┘
```

Şampiyon seçim modalı: arama kutusu + rol filtresi + ikon grid.

### "Benim İçin Öneri" Modu

Eğer kullanıcı giriş yapmışsa:
- Kendi champion pool'u öne çıkarılır
- "Bu kompo için Ahri iyi bir seçim, Viktor daha güçlü olurdu" yorumu

---

## Files

```
app/(app)/draft/page.tsx                                ← YENİ
src/domains/coaching/components/DraftBoard.tsx          ← YENİ (max 200 satır)
src/domains/coaching/components/ChampionPickModal.tsx   ← YENİ
src/domains/coaching/components/DraftAnalysisPanel.tsx  ← YENİ
src/domains/coaching/services/draftAnalysisService.ts   ← YENİ
app/api/draft/analyze/route.ts                          ← YENİ
app/api/public/champions/route.ts                       ← GET tüm şampiyonlar
src/hooks/useDraftAnalysis.ts                           ← YENİ TanStack Query
src/components/layout/Sidebar.tsx                       ← "Draft" linki ekle
```

---

## Tier Gating

- **Free:** 3 analiz/gün
- **Pro:** Sınırsız analiz + "Benim için öneri" özelliği
- **Elite:** Rakip profil analizi (summoner adı gir, son pick pattern'i)

---

## Test Plan

```typescript
describe('draftAnalysisService', () => {
  it('buildDraftPrompt: 5v5 şampiyon listesi prompt'a doğru ekleniyor')
  it('analyzeDraft: cache hit ikinci çağrıda AI çağrısı yapmıyor')
})
```

---

## Dependencies

- `championCacheService` ✅
- `src/lib/ai/` ✅
- Redis ✅

---

## Definition of Done

- Draft board'da 5v5 seçim yapılabiliyor
- AI analizi Türkçe, bullet point formatında dönüyor
- URL paylaşımı çalışıyor (aynı link aynı draft'ı gösteriyor)
- Analiz sonuçları cache'leniyor
- Sidebar'da "Draft" linki var
