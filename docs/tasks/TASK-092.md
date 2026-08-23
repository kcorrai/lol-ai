# TASK-092: Aktivasyon E-postası

## Status: Done

## Goal

Kullanıcı ilk Riot hesabını bağladıktan sonra event-based "İlk raporunu al" emaili gönder.

## Changes

- `src/lib/email/templates/activation.ts` — Türkçe aktivasyon email şablonu
- `src/inngest/functions/sendActivationEmail.ts` — `riot/account.connected` event'ini dinler
- `app/api/riot/connect/route.ts` — İlk hesap bağlandığında Inngest event'i tetikler
- `app/api/inngest/route.ts` — Yeni function register edildi
