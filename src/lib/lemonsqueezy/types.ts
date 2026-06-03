// LemonSqueezy webhook payload shapes
// Only the fields we actually use — not exhaustive

export type LsSubscriptionStatus =
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";

export interface LsWebhookMeta {
  event_name: string;
  custom_data?: {
    userId?: string;
  };
}

export interface LsSubscriptionAttributes {
  customer_id: number;
  status: LsSubscriptionStatus;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
  cancelled: boolean;
  pause: unknown | null;
}

export interface LsWebhookPayload {
  meta: LsWebhookMeta;
  data: {
    type: string;
    id: string;
    attributes: LsSubscriptionAttributes;
  };
}
