# TASK-060 â€” [F4-2] Build Explanation API + Hook + UI Entegrasyonu

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 1 day

---

## Objective

Build Explanation servisini API, hook ve UI katmanlarÄ±na baÄŸla. Mevcut maÃ§ detay sayfasÄ±na lazy-load eden bir "Bu Buildi Analiz Et" butonu ekle.

---

## Acceptance Criteria

- [ ] `app/api/match/[matchId]/build-explanation/route.ts` oluÅŸturuldu
- [ ] Auth gerekiyor â€” sadece kendi maÃ§Ä±nÄ± analiz edebilir
- [ ] KullanÄ±cÄ±nÄ±n bu maÃ§ta oynadÄ±ÄŸÄ± doÄŸrulanÄ±yor
- [ ] `src/hooks/useBuildExplanation.ts` oluÅŸturuldu
- [ ] Hook lazy-load â€” "Analiz Et" butonuna basÄ±lÄ±nca tetikleniyor
- [ ] Mevcut `app/(app)/match/[matchId]/page.tsx` sayfasÄ±na entegre edildi
- [ ] KullanÄ±cÄ±nÄ±n kendi participant kartÄ±na "Bu Buildi AI ile Analiz Et" butonu eklendi
- [ ] Butona basÄ±lÄ±nca `BuildExplanationPanel` accordion aÃ§Ä±lÄ±yor
- [ ] Her item iÃ§in âœ“/âœ— badge + reasoning + alternatif gÃ¶steriliyor
- [ ] Pro-only gate: free kullanÄ±cÄ±lar iÃ§in overlay CTA
- [ ] Route handler 80 satÄ±rÄ± geÃ§miyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### API Endpoint

```typescript
// app/api/match/[matchId]/build-explanation/route.ts
GET /api/match/[matchId]/build-explanation?puuid={participantPuuid}
```

Auth kontrolÃ¼:

```typescript
// session.user.id â†’ RiotAccount.userId â†’ MatchParticipant.riotAccountId baÄŸlantÄ±sÄ±nÄ± doÄŸrula
// Kendi maÃ§Ä± deÄŸilse: 403 Forbidden
```

Rate limit: 10 req/saat per user.

### Hook (`useBuildExplanation.ts`)

```typescript
export function useBuildExplanation(matchId: string, puuid: string | null) {
  const query = useQuery({
    queryKey: ["build-explanation", matchId, puuid],
    queryFn: () =>
      fetch(`/api/match/${matchId}/build-explanation?puuid=${puuid}`)
        .then((res) => res.json())
        .then((d) => d.data),
    enabled: false, // manuel tetikle
  });

  return {
    data: query.data,
    isLoading: query.isFetching,
    trigger: query.refetch,
  };
}
```

### UI Entegrasyonu (`BuildExplanationPanel.tsx`)

`src/domains/match/components/BuildExplanationPanel.tsx`:

- Accordion (closed default)
- Trigger: "Bu Buildi AI ile Analiz Et" butonu (spinner loading durumunda)
- Ä°Ã§erik: summary metni + item listesi
- Her item: item adÄ± + âœ“(yeÅŸil)/âœ—(kÄ±rmÄ±zÄ±) badge + reasoning + alternatif (varsa)
- `buildPath` metni italik olarak
- `biggestMistake` kÄ±rmÄ±zÄ± uyarÄ± kutusu (varsa)

### Pro Gate

`useSubscription` hook ile plan kontrol et. Free kullanÄ±cÄ± iÃ§in:

- Panel'in Ã¼zerinde blur overlay
- "Build analizi Pro Ã¶zelliÄŸidir. Upgrade yapÄ±n â†’" CTA

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-059 (buildExplanationService) tamamlanmÄ±ÅŸ olmalÄ±
