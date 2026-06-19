-- Add soft delete columns and inventory module

CREATE TYPE "InventoryTransactionType" AS ENUM ('RESTOCK', 'USAGE', 'ADJUSTMENT');

ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "customers_tenant_id_deleted_at_idx" ON "customers"("tenant_id", "deleted_at");

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "orders_tenant_id_deleted_at_idx" ON "orders"("tenant_id", "deleted_at");

CREATE TABLE IF NOT EXISTS "inventory_products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "sku" TEXT,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unit_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "supplier" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "inventory_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_qty" INTEGER NOT NULL,
    "new_qty" INTEGER NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "supplier" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "inventory_products_tenant_id_idx" ON "inventory_products"("tenant_id");
CREATE INDEX IF NOT EXISTS "inventory_products_tenant_id_category_idx" ON "inventory_products"("tenant_id", "category");
CREATE INDEX IF NOT EXISTS "inventory_transactions_tenant_id_idx" ON "inventory_transactions"("tenant_id");
CREATE INDEX IF NOT EXISTS "inventory_transactions_product_id_idx" ON "inventory_transactions"("product_id");

ALTER TABLE "inventory_products" DROP CONSTRAINT IF EXISTS "inventory_products_tenant_id_fkey";
ALTER TABLE "inventory_products" ADD CONSTRAINT "inventory_products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_transactions" DROP CONSTRAINT IF EXISTS "inventory_transactions_product_id_fkey";
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "inventory_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
