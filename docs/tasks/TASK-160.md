# TASK-160: Oyuncu Profil Linki (TeamMemberCard'dan)

## Status: Pending
## Score: 78/100

## Goal
TeamMemberCard'ın her üye kartına "/u/[slug]" public profil sayfasına link ekle.
Slug = gameName+tagLine formatı. Halihazırda public profil sayfası var, sadece bağlantı kurulmuyor.

## Scope
- `src/domains/teams/components/TeamMemberCard.tsx` — kart başlığına Link ekle
  (gameName ve tagLine varsa /u/GameName-TAG formatında)
- `src/domains/teams/types/teams.types.ts` — TeamMemberSummary'ye slug alanı
  veya gameName+tagLine'dan türet

## Out of Scope
- Public profil sayfasında takım bilgisi gösterme
