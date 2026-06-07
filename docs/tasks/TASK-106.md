# TASK-106 — B2B Team Accounts Pilot

**Phase:** 4 — Scale & Expansion  
**Status:** Done  
**Estimated Effort:** 5 gün  
**Priority:** P3

---

## Objective

Esports takımları ve koçluk akademileri için pilot B2B özellik seti: bir "Takım"
oluşturan kullanıcı, üye davet edebilir ve tüm üyelerin match geçmişi + koçluk
raporlarını ortak bir dashboard üzerinden görüntüleyebilir. Bu, bireysel Pro
planının üzerinde yeni bir gelir katmanı yaratır (Team Plan).

---

## User Story

> "Bir esports takımının koçuyum. Takımımdaki 5 oyuncunun son maçlarını ve
> koçluk raporlarını tek bir ekrandan görmek istiyorum."

---

## Acceptance Criteria

- [ ] Kullanıcı "Takım" oluşturabiliyor (isim, logo URL)
- [ ] Takım sahibi e-posta ile üye davet edebiliyor (Inngest ile davet emaili)
- [ ] Davetli kullanıcı linke tıklayınca takıma katılıyor
- [ ] Koç rolü: tüm üye verilerini görüntüleyebilir, kendi raporunu üretemez
- [ ] Takım dashboard: üye listesi, her üyenin son maçı, son raporu, rank'ı
- [ ] Takım Plan gating: Team hesabı yalnızca aktif Team aboneliği ile çalışıyor
- [ ] Üye verisi erişimi izole — üye A, üye B'nin verisini göremiyor (yalnızca koç)
- [ ] Takımdan ayrılma ve üye çıkarma çalışıyor
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Yeni Domain: `teams`

```
src/domains/teams/
├── services/
│   ├── teamService.ts          ← takım CRUD, üye yönetimi
│   └── teamInviteService.ts    ← davet token oluşturma, doğrulama
├── repositories/
│   └── teamRepository.ts
├── types/
│   └── teams.types.ts
├── components/
│   ├── TeamMemberCard.tsx
│   ├── TeamDashboard.tsx
│   └── InviteModal.tsx
└── index.ts
```

### DB Şeması

```prisma
model Team {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  logoUrl   String?
  ownerId   String   @db.Uuid
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  owner   User         @relation("TeamOwner", fields: [ownerId], references: [id])
  members TeamMember[]
  invites TeamInvite[]

  @@map("teams")
}

model TeamMember {
  id       String     @id @default(uuid()) @db.Uuid
  teamId   String     @db.Uuid
  userId   String     @db.Uuid
  role     TeamRole   @default(PLAYER)
  joinedAt DateTime   @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

model TeamInvite {
  id        String    @id @default(uuid()) @db.Uuid
  teamId    String    @db.Uuid
  email     String
  token     String    @unique
  role      TeamRole  @default(PLAYER)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@map("team_invites")
}

enum TeamRole {
  OWNER
  COACH
  PLAYER
}
```

### API Routes

```
POST   /api/teams                          ← takım oluştur
GET    /api/teams/[teamId]                 ← takım bilgisi
DELETE /api/teams/[teamId]                 ← takımı sil (owner only)

POST   /api/teams/[teamId]/members/invite  ← üye davet et
DELETE /api/teams/[teamId]/members/[userId] ← üyeyi çıkar
POST   /api/teams/invites/[token]/accept   ← daveti kabul et

GET    /api/teams/[teamId]/dashboard       ← koç dashboard verisi
```

### Takım Dashboard Verisi

```typescript
// GET /api/teams/[teamId]/dashboard
// → TeamDashboardData

interface TeamMemberSummary {
  userId: string;
  gameName: string;
  tagLine: string;
  rank: string;
  lastMatchResult: "WIN" | "LOSS";
  lastMatchChampion: string;
  lastReportId: string | null;
  lastReportScore: number | null; // AI coaching skoru
  winRate7d: number;
}

interface TeamDashboardData {
  team: { id: string; name: string; logoUrl: string | null };
  members: TeamMemberSummary[];
}
```

### Yetki Kontrolü

```typescript
// Koç: TeamMember.role === COACH → tüm üye verisini görebilir
// Oyuncu: yalnızca kendi verisine erişebilir
// Owner: koç ile aynı + takım yönetimi

// src/domains/teams/services/teamService.ts
export async function assertCoachAccess(
  teamId: string,
  requestingUserId: string
): Promise<void>
```

### Davet Email Akışı

```typescript
// Inngest function: team/invite.send
// → email şablonu: "X sizi [Takım Adı] takımına davet etti"
// → link: /teams/join?token=xxx
// → token 48 saat geçerli
```

### Plan Gating

```typescript
// Team Plan: LemonSqueezy'de yeni bir ürün olarak tanımlanacak
// subscriptionService.ts'e TEAM tier ekleniyor
// Takım özelliklerine erişim: subscription.plan === 'team'
```

---

## Pages

```
app/(app)/teams/
├── page.tsx                  ← Takımlarım listesi
├── create/page.tsx           ← Takım oluştur
├── [teamId]/
│   ├── page.tsx              ← Takım dashboard (koç görünümü)
│   ├── members/page.tsx      ← Üye yönetimi
│   └── settings/page.tsx     ← Takım ayarları
app/(public)/teams/join/page.tsx  ← Davet kabul sayfası
```

---

## Files

```
src/domains/teams/services/teamService.ts          ← YENİ
src/domains/teams/services/teamInviteService.ts    ← YENİ
src/domains/teams/services/teamService.test.ts     ← YENİ
src/domains/teams/repositories/teamRepository.ts  ← YENİ
src/domains/teams/types/teams.types.ts             ← YENİ
src/domains/teams/components/TeamMemberCard.tsx    ← YENİ
src/domains/teams/components/TeamDashboard.tsx     ← YENİ
src/domains/teams/index.ts                         ← YENİ
app/(app)/teams/page.tsx                           ← YENİ
app/(app)/teams/create/page.tsx                    ← YENİ
app/(app)/teams/[teamId]/page.tsx                  ← YENİ
app/(app)/teams/[teamId]/members/page.tsx          ← YENİ
app/teams/join/page.tsx                            ← YENİ
app/api/teams/route.ts                             ← YENİ
app/api/teams/[teamId]/route.ts                    ← YENİ
app/api/teams/[teamId]/members/invite/route.ts     ← YENİ
app/api/teams/[teamId]/dashboard/route.ts          ← YENİ
app/api/teams/invites/[token]/accept/route.ts      ← YENİ
src/inngest/functions/teamInviteEmail.ts           ← YENİ
prisma/schema.prisma                               ← Team, TeamMember, TeamInvite
prisma/migrations/YYYYMMDD_teams/                  ← YENİ
docs/DATABASE_SCHEMA.md                            ← GÜNCELLE
docs/API_DESIGN.md                                 ← GÜNCELLE
```

---

## Test Plan

```typescript
describe('teamService', () => {
  it('takım oluşturunca owner otomatik OWNER rolüyle ekleniyor')
  it('COACH rolündeki kullanıcı üye verilerine erişebiliyor')
  it('PLAYER rolündeki kullanıcı başka üye verisine erişemiyor')
  it('süresi dolmuş davet tokenı kabul edilmiyor')
  it('aynı kullanıcı iki kez aynı takıma eklenemiyor')
})
```

---

## Definition of Done

- Takım oluşturma, davet, katılma akışı uçtan uca çalışıyor
- Koç dashboard tüm üye özetlerini gösteriyor
- Üye erişim izolasyonu doğrulandı
- Davet emaili gönderiliyor
- Team Plan gating çalışıyor
- DB migration temiz
- `docs/DATABASE_SCHEMA.md` ve `docs/API_DESIGN.md` güncellendi
