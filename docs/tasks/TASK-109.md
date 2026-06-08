# TASK-109 — AI Model Routing: Lite / Full Tier

**Phase:** 4
**Status:** Done
**Priority:** P1
**Puan:** 91/100

## Objective

Tüm AI çağrıları gpt-4o kullanıyor. Challenge açıklaması, tilt mesajı, recap özeti gibi hafif görevler için gpt-4o-mini kullanarak AI maliyetini %60-70 düşür. getAiClient() factory'sine tier parametresi ekle.

## Acceptance Criteria

- getAiClient("lite") gpt-4o-mini döner
- getAiClient("full") veya getAiClient() gpt-4o döner
- Hafif görevler (challenge, tilt, recap, counter desc) lite kullanır
- Coaching report full kullanır
- AI_LITE_MODEL env var eklenir
