# Real Estate Management & Property Listing Platform

A full-stack web app for a real-estate company: a public property marketplace plus secure
portals for agents and administrators. It models the whole workflow, from an agent drafting a
property through admin approval, public discovery, customer inquiry, lead assignment, viewing,
and final sale or rental.

- **Frontend:** React + Vite, JavaScript (no TypeScript), React Router, Tailwind CSS
- **Backend:** Node.js + Express, Prisma ORM, PostgreSQL, MinIO (S3-compatible) for files
- **Auth:** JWT (rotating refresh) + Argon2, role-based access control

Docs:
- [CLAUDE.md](CLAUDE.md) - architecture, conventions, the design system, the build roadmap
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) - running it in production with Docker
- [docs/SECURITY.md](docs/SECURITY.md) - how each security requirement is met

## Quick start

You need [Node.js 20+](https://nodejs.org) and [Docker](https://www.docker.com/).

```bash
# 1. env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. database + object storage
docker compose up -d

# 3. install
npm install

# 4. schema + demo data
npm run db:migrate
npm run db:seed

# 5. run everything (client on :5173, API on :4000)
npm run dev
```

## Demo accounts

The seed script (`npm run db:seed`) creates these accounts. They all share one password.

| Role | Email | Password |
|---|---|---|
| Super admin | `super@demo.realestate` | `Passw0rd!` |
| Administrator | `admin@demo.realestate` | `Passw0rd!` |
| Agent | `agent.lena@demo.realestate` | `Passw0rd!` |
| Agent | `agent.omar@demo.realestate` | `Passw0rd!` |
| Property manager | `manager@demo.realestate` | `Passw0rd!` |
| Customer | `buyer@demo.realestate` | `Passw0rd!` |

These are local demo credentials only. Do not reuse them for any real deployment.

## Testing

```bash
npm run lint                    # both workspaces
npm test --workspace server     # 20 integration tests against a rems_test database
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). In short:

```bash
cp .env.production.example .env.production   # then fill it in
docker compose -f docker-compose.prod.yml up -d --build
```

## Project status

**Complete.** All eight phases of the brief are built: the public marketplace, property
management and the listing-approval workflow, the agent and admin portals, the lead CRM,
property viewings, access-checked documents, PDF brochures and reports, notifications,
saved searches, the audit log, and production hardening (tests, Docker, CI, backups).
Track detail in [CLAUDE.md](CLAUDE.md) section 9. Interactive API docs at `/api/docs`.
