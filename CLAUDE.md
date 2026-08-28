# CLAUDE.md

Guidance for working in this repository. Read this first.

---

## 1. What we are building

This is the *Real Estate Management & Property Listing Platform* — a production-oriented
web app for a real-estate company. It has two faces:

1. **Public marketplace** — search, filter, and browse property listings; view a listing;
   save favorites; submit an inquiry; request a viewing.
2. **Staff portals** — agents manage their listings and leads; administrators approve
   listings, assign leads, run reports, and read the audit trail.

It models the **whole business workflow**, not just property CRUD:

```
agent creates property -> submits listing -> admin reviews -> listing approved
-> published -> customer searches -> views details -> submits inquiry
-> lead created -> lead assigned to agent -> follow-up -> viewing -> negotiation -> sold / rented
```

Starts as a single company. The data model already carries an `Organization` (branch) so it
can grow into multi-branch or multi-tenant later without a rewrite.

---

## 2. Tech stack (fixed by the project brief)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React 18 + Vite**, JavaScript (ES2022) | **No TypeScript.** All files are `.js` / `.jsx`. |
| Routing | **React Router v6** | Public routes + protected portal routes. |
| Frontend state | **React Context + hooks** | Small focused contexts (`AuthContext`, `ToastContext`) + a `useApi` fetching hook. No Redux. |
| API client | **Axios** | One configured instance in `client/src/lib/apiClient.js`. |
| Styling | **Tailwind CSS v3.4 + CSS variables** | Design tokens are CSS variables; Tailwind reads them. |
| Backend | **Node.js + Express 4** | REST API. |
| ORM | **Prisma** | Schema in `server/prisma/schema.prisma`. Migrations checked in. |
| Database | **PostgreSQL 16** | Runs locally via Docker Compose. |
| Auth | **JWT** (access + refresh) + **Argon2** password hashing | |
| Authorization | **RBAC** enforced in Express middleware | Never trust the client. |
| Validation | **Zod** | One schema per route, validated in middleware before the controller runs. |
| File storage | **S3-compatible** (MinIO locally via Docker) | Property images and documents. Documents are served through an access-checked endpoint, never a public URL. |
| Maps | **Mapbox GL** (token via env) | Falls back to a static address block when no token is set. |
| PDF | **PDFKit** | Brochures and reports. |
| API docs | **Swagger UI** at `/api/docs` | Generated from per-route definitions. |
| Deploy | **Docker** | `docker-compose.yml` for local; Dockerfiles per service for prod. |

---

## 3. Repository layout

```
.
├── CLAUDE.md                  <- you are here
├── README.md                  <- quick start for a human
├── docker-compose.yml         <- postgres + minio for local dev
├── package.json               <- root scripts only (runs client + server together)
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       <- all database tables live here
│   │   ├── seed.js             <- roles, permissions, demo users, demo listings
│   │   └── migrations/
│   ├── src/
│   │   ├── server.js           <- starts the HTTP server
│   │   ├── app.js              <- builds the Express app (middleware + routes)
│   │   ├── config/             <- env loading, Prisma client singleton
│   │   ├── lib/                <- small helpers: ApiError, asyncHandler, password, tokens
│   │   ├── middleware/         <- authenticate, authorize, validate, errorHandler, notFound
│   │   ├── modules/            <- one folder per API resource (see section 5)
│   │   ├── routes/index.js     <- mounts every module router under /api
│   │   └── docs/swagger.js
│   └── package.json
│
└── client/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css           <- design tokens + Tailwind layers
    │   ├── lib/apiClient.js
    │   ├── context/            <- AuthContext, ToastContext
    │   ├── hooks/              <- useApi, useAuth, useDebouncedValue
    │   ├── components/
    │   │   ├── ui/             <- Button, Input, Field, Badge, Card, Table, Modal, Spinner, EmptyState
    │   │   └── layout/         <- PublicHeader, PublicFooter, PortalShell, ProtectedRoute
    │   ├── pages/
    │   │   ├── public/         <- Home, Search, PropertyDetail, Login, Register
    │   │   ├── agent/
    │   │   └── admin/
    │   └── routes/AppRoutes.jsx
    └── package.json
```

---

## 4. Running it

```bash
# 1. one-time: copy env files
cp server/.env.example server/.env
cp client/.env.example client/.env

# 2. start postgres + minio
docker compose up -d

# 3. install deps (root installs both workspaces)
npm install

# 4. create the database schema and load demo data
npm run db:migrate
npm run db:seed

# 5. run client (5173) + server (4000) together
npm run dev
```

Other scripts (run from repo root):

| Script | Does |
|---|---|
| `npm run dev` | client + server with reload |
| `npm run db:migrate` | apply Prisma migrations to the dev DB |
| `npm run db:reset` | drop, re-migrate, re-seed (destroys local data) |
| `npm run db:studio` | open Prisma Studio to browse data |
| `npm run db:seed` | (re-)load demo data |
| `npm run lint` | ESLint on both workspaces |
| `npm run test` | run server + client tests |

Demo logins are printed at the end of `npm run db:seed`.

---

## 5. Backend conventions

### 5.1 Module shape

Every API resource is a folder in `server/src/modules/<name>/` with up to four files:

```
<name>.routes.js        Express router. Wires paths -> middleware -> controller. No logic.
<name>.controller.js    Reads req, calls the service, shapes the HTTP response. No DB calls.
<name>.service.js       Business logic + Prisma queries. Throws ApiError on failure. No req/res.
<name>.validation.js    Zod schemas for body / params / query.
```

This split keeps each file small and makes bugs easy to locate: routing bug -> routes file,
wrong status code -> controller, wrong data -> service.

Modules: `auth`, `users`, `agents`, `properties`, `listings`, `search`, `inquiries`,
`appointments`, `favorites`, `savedSearches`, `notifications`, `reports`, `auditLogs`.

### 5.2 Errors

- Throw `new ApiError(statusCode, message, details?)` anywhere. Never `res.status(...).send` an error by hand.
- `asyncHandler(fn)` wraps every async controller so rejected promises reach the error middleware.
- The error middleware is the **only** place that formats an error response:
  `{ error: { message, code, details? } }`.
- Prisma known errors (unique constraint, not found) are translated to clean 409 / 404 there.

### 5.3 Auth & RBAC

- `authenticate` verifies the access token and sets
  `req.user = { id, email, roles, permissions, agentId, customerId, organizationId }`
  (`agentId` etc. are null unless the user is that kind of account).
- `authorize('permission:key')` (or `authorize.role('AGENT')`) gates a route. Checks happen
  **server-side on every protected operation** — the frontend hiding a button is not security.
- Route-level `authorize()` checks the permission; row-level ownership (an agent may only
  touch their own properties) is checked in the service, not the route.
- Access token lifetime 15m, refresh token 7d (httpOnly cookie). Refresh rotates and is NOT
  under the strict auth rate limiter (it is cookie-gated, and every page load calls it).
- Passwords hashed with Argon2id (`@node-rs/argon2`). Never logged, never returned.

### 5.4 Validation

- `validate(schema)` middleware runs before the controller. It parses `req.body`, `req.query`,
  `req.params` and replaces them with the typed result, or throws a 422 with field errors.
- Validate **everything** from the client, including query params, route params, and uploads.

### 5.5 Database

- All queries go through Prisma. No raw SQL unless there is a measured reason, and then it is
  parameterized and commented.
- Money is `Decimal`, never `Float`.
- Every table has `createdAt` / `updatedAt`. Soft states use a `status` enum, not deletion,
  for anything a human might need back (properties, listings, inquiries).
- Index the columns the search endpoint filters and sorts on (see schema comments).
- Wrap multi-write operations in `prisma.$transaction`.

### 5.6 Audit log

Write an `AuditLog` row for: listing approvals/rejections/publish/unpublish, account
create/suspend/role-change, lead assignments, and price/status changes on a property.
Use the `writeAudit(...)` helper so the shape stays consistent.

### 5.7 Security checklist (from the brief — keep it green)

- [ ] Argon2/bcrypt password hashing, never plain text
- [ ] auth + authorization checked on the backend for every protected route
- [ ] every body / query / param / file validated
- [ ] Prisma (parameterized) for all queries
- [ ] rate limiting on `/api/auth/*` and public `/api/inquiries`
- [ ] private documents behind an access check, no guessable URLs
- [ ] secrets only in env vars, `.env` git-ignored
- [ ] audit log for approvals, account changes, lead assignments, property changes
- [ ] HTTPS in production, `helmet` on, CORS locked to the known frontend origin

---

## 6. Frontend conventions

### 6.1 Data fetching

- One Axios instance (`lib/apiClient.js`) with a base URL and an interceptor that attaches the
  access token and retries once through `/api/auth/refresh` on a 401.
- Components fetch through the `useApi` hook, which returns `{ data, error, loading, refetch }`
  and always renders **loading / empty / error** states — not just the success case.
- No global data cache library. If we outgrow `useApi`, revisit then.

### 6.2 Routing & guards

- `AppRoutes.jsx` declares three groups: public, agent (`ProtectedRoute roles={['AGENT','ADMINISTRATOR','SUPER_ADMIN']}`),
  admin (`ProtectedRoute roles={['ADMINISTRATOR','SUPER_ADMIN']}`).
- `ProtectedRoute` redirects unauthenticated users to `/login?next=<path>` and shows a
  "not allowed" page for authenticated users missing the role.

### 6.3 Components

- `components/ui/` is the shared kit. Same components on the public site and in the portals;
  portals pass `density="compact"` where tables get tight.
- Keep components presentational. Data and effects live in pages and hooks.
- Icons: **@phosphor-icons/react** only, `weight="regular"`, size 20 default. No hand-drawn SVG icons.

---

## 7. Design system — "Larkspur"

The identity is a **light editorial marketplace**: an airy near-white page with a faint warm
tint, a Newsreader serif for anything that speaks (headlines, listing titles, prices),
photography that leads every card, and a fresh garden-green accent that carries the brand. It
reads bright and open, a considered agency and not a spreadsheet. Renamed from "Harborline"
and lightened in the Aug 2026 pass (the earlier stone palette read as dim). The older
"Plat / land-survey" look (cool grey, mono figure tables, plot-line rules) is long retired —
a mono `plot-rule` helper still exists in `index.css` for incidental hairlines only.

### 7.1 Tokens (defined in `client/src/index.css`, both light and dark)

```
--paper        252 251 249   page background (warm white, barely tinted — stays light)
--paper-2      246 243 237   alternating sections, footer, image wells, insets (gentle step)
--surface      255 255 255   cards, inputs
--ink          26 23 20      primary text (deep warm near-black, crisp contrast)
--ink-soft     92 84 75      secondary text, captions (readable, not washed out)
--line         233 228 219   hairlines, borders
--accent       19 122 84     garden green — links, primary buttons, active state, brand
--accent-press 14 94 63      hover / pressed
--gold         188 129 58    sparingly: "For rent" badge, small brand flourishes
--danger       190 54 44     destructive actions, error text
--shadow       28 24 18      the tint for warm shadows (never pure black)

dark mode: warm charcoal, not blue-black
--paper 24 22 18  --paper-2 32 29 24  --surface 38 34 28  --ink 244 240 232
--ink-soft 178 168 152  --line 58 53 44  --accent 96 196 150  --gold 220 170 100
```

Tokens are `R G B` triplets so Tailwind opacity modifiers work (`bg-accent/10`, `bg-gold/12`).

Rules:
- **One accent, whole app.** Green is the brand; gold is a rare second, never a CTA.
- **Keep it light.** `--paper` is near-white on purpose; don't reach for `bg-paper-2` as a
  large fill just for contrast — use whitespace and a soft `warm-shadow` on cards instead.
- **Radius:** `--r-sm 6px` (inputs, badges), `--r-md 12px` (cards, buttons), `lg 16px` (hero
  media, feature panels). Bump up, not down.
- **Warm shadows only:** `.warm-shadow` / `.warm-shadow-lg` in `index.css`, tinted to `--shadow`.
  Used for card hover-lift and floating brand chips. No pure-black drop shadows.
- Alternate `bg-paper` and `bg-paper-2` between full-width sections for a subtle rhythm.
- Dark mode follows `prefers-color-scheme` plus the header toggle.

### 7.2 Type

| Role | Font | Use |
|---|---|---|
| Display | **Newsreader** (400/500, 400-italic) | page titles, listing titles, **prices**, section heads |
| Body | **IBM Plex Sans** (400/500/600) | paragraphs, labels, nav, buttons, stat pills |
| Mono | **IBM Plex Mono** (400/500) | reference numbers, the brand eyebrow, small metadata only |

Self-hosted via `@fontsource/*`. `h1` is Newsreader 400; `h2`–`h4` are 500. Emphasis inside a
heading is weight, never a swapped-in family. Figures (beds/baths/area) are **plain sans now**,
not mono — mono is reserved for reference codes and the `LARKSPUR REALTY` eyebrow.

### 7.3 The signature: the listing card (`PropertyCard.jsx`)

Photography-led, light, hover-lifts. No figure table.

```
┌───────────────────────────────┐
│  [cover image, 4:3]  ♥        │   <- FavoriteButton top-right
│  ‹For sale›                    │   <- pill, top-left, surface/95
├───────────────────────────────┤
│  $845,000                     │   <- IBM Plex Sans 600, the loudest line
│  Maple Ridge townhouse        │   <- Newsreader, warm
│  ◦ Maple Ridge, Bellevue, WA  │   <- ink-soft + pin
│  3 bd · 2 ba · 1,808 sq ft    │   <- sans, dot-separated; "Studio" when 0 bd
│  RE-2026-0101                 │   <- quiet mono, 11px, at the foot
└───────────────────────────────┘
```

Whole card is one `<Link>`; hover raises it (`-translate-y-0.5` + `warm-shadow-lg`) and eases
the image to `scale-1.04`. `PropertyCardSkeleton.jsx` mirrors this shape.

### 7.4 Branding presence

Larkspur is named on every listing surface, so a listing always looks "presented by" someone:
- Public header / footer / portal header: `Logo.jsx` (green rounded glyph — a larkspur sprig —
  plus the Newsreader wordmark). Same mark in `client/public/favicon.svg`.
- Listing detail: `LARKSPUR REALTY · RE-2026-0119` mono eyebrow above the title; the inquiry
  card is headed `PRESENTED BY LARKSPUR REALTY`.
- Public agent page: same mono eyebrow above the agent's name.
This brand eyebrow is deliberate attribution and is the **one** allowed exception to "no eyebrow
labels" below.

### 7.5 Pagination

Every list view is paginated with the shared `Pagination.jsx` (prev / 5 numbers / next).
- Public/search: `?page=` on the URL, `PAGE_SIZE 12`.
- Portal + admin tables: `usePageParam(filterKey)` hook — keeps `?page=` on the URL, resets to
  page 1 when `filterKey` (the active search/status/scope string) changes. `pageSize` 20–25.
- Backend: `page` is in every list `*.validation.js`; services use `parsePagination` /
  `paginated` from `server/src/lib/pagination.js` and return `{ data, page, pageSize, total,
  totalPages }`. `MAX_PAGE_SIZE 100`.
- `<Pagination>` renders nothing when `totalPages <= 1`.

### 7.6 Motion (`MOTION_INTENSITY 3`)

- CSS transitions only: hover, focus, `:active`, the card lift, a slow image zoom on card hover.
- One content fade-in-up (160ms) on route change (`.route-enter`).
- Everything gated by `@media (prefers-reduced-motion: no-preference)` / `motion-reduce:`.
- No scroll-triggered animation, no parallax, no marquee, no JS animation library.

### 7.7 Hard "don't" list (from the design skills, trimmed to what applies here)

- No em-dash (`—`) or en-dash (`–`) anywhere a user can see it. Hyphen or a full stop.
- No eyebrow label above every section — the `LARKSPUR REALTY` brand eyebrow (§7.4) is the
  only one, and it is attribution, not a section kicker.
- No section-number labels (`01 / Search`), no scroll cues, no logo wall in a hero. The hero's
  three-item trust strip is an inline icon+label row (not cards) and is the ceiling for that.
- No fake screenshots built from `<div>`s. Real images
  (`https://picsum.photos/seed/<slug>/<w>/<h>` as placeholder).
- No three-equal-cards feature row. Use asymmetric or 2-column.
- Placeholder names must be realistic and varied, not "John Doe" / "Acme Realty".
- Every button label fits one line, passes 4.5:1 contrast, and one intent has one label
  ("Request a viewing" everywhere, not also "Book a tour").

---

## 8. Code style — the brief asked for this explicitly

> "make the code easy to debug, understandable, put important comments, and not a complicated system"

So:

- **Small files, one job each.** If a file does two things, split it.
- **Comment the *why*, not the *what*.** A comment earns its place by explaining a decision,
  a workflow rule, a gotcha, or a security reason. Skip comments that restate the code.
- **Boring is good.** Prefer a plain loop or an `if` to a clever one-liner. Prefer an obvious
  data shape to a normalized-but-confusing one.
- **No premature abstraction.** Two similar things can stay two things. Extract on the third.
- **Fail loud in dev.** Validate inputs, throw `ApiError` with a clear message, log enough
  context to reproduce.
- **Name things for the domain.** `listing.status`, `inquiry.followUpDate`, `assignLead()` —
  a reader who knows real estate should recognize the vocabulary.
- **Consistent shapes.** Every list endpoint returns `{ data: [...], page, pageSize, total }`.
  Every error returns `{ error: { message, code } }`.

---

## 9. Roadmap and status

Phases follow the brief. Update the checkboxes as work lands.

- [x] **Phase 1 — Foundation:** repo, Docker DB, full Prisma schema, Express app, JWT auth,
      RBAC, env config, health checks, Swagger, frontend scaffold + design system + auth pages,
      admin Users page (list / suspend / reactivate + audit), and a read-only public
      `GET /api/properties` + `GET /api/properties/:key` as the end-to-end vertical slice
      (home page, search list, listing detail). Property **writes** land in Phase 2.
- [x] **Phase 2 — Property Management:** staff property CRUD (`/api/properties/manage`,
      `POST/PATCH /api/properties`), location + amenities endpoints, image upload to MinIO
      (bucket auto-created public-read on boot), `PATCH /:id/status` (admin publish /
      unpublish / archive) writing `ListingStatusHistory`, ownership enforced in the
      service (agent = own only, admin/manager = all, manager read-only). `/api/property-types`
      + `/api/amenities` catalog. Agent + admin portal screens: properties list, create,
      and a tabbed editor (Details / Location / Photos / Amenities). JWT now carries
      `agentId` / `customerId` / `organizationId`.
- [x] **Phase 3 — Public Marketplace:** `GET /api/search` (keyword, city, type, price,
      beds/baths, area, amenities-all-of, 5 sorts, pagination - rides the schema btree
      indexes; keyword is ILIKE, add a pg_trgm GIN index if the catalog gets large) +
      `GET /api/search/facets` (cities, price range). `GET /api/favorites` + `/ids` +
      `POST` + `DELETE /:propertyId` for signed-in customers. `getPublishedByKey` now
      returns a `similar` array. Frontend: filter panel (URL-synced, shareable), pagination,
      favorite hearts on every card (`FavoritesContext`, optimistic), `/favorites` page,
      OpenStreetMap embed on the listing page (no key needed; swap for Mapbox in prod),
      "Similar listings" section.
- [x] **Phase 4 — Agent Portal & listing approval:** `POST /api/listings/:id/:action`
      (submit / withdraw / approve / request-changes / unpublish / republish / close /
      archive / restore) - one route, an `ACTIONS` config that says which role may run
      which action from which status, each transition written to `ListingStatusHistory`
      and mirrored onto `Property.status` in a transaction + an audit row.
      `GET /api/listings` (review queue). `agents` module: directory, `GET/PATCH /agents/me`,
      admin `GET/PATCH /agents/:id`, `POST /agents` (create with temp password),
      `GET /agents/:id/public` (public profile + live listings). `POST /api/auth/change-password`.
      Removed `PATCH /api/properties/:id/status` and `/archive` - status now flows through
      listings only. JWT `publicUser` gained `agentId`. Migration `listing_actor_relations`
      added FK relations for the "who did this" fields. Frontend: editor "Review" tab
      (`WorkflowActions` + `StatusTimeline`), `?tab=review` deep link, changes-requested
      banner, `/admin/review` queue, `/admin/agents` + detail + create modal,
      `/agent/profile`, public `/agents/:id` page.
- [x] **Phase 5 — Lead CRM:** `POST /api/inquiries` (public, rate-limited, `optionalAuth`,
      auto-assigns to the listing agent + writes a `LeadAssignment` + a notification).
      `GET /api/inquiries` (agent: own / on-my-properties; admin/manager: all; filters incl.
      `followUpDue`), `GET /:id` (detail + timeline), `PATCH /:id` (status + follow-up date),
      `POST /:id/notes`, `POST /:id/assign` (permission `inquiry:assign`). `GET /api/inquiries/mine`
      for customers. `InquiryNote` gained a `kind` (NOTE / STATUS_CHANGE / ASSIGNMENT) so it
      doubles as the interaction timeline; status changes and assignments auto-write entries.
      Write access follows the assignment; the listing agent can read leads on their property.
      `lib/notifications.js` helper (rows only; list/read endpoints are Phase 7).
      Frontend: `InquiryForm` on the listing page, `LeadPipeline` stepper, `LeadTimeline`,
      `/agent/leads` + `/admin/leads` lists, shared `LeadDetailPage`, `AssignAgentModal`,
      customer `/my-inquiries`. Migration: `inquiry_note_kind`.
- [x] **Phase 6 — Appointments / viewings:** `POST /api/appointments` (public request, rate-
      limited; a staff member passing an `inquiryId` they handle gets a CONFIRMED slot).
      `GET /api/appointments` (staff schedule; `upcoming`, `status`, date-range filters),
      `GET /:id`, `GET /api/appointments/mine` (customer). `POST /api/appointments/:id/:action`
      (confirm / reschedule / cancel / complete / no-show) via an `ACTIONS` config; staff-only
      vs staff-or-owning-customer per action. A linked lead gets timeline notes and its stage
      advances (confirm -> VIEWING_SCHEDULED, complete -> NEGOTIATION), never backward.
      Frontend: `ViewingFormModal` (request from a listing + schedule from a lead),
      `AppointmentActions` with a time-picker modal, `/agent/appointments` + `/admin/appointments`
      grouped by day, shared `AppointmentDetailPage`, customer `/my-viewings`. No migration
      (the `Appointment` table was already in the schema). "Agent availability" as a structured
      calendar is deferred; the confirm/reschedule flow covers the need.
- [x] **Phase 7 — Documents & Reports:** `PropertyDocument` store in a **private** MinIO
      bucket (`rems-docs`, no public policy); `GET /api/documents/:id/download` streams the
      file through a visibility check (`PUBLIC` / `AGENTS` / `PRIVATE`), never a guessable URL.
      `GET /api/properties/:key/brochure.pdf` (PDFKit, fetches the cover image). `GET /api/reports/overview`
      + `/agents` + `/summary.pdf` (admin). `GET/POST /api/notifications` + read / read-all
      (rows written since Phase 5). `GET/POST/PATCH/DELETE /api/saved-searches` (customer);
      `buildSearchWhere` is shared so matching == live search; on listing publish,
      `notifyForNewListing` writes a `SAVED_SEARCH_MATCH` notification. `GET /api/audit-logs`
      (admin). Frontend: editor "Documents" tab, `NotificationBell` in both headers,
      `/admin/reports`, `/admin/audit`, `/saved-searches`, "Save this search" on the search
      page, public brochure + document links on the listing page. `stubRouter` removed - every
      brief module is live.
- [x] **Phase 8 — Production hardening:** integration test suite (20 tests) against a
      `rems_test` database (`npm test --workspace server`, which resets + seeds it first);
      structured logging with pino + `pino-http` (request ids, secret redaction); `helmet`
      tuned for a JSON API + a strict CSP in `client/nginx.conf`; refresh-token reuse
      detection (revokes the whole session family); `COOKIE_SAMESITE` / `TRUST_PROXY` /
      `ENABLE_API_DOCS` env knobs; the server refuses to boot in prod with example JWT
      secrets; SSRF guard + timeout on the brochure image fetch; DB indexes added
      (`Inquiry`, `Appointment`, `Property.createdById`) via migration `hardening_indexes`;
      graceful shutdown + `uncaughtException`/`unhandledRejection` handlers; `server/Dockerfile`
      + `client/Dockerfile` (nginx) + `docker-compose.prod.yml` + `.env.production.example`;
      `prisma/scripts/seed-rbac.js` and `create-admin.js` for prod bootstrap;
      `scripts/backup.sh` / `restore.sh`; `docs/DEPLOYMENT.md`, `docs/SECURITY.md`;
      `.github/workflows/ci.yml` (lint + integration tests on Postgres + build + docker build).

**Every phase of the brief is complete.** The build is feature-complete and deployable.

### Lead lifecycle (Phase 5 reference)

`NEW -> CONTACTED -> QUALIFIED -> VIEWING_SCHEDULED -> NEGOTIATION -> WON | LOST`

### Roles (Phase 1 reference)

| Role | Can |
|---|---|
| `SUPER_ADMIN` | everything, plus roles / permissions / organizations / settings |
| `ADMINISTRATOR` | properties, agents, customers, inquiries, approvals, reports, audit |
| `AGENT` | own assigned listings, respond to inquiries, schedule viewings, manage leads |
| `PROPERTY_MANAGER` | monitor assigned properties, status, documents, appointments (read-heavy) |
| `CUSTOMER` | search, view, favorite, inquire, request appointment |

---

## 9b. Known dependency advisories (accepted for now)

- `prisma` CLI depends on a vulnerable `deepmerge-ts` (stack exhaustion on recursive
  config merges). Dev-only tool, not in the runtime path. Clears on a future Prisma bump.
- `react-router` 6.x has a low-impact open-redirect advisory; the patched release is
  v7 (a breaking change). We are a client-only SPA and do not use SSR hydration. Revisit
  when we upgrade to React Router 7.

## 10. When you (Claude) work here

- Stay inside the phase being worked on. Do not scaffold Phase 5 code during Phase 2.
- Keep this file's stack table and roadmap current when a decision changes.
- Match the module shape in section 5.1 exactly for new endpoints.
- Run `npm run lint` and the relevant tests before calling a phase done.
- If a brief requirement and a design-skill rule conflict, the brief wins on tech and scope,
  the design skills win on look and copy of the public pages.
