# TASK-115 — Challenge Generator: Cron Zamanlama Güvencesi

**Phase:** 4
**Status:** Done
**Priority:** P2
**Puan:** 79/100

## Objective

challengeGenerator.ts Inngest fonksiyonu var ama cron schedule tanımlı mı kontrol et. Günlük/haftalık challenge otomatik üretilmeli, kullanıcı sayfaya girmeden önce hazır olmalı.

## Acceptance Criteria

- Her gün UTC 00:00'da tüm aktif kullanıcılar için daily challenge Inngest cron ile üretilir
- Her Pazartesi UTC 00:00'da weekly challenge üretilir
- Duplicate koruması mevcut (aynı gün 2x üretmez)
- challengeProgressChecker her matchSync sonrası tetikleniyor
