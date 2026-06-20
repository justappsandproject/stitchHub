-- Feature overhaul: measurements, messaging, tickets, financials, onboarding

-- Enums
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "FinancialType" AS ENUM ('INCOME', 'EXPENDITURE', 'PETTY_CASH');
CREATE TYPE "MessageSenderType" AS ENUM ('STAFF', 'CUSTOMER');

-- User extensions
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_reset_password" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invited_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");

-- Measurement extensions
ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "unit" TEXT NOT NULL DEFAULT 'cm';
ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "measurements" ADD COLUMN IF NOT EXISTS "taken_by_id" TEXT;
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_taken_by_id_fkey"
  FOREIGN KEY ("taken_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order extensions
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "measurement_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "style_reference_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_type" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD CONSTRAINT "orders_measurement_id_fkey"
  FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice extensions
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdf_url" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_order_id_key" ON "invoices"("order_id");

-- Audit log extensions
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_type" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "entity_type" TEXT;

-- Customer style selections
CREATE TABLE IF NOT EXISTS "customer_style_selections" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "style_id" TEXT,
  "photo_url" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_style_selections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "customer_style_selections_tenant_id_idx" ON "customer_style_selections"("tenant_id");
CREATE INDEX IF NOT EXISTS "customer_style_selections_customer_id_idx" ON "customer_style_selections"("customer_id");
ALTER TABLE "customer_style_selections" ADD CONSTRAINT "customer_style_selections_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_style_selections" ADD CONSTRAINT "customer_style_selections_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_style_selections" ADD CONSTRAINT "customer_style_selections_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "styles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Conversation messages
CREATE TABLE IF NOT EXISTS "conversation_messages" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "sender_type" "MessageSenderType" NOT NULL,
  "content" TEXT,
  "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "read" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "conversation_messages_tenant_id_customer_id_created_at_idx"
  ON "conversation_messages"("tenant_id", "customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "conversation_messages_tenant_id_read_idx"
  ON "conversation_messages"("tenant_id", "read");
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Tickets
CREATE TABLE IF NOT EXISTS "tickets" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "customer_id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "tickets_tenant_id_idx" ON "tickets"("tenant_id");
CREATE INDEX IF NOT EXISTS "tickets_tenant_id_customer_id_idx" ON "tickets"("tenant_id", "customer_id");
CREATE INDEX IF NOT EXISTS "tickets_tenant_id_status_idx" ON "tickets"("tenant_id", "status");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Ticket replies
CREATE TABLE IF NOT EXISTS "ticket_replies" (
  "id" TEXT NOT NULL,
  "ticket_id" TEXT NOT NULL,
  "author_id" TEXT NOT NULL,
  "author_type" "MessageSenderType" NOT NULL,
  "content" TEXT NOT NULL,
  "is_internal" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_replies_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ticket_replies_ticket_id_idx" ON "ticket_replies"("ticket_id");
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_fkey"
  FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Financial entries
CREATE TABLE IF NOT EXISTS "financial_entries" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "type" "FinancialType" NOT NULL,
  "direction" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "receipt_url" TEXT,
  "order_id" TEXT,
  "recorded_by" TEXT NOT NULL,
  "entry_date" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "financial_entries_tenant_id_idx" ON "financial_entries"("tenant_id");
CREATE INDEX IF NOT EXISTS "financial_entries_tenant_id_type_idx" ON "financial_entries"("tenant_id", "type");
CREATE INDEX IF NOT EXISTS "financial_entries_tenant_id_entry_date_idx" ON "financial_entries"("tenant_id", "entry_date");
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
