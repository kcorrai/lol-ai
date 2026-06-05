# TASK-065 — [F2-5] Draft Analyzer Sayfası UI

**Phase:** 4 — AI Analysis Tools
**Status:** Pending
**Estimated Effort:** 2.5 days

---

## Objective

Draft Analyzer'ın tam kullanıcı arayüzünü yaz. 10 champion picker, takım kompozisyon karşılaştırması, win conditions, scaling chart ve risk analizi.

---

## Acceptance Criteria

- [ ] `app/(app)/draft/page.tsx` oluşturuldu
- [ ] `RoleBasedTeamPicker` (TASK-038) iki takım için çalışıyor
- [ ] Seçilen champion diğer takımın picker'larında gösterilemiyor (duplicate prevention)
- [ ] "Analiz Et" butonu tüm 10 pozisyon doluyken aktif
- [ ] `TeamCompositionCard` 5 metriği bar chart ile gösteriyor
- [ ] `ScalingChart` Early/Mid/Late game güç çizgisini görselleştiriyor
- [ ] Win conditions her takım için ayrı gösteriliyor
- [ ] Key matchups listesi var
- [ ] Risk kartları severity'e göre renk kodlu
- [ ] Verdict sonuç metni öne çıkıyor
- [ ] Loading skeleton var
- [ ] Share butonu URL kopyalıyor
- [ ] Dark mode, mobil responsive
- [ ] Component'lerin hiçbiri 200 satırı geçmiyor

---

## Teknik Gereksinimler

### Sayfa Yapısı

```
┌──────────────────────────────────────────────────────┐
│  Draft Analizci                                      │
│  ┌─── Blue Team ────┐    ┌─── Red Team ─────┐       │
│  │ Top:    [Sel]   │    │ Top:    [Sel]    │       │
│  │ Jungle: [Sel]   │    │ Jungle: [Sel]    │       │
│  │ Mid:    [Sel]   │    │ Mid:    [Sel]    │       │
│  │ ADC:    [Sel]   │    │ ADC:    [Sel]    │       │
│  │ Supp:   [Sel]   │    │ Supp:   [Sel]    │       │
│  └─────────────────┘    └──────────────────┘       │
│  [Analiz Et →]  [Sıfırla]                           │
├──────────────────────────────────────────────────────┤
│  Takım Kompozisyon Karşılaştırması                  │
│  Blue ████░░ vs Red ██████  (5 metrik bar)          │
├──────────────────────────────────────────────────────┤
│  Kazanma Koşulları                                  │
│  Blue: [1][2]  |  Red: [1][2]                       │
├──────────────────────────────────────────────────────┤
│  Scaling: [Early][Mid][Late] power line             │
├──────────────────────────────────────────────────────┤
│  Kritik Eşleşmeler & Riskler                        │
├──────────────────────────────────────────────────────┤
│  Sonuç: [verdict metni — öne çıkan card]            │
└──────────────────────────────────────────────────────┘
```

### TeamCompositionCard Bileşeni

5 metrik için bar chart (CSS ile, external chart kütüphanesi gerekmez):
- Her metrik: etiket + iki taraflı bar (blue vs red)
- Blue = sol taraf mavi, Red = sağ taraf kırmızı
- Sayısal değer (1-10) göster

### ScalingChart Bileşeni

Early/Mid/Late game için basit progress gösterge:
- Her aşama için iki renk dot (blue/red) + skor
- Açıklama metnini hover/click'te göster

### Risk Kartları

- High severity = kırmızı kenarlık
- Medium = sarı kenarlık
- Low = gri kenarlık
- Takım badge: Blue/Red etiket

---

## Bağımlılıklar

- TASK-038 (RoleBasedTeamPicker)
- TASK-064 (useDraftAnalysis hook)
