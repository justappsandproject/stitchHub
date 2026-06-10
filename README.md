# StitchHub

Multi-tenant SaaS platform for tailors, fashion designers, boutiques, and fashion houses. Digitize customer onboarding, measurements, orders, production, and payments in one place.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI |
| Backend | NestJS, TypeScript, PostgreSQL (Supabase), Prisma ORM |
| Auth | JWT + Refresh Tokens, Role-Based Access Control |
| Monorepo | pnpm workspaces |

## Project Structure

```
stitchHub/
├── apps/
│   ├── api/          # NestJS REST API
│   └── web/          # Next.js web application
├── packages/
│   └── shared/       # Shared types and enums
├── docker-compose.yml
└── README.md
```

## MVP Modules (Phase 1)

- **Authentication** — Tenant registration, staff login, JWT + refresh tokens
- **Customer Management** — Profiles, search, tags, VIP status
- **Measurement Vault** — Configurable templates, versioning, revision history
- **Order Management** — Full lifecycle with status tracking
- **Production Workflow** — Kanban board (New → Delivered)
- **Payments** — Invoices, receipts, deposits, outstanding balances
- **Dashboard** — Revenue, orders, customers, production metrics

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.
2. Open **Project Settings → Database → Connection string**.
3. Copy both connection strings:
   - **Transaction pooler** (port `6543`) → used as `DATABASE_URL` (append `?pgbouncer=true`)
   - **Session / Direct** (port `5432`) → used as `DIRECT_URL` (needed for migrations)

### 3. Configure environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Then edit `apps/api/.env` and paste your Supabase connection strings into `DATABASE_URL` and `DIRECT_URL`.

> **Local alternative:** if you prefer local Postgres, run `docker compose up -d` and point both URLs at `postgresql://postgres:password@localhost:5432/stitchhub?schema=public`.

### 4. Run database migrations and seed

```bash
pnpm db:push
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
```

- **Web app:** http://localhost:3000
- **API:** http://localhost:3001
- **Swagger docs:** http://localhost:3001/api/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@stitchhub.com | admin123 |
| Tenant Owner | owner@elegantstitches.com | demo1234 |

## User Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform-wide tenant management |
| `TENANT_OWNER` | Full business access |
| `MANAGER` | Staff + operations management |
| `TAILOR` / `CUTTER` / `FINISHER` / `APPRENTICE` | Production workflow |
| `CUSTOMER` | Customer portal (orders, payments, measurements) |

## Multi-Tenant Architecture

Every tenant-scoped table includes `tenant_id`. The API enforces tenant isolation via:

- `TenantGuard` — Ensures authenticated users have tenant context
- `resolveTenantId()` — Scopes all queries to the user's tenant
- Role-based guards on every endpoint

Super admins operate across tenants; all other roles are strictly scoped.

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/v1/auth` |
| Tenants | `/api/v1/tenants` |
| Customers | `/api/v1/customers` |
| Measurements | `/api/v1/measurements` |
| Orders | `/api/v1/orders` |
| Payments | `/api/v1/payments` |
| Dashboard | `/api/v1/dashboard` |

## Roadmap

### Phase 2
Staff management, inventory, support tickets, appointments, analytics

### Phase 3
AI features, marketplace, fabric suppliers, virtual try-on

### Mobile
Flutter app with Firebase Cloud Messaging (planned)

## Repository

**GitHub:** https://github.com/justappsandproject/stitchHub

## Deployment

### Web (Vercel) — live

**Production URL:** https://stitchhub-web.vercel.app

The Next.js app is configured as a pnpm monorepo deploy:

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Install Command | `cd ../.. && pnpm install` |
| Build Command | `cd ../.. && pnpm --filter @stitchhub/web build` |

Redeploy from the repo root:

```bash
vercel deploy --prod
```

**Required env var** (Vercel → Project Settings → Environment Variables):

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com/api/v1` |

### API (Render)

The NestJS API cannot run on Vercel (long-running server). Deploy to [Render](https://render.com) using the `render.yaml` Blueprint in this repo.

**One-click Blueprint:** [Deploy stitchhub-api on Render](https://dashboard.render.com/select-repo?type=blueprint)

Or: Render Dashboard → **New** → **Blueprint** → connect `justappsandproject/stitchHub`.

After the Blueprint creates the service, set these env vars on Render (if not prompted):

**Manual Render settings** (if not using Blueprint):

| Setting | Value |
|---------|-------|
| Root Directory | *(leave empty)* |
| Build Command | `corepack enable && pnpm install --prod=false && pnpm --filter @stitchhub/api... build` |
| Start Command | `node apps/api/dist/src/main.js` |

> If Root Directory is set to `apps/api`, use this Build Command instead:
> `cd ../.. && corepack enable && pnpm install --prod=false && pnpm --filter @stitchhub/api... build`
> and Start Command: `node dist/src/main.js`

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooler URL + `?sslmode=require&connect_timeout=15` |
| `DIRECT_URL` | Supabase session URL + `?sslmode=require` |
| `JWT_SECRET` | Auto-generated by Blueprint, or set a long random string |
| `JWT_REFRESH_SECRET` | Auto-generated by Blueprint, or set a long random string |
| `CORS_ORIGIN` | `https://stitchhub-web.vercel.app` |

Then add `NEXT_PUBLIC_API_URL` on Vercel pointing to your Render API URL (e.g. `https://stitchhub-api.onrender.com/api/v1`) and redeploy:

```bash
vercel deploy --prod
```


## License

Proprietary — All rights reserved.
