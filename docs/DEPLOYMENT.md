# Deployment

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
