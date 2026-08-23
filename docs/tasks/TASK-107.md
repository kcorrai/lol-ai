# TASK-107 — SOC2 Compliance Preparation

**Phase:** 4 — Scale & Expansion  
**Status:** Done  
**Estimated Effort:** 4 gün  
**Priority:** P3

---

## Objective

B2B müşterilere (esports takımları, akademiler) satış yaparken sıkça sorulan
"SOC2 sertifikanız var mı?" sorusuna hazırlıklı olmak için teknik altyapıyı kur.
Bu task tam SOC2 sertifikası değil; audit log sistemi, veri erişim kontrolü,
güvenlik event takibi ve compliance dokümantasyonunu kapsar.

---

## Acceptance Criteria

- [ ] Tüm kritik işlemler için audit log kaydı oluşturuluyor
- [ ] Audit loglar değiştirilemez (soft-delete yok, update yok)
- [ ] Admin panelinde audit log görüntüleyici çalışıyor
- [ ] Kullanıcı veri dışa aktarma (GDPR export) endpoint'i çalışıyor
- [ ] Kullanıcı veri silme (GDPR erasure) endpoint'i çalışıyor
- [ ] Hassas env var'lar için döngüsel key rotasyon prosedürü belgelenmiş
- [ ] Güvenlik event'leri (brute force, anormal erişim) Sentry'e iletiliyor
- [ ] `docs/adr/ADR-004-audit-logging.md` oluşturuldu
- [ ] TypeScript strict — no `any`

---

## Technical Approach

### Audit Log Sistemi

```prisma
model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @db.Uuid
  actorId    String?  @db.Uuid  // işlemi yapan (admin farklı kullanıcı adına yaparsa)
  action     String              // "user.login", "report.generate", "subscription.cancel"
  resource   String              // "user", "report", "subscription"
  resourceId String?
  metadata   Json?               // ek bağlam (IP, user-agent, değişen alanlar)
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  user  User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

### Audit Event Tipleri

```typescript
// src/lib/audit/events.ts

export const AUDIT_EVENTS = {
  // Kimlik
  "auth.login": "Kullanıcı giriş yaptı",
  "auth.logout": "Kullanıcı çıkış yaptı",
  "auth.login.failed": "Başarısız giriş denemesi",
  "auth.password.changed": "Şifre değiştirildi",

  // Riot
  "riot.account.connected": "Riot hesabı bağlandı",
  "riot.account.removed": "Riot hesabı kaldırıldı",
  "riot.sync.started": "Maç senkronizasyonu başladı",

  // Koçluk
  "report.generated": "Koçluk raporu üretildi",
  "report.viewed": "Koçluk raporu görüntülendi",

  // Abonelik
  "subscription.upgraded": "Pro'ya yükseltildi",
  "subscription.cancelled": "Abonelik iptal edildi",

  // Veri
  "data.export.requested": "Veri dışa aktarma talep edildi",
  "data.deletion.requested": "Veri silme talep edildi",

  // Admin
  "admin.user.viewed": "Admin kullanıcı verisini görüntüledi",
  "admin.impersonation": "Admin kullanıcı adına işlem yaptı",
} as const;

export type AuditEvent = keyof typeof AUDIT_EVENTS;
```

### Audit Service

```typescript
// src/lib/audit/auditService.ts

interface AuditParams {
  userId?: string;
  actorId?: string;
  action: AuditEvent;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function audit(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      ...params,
      resource: params.action.split(".")[0],
    },
  });
}
```

### API Route Entegrasyonu

Her önemli işlem sonrasına audit çağrısı eklenir:

```typescript
// app/api/riot/connect/route.ts
await audit({
  userId: session.user.id,
  action: "riot.account.connected",
  resourceId: riotAccount.id,
  ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
});
```

### GDPR Export

```typescript
// GET /api/account/export
// → kullanıcının tüm verisini JSON olarak döndür (zip ile)

interface UserDataExport {
  user: { email: string; name: string; createdAt: string };
  riotAccounts: RiotAccount[];
  matches: Match[];
  coachingReports: CoachingReport[];
  auditLogs: AuditLog[];
}
```

### GDPR Erasure

```typescript
// DELETE /api/account
// → kullanıcı + tüm bağlı veri cascade delete
// → audit log'da "data.deletion.requested" kaydı (userId null yapılmaz, anonim edilir)
// → 30 gün bekleme süresi (soft-delete) sonra hard delete (Inngest scheduled)
```

### Brute Force Detection

```typescript
// src/lib/security/bruteForce.ts
// Upstash Redis'te son 15 dakikada başarısız giriş sayısı
// 5+ başarısız giriş → Sentry alert + hesap geçici kilidi

export async function checkBruteForce(identifier: string): Promise<void> {
  const key = `brute-force:${identifier}`;
  const count = await redis.incr(key);
  await redis.expire(key, 900); // 15 dakika

  if (count >= 5) {
    Sentry.captureEvent({
      level: "warning",
      message: "Brute force attempt detected",
      extra: { identifier, count },
    });
    throw new Error("TOO_MANY_ATTEMPTS");
  }
}
```

### Admin Audit Log Görüntüleyici

```typescript
// app/(admin)/audit-logs/page.tsx
// Filtreler: userId, action, tarih aralığı
// Pagination: 50 kayıt/sayfa
// Export: CSV indir
```

---

## Files

```
src/lib/audit/auditService.ts                    ← YENİ
src/lib/audit/events.ts                          ← YENİ
src/lib/audit/auditService.test.ts               ← YENİ
src/lib/security/bruteForce.ts                   ← YENİ
app/(admin)/audit-logs/page.tsx                  ← YENİ
app/api/account/export/route.ts                  ← YENİ (GDPR export)
app/api/account/route.ts                         ← GÜNCELLE (DELETE → erasure)
app/api/auth/[...nextauth]/route.ts              ← GÜNCELLE (brute force check)
app/api/riot/connect/route.ts                    ← GÜNCELLE (audit ekle)
app/api/coaching/generate/route.ts               ← GÜNCELLE (audit ekle)
prisma/schema.prisma                             ← AuditLog model
prisma/migrations/YYYYMMDD_audit_logs/           ← YENİ
src/inngest/functions/gdprErasure.ts             ← YENİ (30 gün sonra hard delete)
docs/adr/ADR-004-audit-logging.md               ← YENİ
docs/DATABASE_SCHEMA.md                          ← GÜNCELLE
```

---

## Test Plan

```typescript
describe("auditService", () => {
  it("audit() DB'ye kayıt oluşturuyor");
  it("audit() AuditLog kaydı update veya delete edilemiyor");
  it("userId null olsa bile kayıt oluşuyor (anonim işlemler)");
});

describe("bruteForce", () => {
  it("5. başarısız denemede hata fırlatıyor");
  it("15 dakika sonra sayaç sıfırlanıyor");
  it("başarılı giriş sonrası sayaç sıfırlanıyor");
});

describe("GDPR", () => {
  it("export endpoint kullanıcının tüm verisini içeriyor");
  it("silme endpoint 30 gün sonra veriyi hard-delete yapıyor");
  it("silme işlemi audit log'da anonim kayıt bırakıyor");
});
```

---

## ADR

`docs/adr/ADR-004-audit-logging.md` oluşturulacak:

- Neden append-only audit log?
- Neden ayrı tablo (application log'a göre)?
- Retention policy: 2 yıl

---

## Definition of Done

- Audit log tablosu oluşturuldu ve kritik action'lara çağrılar eklendi
- Admin audit log sayfası çalışıyor
- GDPR export ve erasure endpoint'leri çalışıyor
- Brute force protection aktif
- ADR-004 yazıldı
- `docs/DATABASE_SCHEMA.md` güncellendi
