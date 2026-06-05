# TASK-059 — [F4-1] buildExplanationService (Match-Specific Pivot)

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Kullanıcının kendi maçındaki gerçek buildi AI ile analiz et. Hangi itemler iyi, hangisi kötüydü ve neden? Güncel meta bilgisi gerektirmez — elimizdeki gerçek maç datasını kullan.

---

## Acceptance Criteria

- [ ] `src/domains/match/services/buildExplanationService.ts` yazıldı
- [ ] `explainBuild(matchId, participantPuuid)` Prisma'dan gerçek match datasını çekiyor
- [ ] Rakip takım kompozisyonu analize dahil ediliyor
- [ ] Cache hit durumunda AI çağrılmıyor (TTL: 30 gün — maç verisi değişmez)
- [ ] AI çıktısı Zod ile validate ediliyor
- [ ] `src/domains/match/prompts/buildExplanationPrompt.ts` yazıldı
- [ ] `BuildExplanation` tipi `src/domains/match/types/` klasörüne eklendi
- [ ] Servis 250 satırı geçmiyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### Yeni Tipler (`src/domains/match/types/buildExplanation.types.ts`)

```typescript
export interface ItemExplanation {
  itemName: string;
  wasGoodChoice: boolean;
  reasoning: string;
  betterAlternative: string | null;
  whenToChoose: string;
}

export interface BuildExplanation {
  summary: string;
  items: ItemExplanation[];
  buildPath: string;
  biggestMistake: string | null;
  generatedAt: string;
}
```

### Servis (`buildExplanationService.ts`)

```typescript
export async function explainBuild(
  matchId: string,
  participantPuuid: string
): Promise<BuildExplanation>
```

Veri toplama:
```typescript
// MatchParticipant'tan item1-item6 + champion
// Match'ten rakip takım pozisyon + champion listesi
// Oyun süresi, kazanan takım
const participant = await prisma.matchParticipant.findFirst({
  where: { matchId, /* puuid veya riotAccountId ile */ },
  include: { match: { include: { participants: true } } },
});
```

Cache key: `buildCacheKey('build-explanation', { matchId, participantPuuid })`
TTL: 30 gün (maç datası değişmez).

### Prompt (`buildExplanationPrompt.ts`)

`buildBuildExplanationPrompt(participant, enemyTeam)`:
- Oyuncunun champion'ını ve aldığı 6 itemi listele
- Rakip takım champion'larını liste olarak ver
- Oyun süresini ve kazananı ver
- "Her item için: iyi seçim miydi, neden, alternatif neydi?" sorusu
- `buildPath`: "Bu oyun için ideal build sırası ne olurdu?" sorusu
- `biggestMistake`: "Bu builddeki en büyük hata neydi?" sorusu

---

## Bağımlılıklar

- TASK-037 (AiCache)
- Mevcut `src/domains/match/` domain'i — yeni dosyalar eklenecek, var olanlar değişmeyecek.
