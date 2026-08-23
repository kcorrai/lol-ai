# TASK-149 — Domain Components Doğrudan useQuery Kullanıyor (Mimari İhlal)

**Phase:** 5
**Status:** Todo
**Priority:** P3
**Puan:** 42/100

## Objective

CLAUDE.md kuralı: "No frontend components that fetch data directly. Data fetching goes through React Query hooks defined in `src/hooks/`."

Üç domain component bu kuralı ihlal ediyor:

| Dosya                                                    | Sorun                               |
| -------------------------------------------------------- | ----------------------------------- |
| `src/domains/identity/components/ReferralWidget.tsx:13`  | `useQuery` doğrudan import          |
| `src/domains/teams/components/PendingInvitesList.tsx:37` | `useQuery` + `useMutation` doğrudan |
| `src/domains/teams/components/TeamDashboard.tsx:46`      | `useQuery` + `useMutation` doğrudan |

## Acceptance Criteria

- Her 3 component için `src/hooks/` altında dedicated hook oluşturuldu
- Component'lar bu hook'ları kullanıyor, `@tanstack/react-query` doğrudan import edilmiyor
- Query key'ler `src/hooks/` içinde merkezi olarak tanımlanıyor
