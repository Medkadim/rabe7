# Deployment Guide

Written for someone deploying this for the first time. Every step explains what it does and
why, not just the command to run.

## The short version

This platform ships as four Docker containers (API, admin dashboard, PostgreSQL, Redis) plus
object storage (MinIO or a real S3 bucket) behind an nginx reverse proxy. `docker-compose.yml`
in the repo root already wires all of this together — deploying means running it on a server
instead of your laptop.

We deliberately did **not** reach for Kubernetes. At single-distributor scale — hundreds of
retailers, thousands of orders a day — four containers on one modest server handles the load
comfortably, and costs a fraction of what a Kubernetes cluster (and the specialist needed to
run one) would. Revisit this only if you're signing up many distributors at once.

## 1. Choose a server

Any machine that can run Docker works: a $20–40/month VPS (DigitalOcean, Hetzner, Linode) is
enough for Phase 1 traffic. Minimum recommended: 2 vCPU, 4GB RAM, 40GB disk.

## 2. Get the code onto the server

```bash
git clone <your-repo-url>
cd rabe7
```

## 3. Configure production secrets

```bash
cp .env.example .env
```

Edit `.env` and replace **every** `change-me-in-production` value with a real secret.
Generate strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`:

```bash
openssl rand -base64 48
```

Never commit `.env` to git — it's already excluded via `.gitignore`.

## 4. Point storage at real infrastructure (recommended for production)

MinIO in `docker-compose.yml` is fine for getting started, but for production we recommend
pointing `S3_ENDPOINT`, `S3_ACCESS_KEY`, and `S3_SECRET_KEY` in `.env` at a real bucket
(AWS S3 or DigitalOcean Spaces) so uploaded files (product images, proof-of-delivery photos
in Phase 2) survive a server rebuild. The application code doesn't change either way — this
is exactly the kind of swap the S3-compatible design was chosen to make painless.

## 5. Build and start everything

```bash
docker compose build
docker compose up -d
```

## 6. Set up the database (first deploy only)

```bash
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma db seed
```

`migrate deploy` applies the schema. `db seed` creates the permission catalog, the default
roles, and one Super Admin account so you can log in for the first time — **change that
password immediately** (see README for the seeded credentials).

## 7. Put a domain and HTTPS in front of it

The bundled nginx config proxies port 80 to the right app. For a real domain, the
recommended path is to put [Caddy](https://caddyserver.com) or a managed load balancer in
front of it for automatic HTTPS — a one-line Caddyfile (`yourdomain.com { reverse_proxy
localhost:80 }`) is enough. We didn't bake a specific HTTPS provider into the compose file
because that choice depends on where you host (a cloud load balancer often handles it for
free) — ask when you're ready to pick a domain and we'll wire up whichever fits.

## Ongoing operations

### Deploying a new version

```bash
git pull
docker compose build
docker compose up -d
docker compose exec api pnpm prisma migrate deploy
```

The migration step is safe to run every time — it does nothing if there's nothing new to
apply.

### Backups

The only thing that truly matters is the PostgreSQL data — everything else can be rebuilt
from the code. At minimum:

```bash
docker compose exec postgres pg_dump -U rabe7 rabe7 > backup-$(date +%F).sql
```

Automate this as a daily cron job and copy the resulting file off the server (to S3, or
anywhere durable) — a backup that lives on the same disk as the database doesn't protect you
if that disk fails.

### Logs

```bash
docker compose logs -f api
docker compose logs -f admin
```

### Health checks

`GET /api/v1/health` returns `{"status":"ok","database":"up"}` — point an uptime monitor
(UptimeRobot, Better Stack, or your hosting provider's built-in check) at this URL.

## What's intentionally not here yet

- **Zero-downtime deploys / blue-green rollouts** — not needed at Phase 1 traffic; a few
  seconds of downtime during a deploy is an acceptable tradeoff against the operational
  complexity of avoiding it.
- **Kubernetes / auto-scaling** — see above.
- **A managed CI/CD pipeline** — recommended once there's a team pushing code regularly;
  ask and we'll set up GitHub Actions to build, test, and deploy automatically on every merge.
