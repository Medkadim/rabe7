# rabe7 — B2B Distribution Platform

A platform that lets a single FMCG distributor take orders, manage customers and products,
track payments, and run their business digitally instead of over phone calls, WhatsApp
messages, and paper. Built to support one distributor today, and a second one tomorrow
without a rewrite (see "Why multi-tenant-ready" below).

This README is written for two audiences: **the business owner** who wants to know what
exists and how to see it running, and **engineers** who need to set up, extend, or deploy
the codebase. Skip to whichever section you need.

## What exists right now (Phase 1)

The plan (see the architecture briefing shared earlier in this project) is three phases.
**Phase 1 — the foundation — is built and working end to end:**

| Module | What it does | Status |
|---|---|---|
| Auth | Login, JWT sessions, refresh tokens, 2FA, roles & permissions, audit-ready | ✅ Working |
| Customers | Create/edit retailers, credit limits, payment terms, addresses, search | ✅ Working |
| Products | Categories, brands, volume price tiers, customer-specific pricing | ✅ Working |
| Orders | Create, edit, confirm, cancel, duplicate, PDF export, credit-limit check | ✅ Working |
| Payments | Record cash/transfer/cheque/credit payments, auto-updates invoice balance | ✅ Working |
| Admin dashboard | Login, live overview, customers screen (list + create) | ✅ Working |
| Products/Orders/Payments screens | List + create UI | 🔜 Next (API is ready; UI follows the Customers page's pattern) |
| Warehouse, Delivery, CRM, Promotions, Mobile app | Phase 2 / Phase 3 | Not started yet |

Every piece above has been tested against a real PostgreSQL database, not just compiled —
see [Testing Strategy](./docs/TESTING_STRATEGY.md) for exactly what was verified.

## For the business owner: how to see it running

You don't need to understand the code to look at this. Ask an engineer (or Claude, in this
same project) to run:

```
docker compose up -d
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed
```

Then open `http://localhost:3000` in a browser and sign in with:

- **Email:** `admin@rabe7.local`
- **Password:** `ChangeMe123!`

Change that password immediately after first login — it's a seeded default, not a secret.

## Why multi-tenant-ready (even though there's one distributor today)

Every business table has a `tenantId` column. Right now there's exactly one tenant row in
the database. If you ever bring on a second distributor, that becomes a second tenant row —
not a schema change, not a rewrite. This is the single architectural decision that keeps
"one distributor today" from becoming a costly rebuild later.

## Tech stack

- **Backend:** NestJS, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ
- **Frontend (admin):** Next.js 16 (App Router), React 19, TailwindCSS v4, TanStack Query, React Hook Form + Zod
- **Auth:** JWT access tokens (in-memory in the browser) + rotating refresh tokens (httpOnly cookie), TOTP 2FA
- **Storage:** S3-compatible (MinIO locally, swappable for AWS S3 / DigitalOcean Spaces in production)
- **Deployment:** Docker Compose

## Repository structure

```
rabe7/
├── apps/
│   ├── api/          NestJS backend — REST API, versioned, Swagger-documented
│   ├── admin/         Next.js admin dashboard
│   └── mobile/        React Native app (Phase 3 — not started)
├── packages/
│   ├── shared-types/  Shared TypeScript/Zod types (Phase 2+)
│   └── ui/            Shared component library (Phase 2+)
├── infra/
│   └── nginx/          Reverse proxy config
└── docker-compose.yml
```

## Getting started (engineers)

**Prerequisites:** Node 20+, pnpm, Docker.

```bash
cp .env.example .env
pnpm install

# Start Postgres, Redis, MinIO
docker compose up -d postgres redis minio

# Set up the database
pnpm db:migrate
pnpm db:seed

# Run both apps in dev mode
pnpm dev
```

- API: `http://localhost:4000/api/v1`
- API docs (Swagger): `http://localhost:4000/api/docs`
- Admin dashboard: `http://localhost:3000`

### Useful scripts (run from the repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the API and admin app together, with hot reload |
| `pnpm build` | Builds every app for production |
| `pnpm test` | Runs all unit tests |
| `pnpm db:migrate` | Applies database schema changes |
| `pnpm db:seed` | Loads the permission catalog, roles, and a first admin user |
| `pnpm db:studio` | Opens Prisma Studio — a GUI for browsing the database |

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

## Testing

See [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md).

## Security defaults worth knowing about

- Passwords are hashed with Argon2id (not a reversible encryption — nobody, including an
  engineer with database access, can read a user's actual password).
- Every endpoint requires a valid, signed-in session by default. Public endpoints (login,
  password reset) are explicitly opted out with a `@Public()` marker — the safe default is
  "locked," not "open."
- Refresh tokens are stored as one-way hashes and rotate on every use — a leaked database
  backup does not hand out working sessions.
- A customer's credit limit is enforced at order-confirmation time by default (hard block).
  This is a starting policy, not a fixed rule — see the "Decisions I need from you" section
  of the architecture briefing if you'd rather it warn-and-allow-override instead.
