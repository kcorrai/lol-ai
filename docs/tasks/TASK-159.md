# TASK-159: Sidebar Takım Seçici

## Status: Pending

## Score: 80/100

## Goal

TeamSidebar'a takım seçici dropdown ekle. Birden fazla takımda olan
kullanıcı header'daki takım adına tıklayınca diğer takımlara geçebilsin.
Tek takımı olan kullanıcıda sadece isim görünür (dropdown yok).

## Scope

- `src/components/layout/TeamSidebar.tsx` — header kısmına dropdown ekle
  (ChevronDown, takım listesi, tıklayınca router.push(`/teams/${id}`))
- useTeams() hook zaten var, ekstra API gerekmez

## Out of Scope

- Takım oluşturma shortcut (sidebar'dan direk)
