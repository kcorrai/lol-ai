# TASK-127 — Sesli AI Koç (Conversational TTS)

**Phase:** 5
**Status:** Done
**Priority:** P3
**Puan:** 70/100

## Objective

tts.ts ve ListenButton.tsx mevcut (tek yönlü TTS). OpenAI Whisper (STT) + TTS ile kullanıcı rapor hakkında sesli soru sorabilsin, AI sesli yanıt versin.

## Acceptance Criteria

- Coaching report sayfasında Koçla Konuş butonu (Pro only)
- Kullanıcı mikrofon izni -> konuşur -> Whisper STT -> AI response -> TTS stream
- Konuşma geçmişi oturuma bağlı, kapanınca sıfırlanır
