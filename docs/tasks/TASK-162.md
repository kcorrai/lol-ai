# TASK-162: Takım Kadro Görünümü (Lineup)

## Status: Pending
## Score: 72/100

## Goal
5 pozisyon (Top / JGL / Mid / ADC / SUP) bazında görsel kadro kartı.
Her slotta üyenin ana pozisyonu, rank badge ve şampiyon ikonu görünür.
Atanmamış slot "Boş" olarak gösterilir. LoL'e özel en güçlü görsel özellik.

## Scope
- `src/domains/teams/components/TeamLineup.tsx` — 5 slot grid bileşeni
- `app/api/teams/[teamId]/lineup/route.ts` — her üyenin en çok oynadığı pozisyonu döner
  (mevcut matchParticipant.teamPosition verisinden)
- `src/hooks/useTeamLineup.ts` — useTeamLineup(teamId)
- TeamDashboard'a "Kadro" sekmesi olarak ekle

## Out of Scope
- Manuel pozisyon ataması (drag & drop)
- Benç / yedek oyuncu kavramı
