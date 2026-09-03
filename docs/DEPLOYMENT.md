# Deployment

Two supported targets:

- **Render** (managed, no servers to run) - see "Deploying to Render" below. Uses `render.yaml`.
- **Docker Compose** (one box you control) - the rest of this document.

---

## Deploying to Render

Render hosts the API and the database; object storage goes to **Cloudflare R2** (Render
has no S3). `render.yaml` in the repo root is a blueprint that provisions everything.

### 1. Cloudflare R2 (object storage)

1. Cloudflare dashboard -> R2 -> create two buckets: `larkspur-media` and `larkspur-docs`.
2. On `larkspur-media` -> Settings -> **Public Development URL** -> enable. Copy the
   `https://pub-xxxx.r2.dev` URL. Leave `larkspur-docs` private (documents are only ever
   served through the access-checked `/api/documents/:id/download` route).
3. R2 -> Manage R2 API Tokens -> create a token with **Object Read & Write** on both
   buckets. Note the Access Key ID, Secret Access Key, and your account's S3 endpoint
   `https://<accountid>.r2.cloudflarestorage.com`.

### 2. Render blueprint

1. Push this repo to GitHub (already done: `origin/main`).
2. Render dashboard -> **New -> Blueprint** -> connect the repo. Render reads `render.yaml`
   and shows `larkspur-db`, `larkspur-api`, `larkspur-web`.
3. Fill the prompted values:

   | Service | Key | Value |
   |---|---|---|
   | larkspur-api | `STORAGE_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
   | larkspur-api | `STORAGE_ACCESS_KEY` | R2 token Access Key ID |
   | larkspur-api | `STORAGE_SECRET_KEY` | R2 token Secret Access Key |
   | larkspur-api | `STORAGE_PUBLIC_URL` | the `https://pub-xxxx.r2.dev` URL |
   | larkspur-api | `CLIENT_ORIGIN` | leave blank for now (step 4) |
   | larkspur-api | `MAPBOX_TOKEN` | blank, or a real token |
   | larkspur-web | `VITE_API_BASE_URL` | leave blank for now (step 4) |

   `DATABASE_URL` and both JWT secrets are wired / generated automatically.
4. Apply. The first deploy gives each service its URL
   (`https://larkspur-api.onrender.com`, `https://larkspur-web.onrender.com`). Now set the
   two cross-references and redeploy:
   - `larkspur-api` -> `CLIENT_ORIGIN` = `https://larkspur-web.onrender.com`
   - `larkspur-web` -> `VITE_API_BASE_URL` = `https://larkspur-api.onrender.com/api`
     (the web service must **rebuild** for Vite to pick this up).

### 3. Seed roles and the first admin

Migrations run on every deploy (see `dockerCommand` in `render.yaml`). Roles/permissions
and the first administrator are a one-time manual step - open **larkspur-api -> Shell**:

```bash
node server/prisma/scripts/seed-rbac.js
node server/prisma/scripts/create-admin.js admin@your-domain.example "a strong password" Ada Lovelace
```

Do **not** run `npm run db:seed` - that is demo data with known passwords.

### Notes

- Free Postgres is deleted after 30 days. Change `plan: free` to `basic-256mb` (or higher)
  in `render.yaml` for anything real, and take backups (Render does automated ones on paid
  plans).
- Free web services sleep after 15 minutes idle; the first request after that is slow.
- Rate limiting is in-memory, which is fine on a single instance. If you scale
  `larkspur-api` past one instance, move the limiter to Redis (Upstash) first.
- `STORAGE_PUBLIC_URL` is baked into each image row's `url` at upload time, so set it
  correctly *before* uploading property photos.

---

## Deploying with Docker Compose

The stack is three long-running containers plus a one-shot migration job, wired by
`docker-compose.prod.yml`:

| Service | Image | Role |
|---|---|---|
| `web` | built from `client/Dockerfile` (nginx) | serves the built SPA, proxies `/api` to `server` |
| `server` | built from `server/Dockerfile` (Node 22) | the Express API |
| `db` | `postgres:16-alpine` | database |
| `storage` | `minio/minio` | S3-compatible object store for images and documents |
| `migrate` | same as `server` | runs `prisma migrate deploy` once, then exits |

## First deploy

```bash
# 1. Configuration
cp .env.production.example .env.production
# edit .env.production: set strong POSTGRES_PASSWORD, both JWT secrets (64 hex chars each),
# STORAGE_SECRET_KEY, CLIENT_ORIGIN, STORAGE_PUBLIC_URL, and TRUST_PROXY.

# 2. Build and start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Seed roles and permissions (no demo data), then create the first administrator
#    (there is no public sign-up for staff)
docker compose -f docker-compose.prod.yml exec server \
  node server/prisma/scripts/seed-rbac.js
docker compose -f docker-compose.prod.yml exec server \
  node server/prisma/scripts/create-admin.js admin@your-domain.example "A strong password" "Ada" "Lovelace"
```

The administrator can then create agent accounts from the admin portal.

`migrate` runs automatically before `server` starts and applies any pending migrations.
Do **not** run `npm run db:seed` in production - it creates demo accounts with a known
password (the seed refuses unless `--force`).

## TLS

Put a TLS-terminating reverse proxy in front of `web` (Caddy, Traefik, or a cloud load
balancer). Point it at `web:80`. Set `TRUST_PROXY` in `.env.production` to the number of
proxies in the chain (nginx counts as 1, so a single external LB makes it `2`).

If the browser app and the API are served from **different registrable domains**, set
`COOKIE_SAMESITE=none` (the refresh cookie is `secure` automatically in production).

## Object storage

The `storage` container is fine for a single box. For anything larger, point the
`STORAGE_*` variables at a managed S3 (AWS S3, Cloudflare R2, Backblaze B2) and drop the
`storage` service. Set `STORAGE_PUBLIC_URL` to the public (CDN) URL for the media bucket;
the documents bucket stays private and is only ever read through
`GET /api/documents/:id/download`.

## Upgrades

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build   # migrate job runs, then server restarts
```

Migrations are forward-only (`prisma migrate deploy`); it never drops data.

## Backups

```bash
COMPOSE_FILE=docker-compose.prod.yml ./scripts/backup.sh      # -> backups/<timestamp>/
COMPOSE_FILE=docker-compose.prod.yml ./scripts/restore.sh <timestamp>
```

Run `backup.sh` from cron (hourly DB, daily storage is a reasonable start), copy the
`backups/` directory off the box, and **test a restore** on a throwaway environment every
so often - an untested backup is not a backup.

## Monitoring

- `GET /health` - liveness (no DB touch).
- `GET /health/db` - readiness (runs `SELECT 1`); wire this to your load balancer.
- The server logs JSON to stdout in production (pino). Ship it to your log store; each
  request line carries a `reqId`.
