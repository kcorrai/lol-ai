# TASK-153 — Admin Panel Routing Düzelt

**Phase:** 5
**Status:** Todo
**Priority:** P1
**Puan:** 80/100

## Objective

Admin sayfaları `app/(admin)/` route group altında. Next.js route group parantezi URL'ye prefix eklemez, dolayısıyla sayfalar `/feature-flags`, `/analytics`, `/ai-cost`, `/audit-logs` adreslerinde — `/admin/*` değil. Admin layout'taki linkler ise `/admin/*` gösteriyor; bu yüzden admin paneline ulaşmak mümkün değil.

Ayrıca middleware `/feature-flags` vb. yolları korumadığı için admin sayfaları middleware bypass'ı olmadan herhangi bir kullanıcıya açık (layout redirect'i kurtarıyor ama yanlış bir güvenlik katmanı).

## Çözüm

`app/(admin)/` → `app/admin/` olarak yeniden yapılandır:

- `app/(admin)/layout.tsx` → `app/admin/layout.tsx`
- `app/(admin)/feature-flags/page.tsx` → `app/admin/feature-flags/page.tsx`
- `app/(admin)/ai-cost/page.tsx` → `app/admin/ai-cost/page.tsx`
- `app/(admin)/audit-logs/page.tsx` → `app/admin/audit-logs/page.tsx`
- `app/(admin)/analytics/page.tsx` → `app/admin/analytics/page.tsx`
- Middleware'e `/admin/:path*` ekle

## Acceptance Criteria

- `/admin/feature-flags`, `/admin/ai-cost`, `/admin/audit-logs`, `/admin/analytics` erişilebilir
- Admin olmayan kullanıcılar `/dashboard`'a yönlendiriliyor
- Middleware `/admin/*` yollarını koruyor
- Admin layout nav linkleri doğru çalışıyor
