# TASK-108 — Middleware Güvenlik Açığı: Korumasız Sayfalar

**Phase:** 4
**Status:** Done
**Priority:** P0
**Puan:** 98/100

## Objective

middleware.ts yalnızca bir kısım path'i koruyor. (app) route grubundaki /improvement, /milestone, /leaderboard, /teams, /achievements, /recap, /otp, /draft, /matchup, /counter, /analysis, /onboarding, /champion-pool sayfaları korumasız kalıyor. Oturumsuz kullanıcılar bu sayfalara girdiğinde server component null session ile hata fırlatır.

## Acceptance Criteria

- Tüm (app) sayfaları middleware matcher'da tanımlı
- Oturumsuz kullanıcı eksik sayfalara gittiginde /login?callbackUrl=... yönlendirmesi alır
- Mevcut korumalı sayfalar bozulmaz
