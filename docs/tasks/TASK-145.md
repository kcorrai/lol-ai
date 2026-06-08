# TASK-145 — `/champions` Middleware SEO Fix

**Phase:** 5
**Status:** Todo
**Priority:** P1
**Puan:** 95/100

## Objective

`/champions` yolu middleware'in `PROTECTED_PATHS` listesinde. `/(marketing)/champions/[name]` SEO landing page'leri unauthenticated kullanıcılara `/login`'e redirect ediyor. Google bu sayfaları indexleyemiyor — TASK-123'te eklenen canonical URL ve JSON-LD hiçbir işe yaramıyor.

## Root Cause

`middleware.ts` satır 10: `"/champions"` PROTECTED_PATHS'te.
`middleware.ts` satır 63: matcher'da `/champions/:path*` var.

App içinde `/champions` ile başlayan bir sayfa yok (sidebar'daki Şampiyonlar linki `/champions` route'una gidiyor ama bu marketing layoutu altında). Dolayısıyla bu route'u korumak mantıksız.

## Acceptance Criteria

- `middleware.ts` PROTECTED_PATHS'ten `/champions` çıkarıldı
- matcher'dan `/champions/:path*` çıkarıldı
- `/champions/ahri` gibi URL'ler login olmadan açılıyor
- Authenticated kullanıcılar da `champions` sayfasını görebiliyor (değişmemeli)
