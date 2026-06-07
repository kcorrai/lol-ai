-- Fix missing LemonSqueezy columns in subscriptions table (schema drift patch)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lsCustomerId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "lsSubscriptionId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_lsCustomerId_key" ON "subscriptions"("lsCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_lsSubscriptionId_key" ON "subscriptions"("lsSubscriptionId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeCustomerId_key" ON "subscriptions"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId");
CREATE INDEX IF NOT EXISTS "subscriptions_lsCustomerId_idx" ON "subscriptions"("lsCustomerId");
