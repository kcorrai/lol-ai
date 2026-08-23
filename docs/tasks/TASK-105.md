# TASK-105 — i18n Expansion: Korean + Portuguese

**Phase:** 4 — Scale & Expansion  
**Status:** Blocked  
**Estimated Effort:** 3 gün  
**Priority:** P3

---

## Objective

Türkçe i18n altyapısını (zaten hazır) kullanarak Korece (ko) ve Brezilya Portekizcesi
(pt-BR) dillerini ekle. KR ve BR sunucularını desteklemeye başladıktan sonra (TASK-103)
bu diller kritik kullanıcı kitlelerine ulaşmayı sağlayacak. Türkçe çeviri dosyaları
referans alınacak.

---

## User Story

> "Oyunu Türkçe oynuyorum ama uygulama İngilizce. Kendi dilimde görmek istiyorum."
> (aynı durum KR ve BR oyuncular için)

---

## Acceptance Criteria

- [ ] `ko` locale dosyaları eklenmiş — tüm Türkçe key'ler karşılıklı
- [ ] `pt-BR` locale dosyaları eklenmiş — tüm Türkçe key'ler karşılıklı
- [ ] Dil seçici Settings sayfasına eklenmiş (mevcut `tr` + `en` yanına)
- [ ] `next.config.js` locale listesi güncellendi
- [ ] Eksik çeviri key'leri için fallback: İngilizce (Türkçe değil)
- [ ] Locale dosyalarında `any` veya tip dışı key yok — TypeScript type-safe
- [ ] Şampiyon isimleri lokalize edilmiyor (Riot'un orijinal isimleri)
- [ ] Tarih/sayı formatları locale'e göre (ko: 한국어 formatı, pt-BR: Brezilya)

---

## Technical Approach

### Mevcut i18n Altyapısı

Proje `next-intl` kullanıyor. Türkçe referans dosyası:

```
src/locales/tr.json   ← referans (tüm key'ler burada)
src/locales/en.json   ← İngilizce
```

### Yeni Locale Dosyaları

```
src/locales/ko.json   ← YENİ (Korece)
src/locales/pt-BR.json ← YENİ (Portekizce/Brezilya)
```

Dosya yapısı `tr.json` ile birebir aynı; yalnızca değerler çevrilir.

### next.config.js Güncellemesi

```javascript
// next.config.js
const locales = ["tr", "en", "ko", "pt-BR"];
const defaultLocale = "tr";
```

### Dil Seçici

```typescript
// src/domains/identity/components/LocaleSwitcher.tsx
// Mevcut component'e ko ve pt-BR seçenekleri ekleniyor

const localeLabels: Record<string, string> = {
  tr: "Türkçe",
  en: "English",
  ko: "한국어",
  "pt-BR": "Português (BR)",
};
```

### Tarih/Sayı Formatları

```typescript
// src/lib/utils/formatters.ts
// Mevcut formatter'lara locale parametre ekle

export function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}
```

### Eksik Key Fallback

```typescript
// i18n.ts (next-intl config)
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./src/locales/${locale}.json`)).default,
  onError(error) {
    // missing key → İngilizce fallback, log
    logger.warn("i18n-missing-key", { error });
  },
  getMessageFallback({ namespace, key }) {
    return `${namespace}.${key}`; // en.json'dan al
  },
}));
```

### TypeScript Type-Safety

```typescript
// src/types/i18n.types.ts
// tr.json'dan otomatik type üretimi (next-intl önerilen pattern)
type Messages = typeof import("../locales/tr.json");
declare global {
  interface IntlMessages extends Messages {}
}
```

---

## Çeviri Kapsamı

Türkçe dosyasındaki ana namespace'ler:

| Namespace   | Anahtar Sayısı (tahmini) |
| ----------- | ------------------------ |
| `common`    | ~40                      |
| `dashboard` | ~30                      |
| `coaching`  | ~50                      |
| `champions` | ~25                      |
| `settings`  | ~35                      |
| `auth`      | ~20                      |
| `errors`    | ~15                      |
| **Toplam**  | ~215                     |

Not: Korece çeviri için makine çevirisi (DeepL) + native speaker review önerilir.
Bu task makine çevirisi ile teslim edilir; native review ayrı task.

---

## Files

```
src/locales/ko.json                                     ← YENİ
src/locales/pt-BR.json                                  ← YENİ
src/types/i18n.types.ts                                 ← GÜNCELLE (ko, pt-BR ekle)
src/domains/identity/components/LocaleSwitcher.tsx      ← GÜNCELLE (2 dil ekle)
src/lib/utils/formatters.ts                             ← GÜNCELLE (locale param)
next.config.js                                          ← GÜNCELLE (locales array)
i18n.ts                                                 ← GÜNCELLE (fallback config)
```

---

## Test Plan

```typescript
describe("LocaleSwitcher", () => {
  it("ko seçilince /ko/dashboard'a yönlendiriyor");
  it("pt-BR seçilince /pt-BR/dashboard'a yönlendiriyor");
  it("eksik key → İngilizce fallback gösteriyor, hata fırlatmıyor");
});

describe("formatters", () => {
  it("ko locale → Korece tarih formatı");
  it("pt-BR locale → Brezilya sayı formatı (nokta binlik ayraç)");
});
```

---

## Definition of Done

- `ko.json` ve `pt-BR.json` dosyaları eksiksiz (tüm key'ler mevcut)
- Settings'den dil değişimi anında uygulanıyor
- Eksik key fallback çalışıyor
- Tarih/sayı formatları locale'e göre doğru
- Türkçe ve İngilizce çalışmaya devam ediyor (regression yok)
