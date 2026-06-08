# TASK-146 — favicon.ico Ekle

**Phase:** 5
**Status:** Todo
**Priority:** P2
**Puan:** 72/100

## Objective

`public/` klasöründe favicon.ico yok. Tüm tarayıcı sekmeleri boş ikon gösteriyor. `GET /favicon.ico → 404`.

## Acceptance Criteria

- `public/favicon.ico` mevcut (en az 32x32 ICO)
- `public/favicon-16x16.png` ve `public/favicon-32x32.png` eklendi
- `app/layout.tsx` metadata'sına `icons` alanı eklendi
- Tarayıcı sekmesinde LoL AI Coach ikonu görünüyor
