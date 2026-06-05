# TASK-067 — [NAV] Sidebar Navigasyon Güncellemesi

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 0.5 day

---

## Objective

Tüm yeni sayfalar tamamlandıktan sonra sidebar ve mobil navigasyonu güncelle. `docs/PROJECT_STRUCTURE.md` dokümanını yeni sayfalarla güncelle.

---

## Acceptance Criteria

- [ ] Sidebar'a 4 yeni nav öğesi eklendi
- [ ] Her nav öğesi doğru path'e yönlendiriyor
- [ ] İkonlar tutarlı (Lucide React kullanılıyor)
- [ ] Mobile `BottomNav`'a en önemli 2 yeni sayfa eklendi
- [ ] Aktif route highlight çalışıyor (mevcut pattern korundu)
- [ ] `docs/PROJECT_STRUCTURE.md` yeni sayfalarla güncellendi
- [ ] Sidebar collapse/expand state korunuyor
- [ ] Dark mode çalışıyor

---

## Teknik Gereksinimler

### Sidebar Güncellemesi

Mevcut sidebar component'ini bul ve "Araçlar" section'ı ekle (veya mevcut section'a dahil et):

```typescript
const toolsNavItems = [
  {
    label: 'Counter Pick',
    href: '/counter',
    icon: Shield,          // lucide-react
  },
  {
    label: 'Matchup Koçu',
    href: '/matchup',
    icon: Swords,          // lucide-react
  },
  {
    label: 'Draft Analizci',
    href: '/draft',
    icon: Users,           // lucide-react
  },
  {
    label: 'OTP Asistanı',
    href: '/otp',
    icon: Star,            // lucide-react
  },
];
```

### Mobile BottomNav

Mevcut `BottomNav` bileşenine en çok kullanılacak 2 sayfa ekle:
- Counter Pick (yüksek kullanım sıklığı)
- Matchup Koçu (yüksek kullanım sıklığı)

Mobil nav'da alan sınırlı — mevcut öğeleri kaldırmadan boş slot varsa ekle; yoksa en az kullanılan ile değiştir.

### PROJECT_STRUCTURE.md Güncellemesi

`docs/PROJECT_STRUCTURE.md` dosyasında `app/(app)/` bölümüne yeni sayfaları ekle:
```
app/(app)/
├── counter/page.tsx    → Counter Pick Generator
├── matchup/page.tsx    → Matchup AI Coach
├── draft/page.tsx      → Draft Analyzer
└── otp/page.tsx        → OTP Assistant
```

`src/domains/` bölümüne yeni domain'leri ekle.

---

## Bağımlılıklar

- TASK-043 (Counter Pick sayfası)
- TASK-049 (Matchup sayfası)
- TASK-057 (OTP sayfası)
- TASK-065 (Draft sayfası)

Bu task tüm sayfa task'larından sonra yapılmalı.

---

## Notlar

- Nav öğe sırası: sık kullanılandan az kullanılana (Counter → Matchup → OTP → Draft).
- Sidebar'da section başlığı "Araçlar" veya mevcut yapıya uyan bir etiket.
- `Swords` ikonu Lucide'da olmayabilir — alternatif: `Crosshair` veya `Target`.
