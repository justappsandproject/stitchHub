-- Add stock quantity and tags to styles
ALTER TABLE "styles" ADD COLUMN IF NOT EXISTS "stock_quantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "styles" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
