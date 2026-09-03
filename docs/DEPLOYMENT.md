# Deployment

Two supported targets:

- **Render** (managed, no servers to run) - see "Deploying to Render" below. Uses `render.yaml`.
- **Docker Compose** (one box you control) - the rest of this document.

---

## Deploying to Render

`render.yaml` in the repo root is a blueprint that provisions the whole stack:
`larkspur-db` (Postgres), `larkspur-api` (the Express API, from `server/Dockerfile`), and
`larkspur-web` (the built SPA, static).

**No object storage.** Render has no S3, so this deploy runs with `STORAGE_PROVIDER=none`:
the public marketplace works from the seeded demo photos (committed under
`client/public/demo/`), and the agent "upload photo" and property-document endpoints
return `501`. To turn on real uploads, see "Enabling file uploads" below.

### 1. Blueprint

1. Push this repo to GitHub (done: `origin/main`).
2. Render dashboard -> **New -> Blueprint** -> connect the repo. Render reads `render.yaml`
   and shows the three resources. `DATABASE_URL` and both JWT secrets are wired / generated
   automatically; leave `CLIENT_ORIGIN`, `VITE_API_BASE_URL`, and `MAPBOX_TOKEN` blank.
3. Apply. The first deploy gives each service its URL, e.g.
   `https://larkspur-api.onrender.com` and `https://larkspur-web.onrender.com`.
4. Set the two cross-references, then redeploy:
   - `larkspur-api` -> `CLIENT_ORIGIN` = `https://larkspur-web.onrender.com`
   - `larkspur-web` -> `VITE_API_BASE_URL` = `https://larkspur-api.onrender.com/api`
     (the web service must **rebuild** for Vite to bake this in).

### 2. Seed roles and the first admin

Migrations run on every deploy (see `dockerCommand` in `render.yaml`). Roles/permissions
and the first administrator are a one-time manual step - open **larkspur-api -> Shell**:

```bash
node server/prisma/scripts/seed-rbac.js
node server/prisma/scripts/create-admin.js admin@your-domain.example "a strong password" Ada Lovelace
```

For a populated demo (25 listings with photos, known passwords - not for real use):

```bash
npm run db:seed --workspace server
```

### Enabling file uploads (optional)

Point the app at any S3-compatible bucket provider (Cloudflare R2, AWS S3, Backblaze B2):

1. Create two buckets, e.g. `larkspur-media` (public) and `larkspur-docs` (private).
   R2: enable the media bucket's **Public Development URL** and copy it.
2. Create an API token / access key with read+write on both.
3. On `larkspur-api`, set: `STORAGE_PROVIDER=s3`, `STORAGE_REGION=auto` (R2) or the real
   region, `STORAGE_BUCKET`, `STORAGE_DOCS_BUCKET`, `STORAGE_ENDPOINT`
   (`https://<accountid>.r2.cloudflarestorage.com` for R2), `STORAGE_ACCESS_KEY`,
   `STORAGE_SECRET_KEY`, and `STORAGE_PUBLIC_URL` (the media bucket's public URL - it is
   baked into each image row at upload time, so set it correctly before uploading).

### Notes

- Free Postgres is deleted after 30 days. Change `plan: free` to `basic-256mb` (or higher)
  in `render.yaml` for anything real, and take backups (automated on paid plans).
- Free web services sleep after 15 minutes idle; the first request after that is slow.
- Rate limiting is in-memory, which is fine on a single instance. If you scale
  `larkspur-api` past one instance, move the limiter to Redis (Upstash) first.
- The brochure PDF omits the cover photo when `STORAGE_PROVIDER=none` (the demo photos
  are served by the web app, and the API only fetches cover images from its own storage).

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
