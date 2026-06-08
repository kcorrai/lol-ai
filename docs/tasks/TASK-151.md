# TASK-151 — ESLint Disable Comment Açıklaması Eksik

**Phase:** 5
**Status:** Todo
**Priority:** P5
**Puan:** 20/100

## Objective

`src/components/ui/EmailVerificationBanner.tsx:27` satırında `eslint-disable-next-line react-hooks/exhaustive-deps` var ama neden gerekli olduğu açıklanmamış.

CLAUDE.md: "No disabled ESLint rules without a written comment explaining why."

## Acceptance Criteria

- Disable satırının üstüne/yanına neden gerektiğini açıklayan kısa bir comment eklendi
- Ya da hook bağımlılığı gerçekten güvenli şekilde düzeltildi ve disable kaldırıldı
