# TASK-126 — Email Doğrulama Zorunluluğu

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 70/100

## Objective

Kullanıcılar email doğrulamadan tüm özelliklere erişiyor. Activation email gönderiliyor ama zorunlu tutulmuyor. AI rapor üretimi doğrulanmamış hesaplarda kısıtlanmalı.

## Acceptance Criteria

- Doğrulanmamış kullanıcı dashboard'a girdiğinde banner uyarısı
- AI rapor üretimi email doğrulaması olmadan devre dışı
- Tekrar gönder butonu 60 saniye cooldown
- emailVerified null -> restricted mode
