-- Feature Batch 8: FREE plan + customer username

ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS 'FREE';

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "username" TEXT;

ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'FREE';
