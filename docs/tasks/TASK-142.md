# TASK-142 — Rate Limit Header Uygulaması

**Phase:** 4
**Status:** Done
**Priority:** P3
**Puan:** 55/100

## Objective

API_DESIGN.md'de belgelenen X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset header'ları endpoint'lerde dönmüyor. Frontend bekleme süresi gösterebilir.

## Acceptance Criteria

- withAuth middleware tüm rate limit header'larını ekliyor
- useGenerateReport hook kalan hakkı gösteriyor
- Rate limit dolduğunda X dakika sonra tekrar deneyin mesajı
