# Security

How the platform meets the brief's security requirements, and the residual risks.

## The brief's checklist

| Requirement | Where |
|---|---|
| Passwords hashed, never plain text | Argon2id via `@node-rs/argon2` (`server/src/lib/password.js`). Hashes are never selected into API responses or logs (pino redaction). |
| Auth + authorization on the backend for every protected operation | `authenticate` verifies the JWT; `authorize('perm')` / `authorize.role(...)` gate routes; row-level ownership is re-checked in each service (`loadManageable`, `loadInquiry`, `loadAppointment`, `loadPropertyForAccess`, document `canSee`). The frontend hiding a control is never the security boundary. |
| Validate every body / query / param / upload | `validate(zodSchema)` middleware runs before every controller and replaces `req.body/query/params` with the parsed result. Uploads go through `multer` with a MIME allow-list and size caps. |
| Parameterized queries / ORM | All data access is Prisma. The only raw SQL is a constant `SELECT 1` health check. Keyword search uses Prisma `contains` (parameterized). |
| Rate limiting on auth and public inquiry endpoints | `authLimiter` (50 / 15 min) on login + register; `inquiryLimiter` (15 / hour) on `POST /api/inquiries` and `POST /api/appointments`; a gentle `apiLimiter` (600 / 15 min) on everything else. Keyed on the real client IP via `trust proxy`. |
| Private documents not exposed through predictable URLs | Documents live in a **separate MinIO bucket with no public-read policy**. The only way to read one is `GET /api/documents/:id/download`, which checks the document's `visibility` (`PUBLIC` / `AGENTS` / `PRIVATE`) against the caller and streams the bytes with `Content-Disposition: attachment`. Object keys are random UUIDs. |
| HTTPS/TLS in production; secrets in env | TLS is terminated by the reverse proxy in front of `web` (see DEPLOYMENT.md). All secrets come from environment variables; `.env*` files are git-ignored; the server refuses to boot in production if the JWT secrets are still the example values. |
| Audit log for approvals, account changes, lead assignments, property changes | `writeAudit(...)` records listing transitions, document uploads, lead assignments, user status changes, and agent edits. Readable at `GET /api/audit-logs` (permission `audit:read`) and `/admin/audit`. |
| Database backups, tested restoration | `scripts/backup.sh` / `scripts/restore.sh` (pg_dump custom format + a tar of the object store). DEPLOYMENT.md says to run backups from cron, copy them off-box, and test a restore periodically. |

## Additional hardening

- **JWT**: 15-minute access tokens (stateless), 7-day refresh tokens that are **rotated on
  every use** and stored only as a SHA-256 hash. Presenting an already-rotated refresh
  token revokes every session for that user (stolen-token detection). Refresh lives in an
  `httpOnly`, `secure` (in prod), `SameSite` cookie scoped to `/api/auth`.
- **Headers**: `helmet` (HSTS, `nosniff`, no `x-powered-by`, frameguard, referrer policy).
  The API returns only JSON so it carries no CSP; the SPA is served by nginx with a strict
  `Content-Security-Policy` (see `client/nginx.conf`).
- **CORS** allows exactly one origin (`CLIENT_ORIGIN`) with credentials.
- **Body size** capped at 1 MB for JSON, 5 MB per image, 20 MB per document.
- **Mass assignment** is prevented with explicit field whitelists in every write path.
- **SSRF**: the brochure generator only fetches images whose URL begins with our own
  storage base, with a 5-second timeout.
- **Logging** redacts `authorization`, `cookie`, `set-cookie`, and every `*password*` /
  `*token*` field.
- **Graceful shutdown** on SIGTERM with a 10-second force-exit; `uncaughtException` exits
  so the orchestrator restarts a broken process.
- Staff accounts have **no public sign-up**; an admin creates agents, the first admin is
  created with a CLI script.

## Known limitations (acceptable for this project, worth noting)

- **Upload type check** trusts the request's declared MIME type, not the file's magic
  bytes. Uploads are staff-only, audited, and always served as `attachment`, so a
  mislabeled file cannot execute - but a magic-byte check (`file-type`) would be the next
  step.
- **Keyword search** uses `ILIKE '%term%'`; at tens of thousands of listings this should
  become a `pg_trgm` GIN index on `Property.title` / `Property.description`.
- **Saved-search notifications** fire on publish only (not on a price/detail edit of an
  already-published listing).
- **No email delivery** - notifications are in-app only. Password reset for staff is
  "an admin resets it" rather than a self-service email flow.
- **MFA** is not implemented.
