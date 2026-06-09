# TASK-163: Üye Çıkarma Onay Diyaloğu

## Status: Pending
## Score: 68/100

## Goal
TeamMemberCard'daki "Çıkar" butonu şu an anında siliyor. 
"Bu üyeyi takımdan çıkarmak istediğinizden emin misiniz?" 
confirmation modal ekle.

## Scope
- `src/domains/teams/components/TeamMemberCard.tsx` — remove butonuna
  AlertDialog (shadcn/ui) ekle, onConfirm tetiklenince mevcut removeTeamMember mutation'ı çağır

## Out of Scope
- Üyeye bildirim emaili gönderme
