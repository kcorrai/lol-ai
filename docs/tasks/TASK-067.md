# TASK-067 â€” [NAV] Sidebar Navigasyon GÃ¼ncellemesi

**Phase:** 4 â€” AI Analysis Tools
**Status:** Done
**Estimated Effort:** 0.5 day

---

## Objective

TÃ¼m yeni sayfalar tamamlandÄ±ktan sonra sidebar ve mobil navigasyonu gÃ¼ncelle. `docs/PROJECT_STRUCTURE.md` dokÃ¼manÄ±nÄ± yeni sayfalarla gÃ¼ncelle.

---

## Acceptance Criteria

- [ ] Sidebar'a 4 yeni nav Ã¶ÄŸesi eklendi
- [ ] Her nav Ã¶ÄŸesi doÄŸru path'e yÃ¶nlendiriyor
- [ ] Ä°konlar tutarlÄ± (Lucide React kullanÄ±lÄ±yor)
- [ ] Mobile `BottomNav`'a en Ã¶nemli 2 yeni sayfa eklendi
- [ ] Aktif route highlight Ã§alÄ±ÅŸÄ±yor (mevcut pattern korundu)
- [ ] `docs/PROJECT_STRUCTURE.md` yeni sayfalarla gÃ¼ncellendi
- [ ] Sidebar collapse/expand state korunuyor
- [ ] Dark mode Ã§alÄ±ÅŸÄ±yor

---

## Teknik Gereksinimler

### Sidebar GÃ¼ncellemesi

Mevcut sidebar component'ini bul ve "AraÃ§lar" section'Ä± ekle (veya mevcut section'a dahil et):

```typescript
const toolsNavItems = [
  {
    label: "Counter Pick",
    href: "/counter",
    icon: Shield, // lucide-react
  },
  {
    label: "Matchup KoÃ§u",
    href: "/matchup",
    icon: Swords, // lucide-react
  },
  {
    label: "Draft Analizci",
    href: "/draft",
    icon: Users, // lucide-react
  },
  {
    label: "OTP AsistanÄ±",
    href: "/otp",
    icon: Star, // lucide-react
  },
];
```

### Mobile BottomNav

Mevcut `BottomNav` bileÅŸenine en Ã§ok kullanÄ±lacak 2 sayfa ekle:

- Counter Pick (yÃ¼ksek kullanÄ±m sÄ±klÄ±ÄŸÄ±)
- Matchup KoÃ§u (yÃ¼ksek kullanÄ±m sÄ±klÄ±ÄŸÄ±)

Mobil nav'da alan sÄ±nÄ±rlÄ± â€” mevcut Ã¶ÄŸeleri kaldÄ±rmadan boÅŸ slot varsa ekle; yoksa en az kullanÄ±lan ile deÄŸiÅŸtir.

### PROJECT_STRUCTURE.md GÃ¼ncellemesi

`docs/PROJECT_STRUCTURE.md` dosyasÄ±nda `app/(app)/` bÃ¶lÃ¼mÃ¼ne yeni sayfalarÄ± ekle:

```
app/(app)/
â”œâ”€â”€ counter/page.tsx    â†’ Counter Pick Generator
â”œâ”€â”€ matchup/page.tsx    â†’ Matchup AI Coach
â”œâ”€â”€ draft/page.tsx      â†’ Draft Analyzer
â””â”€â”€ otp/page.tsx        â†’ OTP Assistant
```

`src/domains/` bÃ¶lÃ¼mÃ¼ne yeni domain'leri ekle.

---

## BaÄŸÄ±mlÄ±lÄ±klar

- TASK-043 (Counter Pick sayfasÄ±)
- TASK-049 (Matchup sayfasÄ±)
- TASK-057 (OTP sayfasÄ±)
- TASK-065 (Draft sayfasÄ±)

Bu task tÃ¼m sayfa task'larÄ±ndan sonra yapÄ±lmalÄ±.

---

## Notlar

- Nav Ã¶ÄŸe sÄ±rasÄ±: sÄ±k kullanÄ±landan az kullanÄ±lana (Counter â†’ Matchup â†’ OTP â†’ Draft).
- Sidebar'da section baÅŸlÄ±ÄŸÄ± "AraÃ§lar" veya mevcut yapÄ±ya uyan bir etiket.
- `Swords` ikonu Lucide'da olmayabilir â€” alternatif: `Crosshair` veya `Target`.
