# TASK-068: Counter Pick — Data Layer Genişletme

## Status: In Progress

## Context
Counter Pick sayfasının premium redesign'ı için veri katmanı genişletiliyor.
CounterEntry'ye AI'dan yeni alanlar ekleniyor.

## Changes
- `CounterEntry` tipine: `winRate?`, `lanePhases?`, `commonMistakes?`, `winConditions?`, `runeAdvice?`, `keyItems?` eklendi
- `tier` tipine `"C"` eklendi
- Zod şemaları güncellendi
- `counterPrompt.ts` tüm yeni alanları içerecek şekilde güncellendi
- `ddragon.ts`'e `championSplashUrl` eklendi

## Consequences
Mevcut cache'teki veriler yeni alanlar olmadan gelecek (optional oldukları için güvenli).
Yeni AI çağrıları tüm alanları döndürecek.
