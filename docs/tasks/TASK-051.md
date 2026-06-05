# TASK-051 — [F56-1] Dashboard "Son 10 Maç" Özet Kartı

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 1 day

---

## Objective

Mevcut `matchAnalysisService` ve `usePerformanceProfile` hook'u zaten 20 maç analizi yapıyor. Bu veriyi dashboard'da kullanıcıya görünür kıl. Yeni servis veya API endpoint yazmadan mevcut datayı öne çıkar.

---

## Acceptance Criteria

- [ ] `src/domains/analysis/components/RecentMatchesSummaryCard.tsx` oluşturuldu
- [ ] `usePerformanceProfile` hook'u kullanılıyor (yeni API call yok)
- [ ] Ortalama KDA gösteriliyor
- [ ] Ortalama CS/dk gösteriliyor
- [ ] Win rate (son 10 maç) gösteriliyor
- [ ] En çok oynanan champion ikon + isim ile gösteriliyor
- [ ] Playstyle badge gösteriliyor (Aggressive / Farming / Supportive / Balanced)
- [ ] "Güçlü Yönler" 2 madde yeşil gösteriliyor
- [ ] "Gelişim Alanları" 2 madde sarı gösteriliyor
- [ ] Dashboard sayfasına (`app/(app)/dashboard/page.tsx`) eklendi
- [ ] Loading skeleton var
- [ ] Boş veri durumu handle ediliyor
- [ ] Component 200 satırı geçmiyor
- [ ] Dark mode çalışıyor

---

## Teknik Gereksinimler

### Kart Yapısı

```
┌─────────────────────────────────────────┐
│  Son 10 Maç Performansı                 │
│  KDA: 3.2  |  CS/dk: 6.1  |  WR: 60%  │
├─────────────────────────────────────────┤
│  [ChampIcon] Yasuo  •  Aggressive       │
├─────────────────────────────────────────┤
│  ✓ Güçlü: Yüksek damage katkısı        │
│  ✓ Güçlü: Erken baskı                  │
│  ⚡ Gelişim: Vision skoru              │
│  ⚡ Gelişim: Geç oyun CS               │
└─────────────────────────────────────────┘
```

### Veri Kaynağı

`usePerformanceProfile(riotAccountId)` hook'u `PlayerPerformanceProfile` tipinde data döndürüyor. Bu tipten şu alanları kullan:
- `averageKda`, `averageCsPerMinute`, `winRate` (hesapla: wins/total)
- `topChampion` (en çok oynanan)
- `playstyle`
- `strongestAreas[]` (ilk 2)
- `weakestAreas[]` (ilk 2)

### Dashboard Entegrasyonu

`app/(app)/dashboard/page.tsx` dosyasını incele. Mevcut layout'u bozmadan, büyük ihtimalle action card'larının altına veya performance section'ına ekle.

---

## Bağımlılıklar

- Bağımsız — mevcut kod üzerinde enhancement.

---

## Notlar

- Yeni servis veya API endpoint yazmaya gerek yok — veri zaten çekiliyor.
- `riotAccountId` dashboard'daki mevcut active account state'inden al (`uiStore`).
