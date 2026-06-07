export const AUDIT_EVENTS = {
  // Auth
  "auth.login": "Kullanıcı giriş yaptı",
  "auth.logout": "Kullanıcı çıkış yaptı",
  "auth.login.failed": "Başarısız giriş denemesi",

  // Riot
  "riot.account.connected": "Riot hesabı bağlandı",
  "riot.account.removed": "Riot hesabı kaldırıldı",
  "riot.sync.started": "Maç senkronizasyonu başladı",

  // Coaching
  "report.generated": "Koçluk raporu üretildi",
  "report.viewed": "Koçluk raporu görüntülendi",

  // Subscription
  "subscription.upgraded": "Pro'ya yükseltildi",
  "subscription.cancelled": "Abonelik iptal edildi",

  // Data / GDPR
  "data.export.requested": "Veri dışa aktarma talep edildi",
  "data.deletion.requested": "Veri silme talep edildi",
  "data.deletion.completed": "Veri silme tamamlandı",

  // Admin
  "admin.user.viewed": "Admin kullanıcı verisini görüntüledi",
  "admin.impersonation": "Admin kullanıcı adına işlem yaptı",

  // Teams
  "team.created": "Takım oluşturuldu",
  "team.member.invited": "Takım üyesi davet edildi",
  "team.member.joined": "Takıma üye katıldı",
  "team.member.removed": "Takımdan üye çıkarıldı",
} as const;

export type AuditEvent = keyof typeof AUDIT_EVENTS;
