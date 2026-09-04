# Render setup - Larkspur Realty (live)

The concrete runbook for the deployed instance. For the general "how it works"
explanation see [DEPLOYMENT.md](./DEPLOYMENT.md); this file is the checklist and
the exact values.

## What is deployed

| Piece | Where | Notes |
|---|---|---|
| Frontend (SPA) | Render **Static Site** `larkspur-web` -> https://larkspur-web.onrender.com | `npm ci && npm run build`, publishes `client/dist`, SPA rewrite to `/index.html` |
| API | Render **Web Service** `larkspur-api` -> https://larkspur-api.onrender.com | Docker (`server/Dockerfile`), start command `sh server/scripts/start.sh` |
| Database | **Neon** free Postgres (external) | Render allows only one free DB per account, so the DB is not in `render.yaml` |
| Object storage | none | `STORAGE_PROVIDER=none`; uploads return 501, demo photos are committed under `client/public/demo/` |

Provisioned from `render.yaml` at the repo root (Render dashboard -> New -> Blueprint).

## Environment variables

### `larkspur-api`

| Key | Value | Set by |
|---|---|---|
| `NODE_ENV` | `production` | blueprint |
| `LOG_LEVEL` | `info` | blueprint |
| `DATABASE_URL` | Neon **direct** connection string (no `-pooler` in the host) | you, manually |
| `JWT_ACCESS_SECRET` | (generated 48-byte hex) | blueprint `generateValue` |
| `JWT_REFRESH_SECRET` | (generated 48-byte hex) | blueprint `generateValue` |
| `ACCESS_TOKEN_TTL` | `15m` | blueprint |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | blueprint |
| `TRUST_PROXY` | `1` | blueprint |
| `COOKIE_SAMESITE` | `none` | blueprint (web + API are different subdomains -> cross-site cookie) |
| `ENABLE_API_DOCS` | `false` | blueprint |
| `CLIENT_ORIGIN` | `https://larkspur-web.onrender.com` | **you, after first deploy** |
| `STORAGE_PROVIDER` | `none` | blueprint |
| `MAPBOX_TOKEN` | empty (or a real token for the map) | blueprint |

### `larkspur-web`

| Key | Value | Set by |
|---|---|---|
| `NODE_VERSION` | `22` | blueprint |
| `VITE_API_BASE_URL` | `https://larkspur-api.onrender.com/api` | **you, after first deploy** |

`VITE_*` vars are read at **build time**, so after setting it you must trigger a
new build of `larkspur-web` (Manual Deploy -> Deploy latest commit).

## First-time setup checklist

1. [ ] Neon: create a project, copy the **direct** connection string.
2. [ ] Render -> New -> Blueprint -> pick `kawsing13/larkspur_realty`.
3. [ ] Set `DATABASE_URL` on `larkspur-api` to the Neon string. Apply.
4. [ ] Wait for the first deploy. `larkspur-api` runs `prisma migrate deploy` on
       boot (via `server/scripts/start.sh`), so the schema is created automatically.
       Check https://larkspur-api.onrender.com/health/db -> `{"status":"ok"}`.
5. [ ] Seed the database from your machine (Render's free plan has no Shell):
       ```powershell
       cd server
       $env:DATABASE_URL = "<neon direct string>"
       node prisma/seed.js            # full demo: 25 listings + demo users
       Remove-Item Env:DATABASE_URL
       ```
       Or roles + your own admin only:
       ```powershell
       node prisma/scripts/seed-rbac.js
       node prisma/scripts/create-admin.js you@email.com "a strong password" First Last
       ```
6. [ ] Set `CLIENT_ORIGIN` on `larkspur-api` = `https://larkspur-web.onrender.com`.
       (API redeploys itself.)
7. [ ] Set `VITE_API_BASE_URL` on `larkspur-web` = `https://larkspur-api.onrender.com/api`.
8. [ ] Manual Deploy `larkspur-web` so Vite bakes the API URL in.
9. [ ] Open https://larkspur-web.onrender.com, log in.

Demo logins after `node prisma/seed.js` (all password `Passw0rd!`):
`admin@demo.realestate`, `super@demo.realestate`, `agent.lena@demo.realestate`,
`agent.omar@demo.realestate`, `manager@demo.realestate`, `buyer@demo.realestate`.

## Updating the app

Push to `main` on GitHub. Render auto-deploys both services. Migrations run
automatically on the API's next boot (`prisma migrate deploy` is a no-op when
nothing is pending).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Listings don't load, network tab shows 404 on `/api/...` | `VITE_API_BASE_URL` not set, or `larkspur-web` not rebuilt after setting it |
| Login fails with a CORS error | `CLIENT_ORIGIN` on the API doesn't exactly match the web origin (no trailing slash) |
| Login succeeds then immediately logs out | `COOKIE_SAMESITE` not `none`, so the refresh cookie is dropped cross-site |
| API deploy exits 127 | start command must be `sh server/scripts/start.sh` (Render's `dockerCommand` is not shell-evaluated, so `a && b` fails) |
| API deploy fails at migrate | `DATABASE_URL` missing/wrong, or pointed at the Neon **pooled** URL instead of the direct one |
| First request after idle is slow | expected: Neon compute suspends after ~5 min, Render free web service sleeps after 15 min |
| "Uploads disabled" / 501 on adding a photo | expected with `STORAGE_PROVIDER=none`; see "Enabling file uploads" in DEPLOYMENT.md |

## Security notes

- Rotate the Neon password if it was ever shared in plain text (Neon console ->
  Roles -> reset), then update `DATABASE_URL` in Render.
- The `node prisma/seed.js` demo accounts use a known password. Delete or rotate
  them if this ever stops being a demo.
- `.env` files are git-ignored; real secrets live only in Render / Neon.
