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

`docker-compose.yml` includes `nginx-proxy` + `acme-companion`: together they watch the
other containers, generate the right nginx routing automatically, and request/renew a free
Let's Encrypt certificate for each one — no nginx config to hand-write, no certbot command
to run.

1. **Pick a subdomain for each app** (recommended: `yourdomain.com` → storefront,
   `admin.yourdomain.com` → admin, plus one each for driver and sales).
2. **Add a DNS "A" record for every one of them**, at whichever registrar/DNS host you
   bought the domain from, pointing to this server's public IP address. This can take
   anywhere from a few minutes to a few hours to propagate — you can check with
   `dig +short admin.yourdomain.com` (should print the server's IP once it's live).
3. **Set the `*_DOMAIN` variables and `LETSENCRYPT_EMAIL`** in `.env` (see the commented-out
   examples there), and update `ADMIN_URL`, `STOREFRONT_URL`, `DRIVER_URL`, `SALES_URL`,
   `API_URL`, and `NEXT_PUBLIC_API_URL` to the real `https://` addresses. Also flip
   `COOKIE_SECURE` to `true` — it must be true once the site is served over HTTPS, or
   sign-in silently breaks.
4. **Only after DNS has propagated**, redeploy:
   ```bash
   docker compose up -d
   ```
   `acme-companion` notices the new containers within about a minute and requests each
   certificate automatically. Watch it happen with `docker compose logs -f acme-companion`.
5. Once every app loads over `https://`, the direct `IP:port` addresses (e.g.
   `http://your-server-ip:3000`) still work as a fallback — safe to remove the `ports:`
   line under each app in `docker-compose.yml` later if you want only the domain reachable.

## 8. Push notifications (optional)

Customers can get a push alert whenever a new product or promotion is added — on the
web storefront right away, and in the Android app once it's rebuilt with Firebase set up.
Nothing else breaks if you skip this section.

1. **Create a free Firebase project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Add a Web App** to it (the `</>` icon on the project overview page). Copy its config
   values into `.env` as `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`,
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` (see the
   commented-out examples in `.env.example`). Then, under **Project settings → Cloud
   Messaging → Web Push certificates**, generate one and copy it into
   `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
3. **Generate a service account key**: **Project settings → Service accounts → Generate new
   private key** downloads a JSON file. Copy its `project_id`, `client_email`, and
   `private_key` fields into `.env` as `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` — keep the key's `\n` sequences exactly as written, all on one line,
   wrapped in quotes.
4. **Rebuild storefront and api** so the new values take effect (`NEXT_PUBLIC_*` values are
   baked in at build time, same reason as `NEXT_PUBLIC_API_URL` in section 7):
   ```bash
   docker compose build api storefront
   docker compose up -d
   ```
5. **Android app (optional, only needed for push while the app is fully closed)**: in the
   Firebase console, **Add app → Android**, using package name `com.wasla.customer`. Download
   the `google-services.json` it gives you, then in the GitHub repo go to **Settings → Secrets
   and variables → Actions → New repository secret**, name it
   `GOOGLE_SERVICES_JSON_CUSTOMER`, and paste the entire file's contents as the value. The next
   time the "Build Android APK" workflow runs for the customer app, it picks this up
   automatically and the resulting APK will have push notifications working even when the app
   is fully closed.

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
