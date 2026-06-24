/**
 * Idempotent SQL patches applied on API startup when Render migrate deploy
 * has not run. Keeps production DB aligned with the Prisma schema.
 */
export const SCHEMA_PATCHES: string[] = [
  // User onboarding
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin" TEXT`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_reset_password" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invited_at" TIMESTAMP(3)`,
  // Soft delete
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3)`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3)`,
  `CREATE INDEX IF NOT EXISTS "customers_tenant_id_deleted_at_idx" ON "customers"("tenant_id", "deleted_at")`,
  `CREATE INDEX IF NOT EXISTS "orders_tenant_id_deleted_at_idx" ON "orders"("tenant_id", "deleted_at")`,
  // Customer username
  `ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "username" TEXT`,
  // Style store extensions
  `ALTER TABLE "styles" ADD COLUMN IF NOT EXISTS "stock_quantity" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "styles" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  // Measurement extensions
  `ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'cm'`,
  `ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "taken_by_id" TEXT`,
];
