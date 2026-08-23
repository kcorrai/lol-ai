# TASK-059 â€” [F4-1] buildExplanationService (Match-Specific Pivot)

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

KullanÄ±cÄ±nÄ±n kendi maÃ§Ä±ndaki gerÃ§ek buildi AI ile analiz et. Hangi itemler iyi, hangisi kÃ¶tÃ¼ydÃ¼ ve neden? GÃ¼ncel meta bilgisi gerektirmez â€” elimizdeki gerÃ§ek maÃ§ datasÄ±nÄ± kullan.

---

## Acceptance Criteria

- [ ] `src/domains/match/services/buildExplanationService.ts` yazÄ±ldÄ±
- [ ] `explainBuild(matchId, participantPuuid)` Prisma'dan gerÃ§ek match datasÄ±nÄ± Ã§ekiyor
- [ ] Rakip takÄ±m kompozisyonu analize dahil ediliyor
- [ ] Cache hit durumunda AI Ã§aÄŸrÄ±lmÄ±yor (TTL: 30 gÃ¼n â€” maÃ§ verisi deÄŸiÅŸmez)
- [ ] AI Ã§Ä±ktÄ±sÄ± Zod ile validate ediliyor
- [ ] `src/domains/match/prompts/buildExplanationPrompt.ts` yazÄ±ldÄ±
- [ ] `BuildExplanation` tipi `src/domains/match/types/` klasÃ¶rÃ¼ne eklendi
- [ ] Servis 250 satÄ±rÄ± geÃ§miyor
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
): Promise<BuildExplanation>;
```

Veri toplama:

```typescript
// MatchParticipant'tan item1-item6 + champion
// Match'ten rakip takÄ±m pozisyon + champion listesi
// Oyun sÃ¼resi, kazanan takÄ±m
const participant = await prisma.matchParticipant.findFirst({
  where: { matchId /* puuid veya riotAccountId ile */ },
  include: { match: { include: { participants: true } } },
});
```

Cache key: `buildCacheKey('build-explanation', { matchId, participantPuuid })`
TTL: 30 gÃ¼n (maÃ§ datasÄ± deÄŸiÅŸmez).

### Prompt (`buildExplanationPrompt.ts`)

`buildBuildExplanationPrompt(participant, enemyTeam)`:

- Oyuncunun champion'Ä±nÄ± ve aldÄ±ÄŸÄ± 6 itemi listele
- Rakip takÄ±m champion'larÄ±nÄ± liste olarak ver
- Oyun sÃ¼resini ve kazananÄ± ver
- "Her item iÃ§in: iyi seÃ§im miydi, neden, alternatif neydi?" sorusu
- `buildPath`: "Bu oyun iÃ§in ideal build sÄ±rasÄ± ne olurdu?" sorusu
- `biggestMistake`: "Bu builddeki en bÃ¼yÃ¼k hata neydi?" sorusu

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-037 (AiCache)
- Mevcut `src/domains/match/` domain'i â€” yeni dosyalar eklenecek, var olanlar deÄŸiÅŸmeyecek.
