# TASK-091: Onboarding Aktivasyon Optimizasyonu

## Status: Done

## Goal

Onboarding done adımında kullanıcının ilk AI raporunu almasını sağlamak. Daha önce 4 eşit buton vardı ve kullanıcılar hiçbirini tıklamadan ayrılıyordu.

## Changes

### `app/(app)/onboarding/page.tsx`

- `DoneStep` tamamen yeniden yazıldı
- 4 eşit buton grid'i → tek büyük primary CTA ("İlk Raporumu Al")
- 4 saniyelik `useEffect` countdown + `router.push("/coaching")` auto-redirect
- Progress checklist: Riot bağlandı ✓ → Maç sync oluyor (spinner) → AI koç bekliyor
- Dashboard linki küçük ve gri olarak alt kısmına indirildi
- `onFinish` prop'u kaldırıldı; DoneStep kendi routing'ini yönetiyor

## Activation Impact

Kullanıcı connect sonrası doğrudan `/coaching` sayfasına gidiyor. Eski akışta kullanıcı 4 eşit seçenekle bırakılıyordu; yeni akışta tek net yön var.
