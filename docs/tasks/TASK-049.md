# TASK-049 — [F1-5] Matchup Coach Sayfası UI

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 2 days

---

## Objective

Matchup Coach'un tam kullanıcı arayüzünü yaz. İki champion seçimi, analiz tetikleme ve dört sekmeli sonuç gösterimi (Lane / Trade / Build / Hatalar).

---

## Acceptance Criteria

- [ ] `app/(app)/matchup/page.tsx` oluşturuldu
- [ ] İki `ChampionSelector` (TASK-038) yan yana çalışıyor
- [ ] Rol seçici (5 buton) çalışıyor
- [ ] "Analiz Et" butonu üç alan da doluyken aktif
- [ ] Loading skeleton gösteriliyor
- [ ] Dört sekme çalışıyor: Lane Analizi, Trade Rehberi, Build, Kritik Hatalar
- [ ] Her sekmenin içeriği ilgili `MatchupAnalysis` alanını doğru render ediyor
- [ ] Power spike'lar liste veya timeline olarak gösteriliyor
- [ ] Trade kartları (Short / Long) görsel olarak ayrışıyor
- [ ] Build itemler grid formatında, reasoning altında
- [ ] Kritik hatalar kırmızı uyarı kutucukları olarak gösteriliyor
- [ ] Share butonu URL'yi panoya kopyalıyor
- [ ] Dark mode çalışıyor, mobil responsive
- [ ] `MatchupSkeleton.tsx` yazıldı
- [ ] `MatchupSection.tsx` yazıldı (tab içeriklerini render eden component)

---

## Teknik Gereksinimler

### Sayfa Yapısı

```
┌─────────────────────────────────────────────┐
│  Matchup Koçu                               │
│  ┌──────────────┐  vs  ┌──────────────┐    │
│  │[ChampSelector]│     │[ChampSelector]│    │
│  └──────────────┘      └──────────────┘    │
│  [Top][JGL][MID][ADC][SUP]                 │
│  [Analiz Et →]  (disabled until all set)   │
├─────────────────────────────────────────────┤
│  [Lane Analizi][Trade][Build][Hatalar]      │
├─────────────────────────────────────────────┤
│  <Tab içeriği — MatchupSection>             │
└─────────────────────────────────────────────┘
```

### Lane Analizi Sekmesi

- Avantaj/dezavantaj badge: favorable=yeşil, unfavorable=kırmızı, even=gri
- Summary metni
- "Level 1-3 Planı" ve "Level 6 Planı" açıklama kutuları
- Power spike'lar: level veya item tetikleyicili liste

### Trade Rehberi Sekmesi

- Short Trade kartı: scenario + advantage badge + tip
- Long Trade kartı: aynı format
- Kazanma Koşulları: yeşil checkmark listesi
- Kaybetme Koşulları: kırmızı X listesi

### Build Sekmesi

- "Başlangıç Itemleri": küçük kutucuklar (ikon yoksa item adı)
- "Core Itemler": büyük kutucuklar
- "Durumsal Itemler": kenarlıklı kutucuklar + açıklama
- Reasoning metni italik olarak

### Kritik Hatalar Sekmesi

- Üç bölüm kırmızı arka planlı kart: Avoid Trades / Risky Timings / Key Mistakes
- Her madde önünde ⚠ ikonu

---

## Bağımlılıklar

- TASK-038 (ChampionSelector)
- TASK-048 (useMatchupAnalysis hook)

---

## Notlar

- Sekme yönetimi için `useState<'lane' | 'trade' | 'build' | 'mistakes'>` yeterli — Radix Tabs da kullanılabilir.
- Page component 200 satırı geçerse `MatchupSection.tsx`'e daha fazla mantık taşı.
- Share: `navigator.clipboard.writeText(window.location.href)` + toast bildirimi.
