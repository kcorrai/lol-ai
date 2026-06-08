# TASK-148 — Sidebar Hook'larında Duplicate API Çağrıları

**Phase:** 5
**Status:** Todo
**Priority:** P3
**Puan:** 55/100

## Objective

Sidebar bulunan tüm sayfalarda 8 adet 401 console hatası var — 4 farklı API her biri 2 kez çağrılıyor:

```
/api/subscription      ×2
/api/riot/accounts     ×2
/api/achievements      ×2
/api/tilt/alerts       ×2
```

React Query aynı `queryKey` ile deduplicate etmeli; duplicate atılmasının nedeni layout ve page component'larının farklı zamanlarda mount olması ve ilk render sırasında query cache'in henüz dolu olmaması.

## Acceptance Criteria

- Her API en fazla 1 kez çağrılıyor (authenticated state'te)
- `staleTime` ve `gcTime` değerleri sidebar hook'larında tutarlı ayarlandı
- Console'da gereksiz 401 / duplicate istek yok
