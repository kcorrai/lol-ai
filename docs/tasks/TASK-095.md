# TASK-095: Test Coverage

## Status: Done

## Changes

- `src/domains/identity/services/referralService.test.ts` — getOrCreateReferralCode, applyReferralCode, completeReferral, getReferralStats için unit testler
- `src/inngest/functions/sendActivationEmail.test.ts` — buildActivationEmail XSS kaçışı + handler skip/send senaryoları
