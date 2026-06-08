# TASK-139 — Referral Program Ödül Mekanizması

**Phase:** 4
**Status:** Done
**Priority:** P3
**Puan:** 61/100

## Objective

referralService.ts var ama davet eden kişiye somut ödül veriliyor mu? Viral loop tamamlanmalı.

## Acceptance Criteria

- Referral kaydolduğunda referrer'a referral.converted Inngest event'i
- LemonSqueezy üzerinden referrer'a 1 hafta ücretsiz Pro
- Referral widget'ında X kişi davet ettin, X hafta kazandın
- Max ödül limiti tanımlı (abuse önlemi)
