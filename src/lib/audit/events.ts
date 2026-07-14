export const AUDIT_EVENTS = {
  // Auth
  "auth.login": "User logged in",
  "auth.logout": "User logged out",
  "auth.login.failed": "Failed login attempt",

  // Riot
  "riot.account.connected": "Riot account connected",
  "riot.account.removed": "Riot account removed",
  "riot.sync.started": "Match synchronization started",

  // Coaching
  "report.generated": "Coaching report generated",
  "report.viewed": "Coaching report viewed",

  // Subscription
  "subscription.upgraded": "Upgraded to Pro",
  "subscription.cancelled": "Subscription cancelled",

  // Data / GDPR
  "data.export.requested": "Data export requested",
  "data.deletion.requested": "Data deletion requested",
  "data.deletion.completed": "Data deletion completed",

  // Admin
  "admin.user.viewed": "Admin viewed user data",
  "admin.impersonation": "Admin acted on behalf of user",

  // Teams
  "team.created": "Team created",
  "team.member.invited": "Team member invited",
  "team.member.joined": "Team member joined",
  "team.member.removed": "Team member removed",
} as const;

export type AuditEvent = keyof typeof AUDIT_EVENTS;
