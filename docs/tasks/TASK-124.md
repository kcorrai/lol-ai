# TASK-124 — Upgrade Cross-sell Prompt / Modal

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 71/100

## Objective

Free kullanıcı limite ulaştığında veya Pro-only özelliğe tıkladığında upgrade modal göster. Bu an dönüşüm niyetinin en yüksek olduğu andır.

## Acceptance Criteria

- UpgradeModal component: kullanıcının kullandığı özellikler + Pro fiyat
- REPORT_LIMIT_REACHED ve FORBIDDEN hataları bu modal'ı tetikler
- Pro'ya Geç -> checkout sayfasına
- Kayıt olmamış kullanıcılar -> register sayfasına
