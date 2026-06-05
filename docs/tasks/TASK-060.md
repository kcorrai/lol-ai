# TASK-060 — [F4-2] Build Explanation API + Hook + UI Entegrasyonu

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Build Explanation servisini API, hook ve UI katmanlarına bağla. Mevcut maç detay sayfasına lazy-load eden bir "Bu Buildi Analiz Et" butonu ekle.

---

## Acceptance Criteria

- [ ] `app/api/match/[matchId]/build-explanation/route.ts` oluşturuldu
- [ ] Auth gerekiyor — sadece kendi maçını analiz edebilir
- [ ] Kullanıcının bu maçta oynadığı doğrulanıyor
- [ ] `src/hooks/useBuildExplanation.ts` oluşturuldu
- [ ] Hook lazy-load — "Analiz Et" butonuna basılınca tetikleniyor
- [ ] Mevcut `app/(app)/match/[matchId]/page.tsx` sayfasına entegre edildi
- [ ] Kullanıcının kendi participant kartına "Bu Buildi AI ile Analiz Et" butonu eklendi
- [ ] Butona basılınca `BuildExplanationPanel` accordion açılıyor
- [ ] Her item için ✓/✗ badge + reasoning + alternatif gösteriliyor
- [ ] Pro-only gate: free kullanıcılar için overlay CTA
- [ ] Route handler 80 satırı geçmiyor
- [ ] TypeScript strict

---

## Teknik Gereksinimler

### API Endpoint

```typescript
// app/api/match/[matchId]/build-explanation/route.ts
GET /api/match/[matchId]/build-explanation?puuid={participantPuuid}
```

Auth kontrolü:
```typescript
// session.user.id → RiotAccount.userId → MatchParticipant.riotAccountId bağlantısını doğrula
// Kendi maçı değilse: 403 Forbidden
```

Rate limit: 10 req/saat per user.

### Hook (`useBuildExplanation.ts`)

```typescript
export function useBuildExplanation(matchId: string, puuid: string | null) {
  const query = useQuery({
    queryKey: ['build-explanation', matchId, puuid],
    queryFn: () => fetch(`/api/match/${matchId}/build-explanation?puuid=${puuid}`)
      .then(res => res.json())
      .then(d => d.data),
    enabled: false,  // manuel tetikle
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
- İçerik: summary metni + item listesi
- Her item: item adı + ✓(yeşil)/✗(kırmızı) badge + reasoning + alternatif (varsa)
- `buildPath` metni italik olarak
- `biggestMistake` kırmızı uyarı kutusu (varsa)

### Pro Gate

`useSubscription` hook ile plan kontrol et. Free kullanıcı için:
- Panel'in üzerinde blur overlay
- "Build analizi Pro özelliğidir. Upgrade yapın →" CTA

---

## Bağımlılıklar

- TASK-059 (buildExplanationService) tamamlanmış olmalı
