# TASK-199: Isolate OpenAI voice SDK calls behind src/lib/ai/

## Status: Done

## Goal

CLAUDE.md 2.2 forbids AI provider SDK calls outside `src/lib/ai/`. Two voice
routes broke this by instantiating `new OpenAI(...)` inline:

- `app/api/coaching/voice/synthesize/route.ts` (TTS) — also duplicated the logic
  that already lives in `src/lib/ai/tts.ts#generateSpeech`.
- `app/api/coaching/voice/transcribe/route.ts` (STT) — had no abstraction.

## Scope

- New `src/lib/ai/stt.ts`: `transcribeAudio(file: File): Promise<string>` wraps the
  OpenAI Whisper call.
- `synthesize/route.ts`: drop the inline OpenAI client, call `generateSpeech`.
- `transcribe/route.ts`: drop the inline OpenAI client, call `transcribeAudio`.
- Routes keep only request parsing / validation / rate limiting / response.

## Tests

No behavior change; existing suite stays green (these routes had no tests).
typecheck + lint clean.

## Commit

`refactor(ai): route voice TTS/STT through src/lib/ai abstraction`
