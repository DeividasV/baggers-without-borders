# Troubleshooting Guide

Common failures and how to diagnose them. This is the deep-dive companion to the
quick table in [`SETUP.md`](../SETUP.md) §8 — start there for a one-line answer,
come here when it did not work.

**Related documents**

| Document                                    | Use it for                                              |
| ------------------------------------------- | ------------------------------------------------------- |
| [`SETUP.md`](../SETUP.md)                   | Install, configure, deploy, operate                     |
| [`docs/INTEGRATIONS.md`](INTEGRATIONS.md)   | Connecting Stripe, Brevo, Turnstile, OpenAI and GitHub  |
| [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) | Architecture, data model, and §16 known defects         |
| [`FEATURES.md`](../FEATURES.md)             | Expected behaviour of every screen, and §9 known gaps   |
| [`SECURITY.md`](../SECURITY.md)             | Security model, accepted risks, vulnerability reporting |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md)     | Development workflow, tests, commit conventions         |

> Several entries below describe **known defects**, not misconfiguration. When a
> symptom matches one, the fix is a code change catalogued in `IMPLEMENTATION.md`
> §16 or `FEATURES.md` §9 — not a setting you can flip.

---

## Table of contents

- [1. Setup and installation](#1-setup-and-installation)
- [2. Database](#2-database)
- [3. Authentication and access](#3-authentication-and-access)
- [4. Development server](#4-development-server)
- [5. Build and deployment](#5-build-and-deployment)
- [6. Testing](#6-testing)
- [7. Uploads and files](#7-uploads-and-files)
- [8. Email, payments and integrations](#8-email-payments-and-integrations)
- [9. Environment variables](#9-environment-variables)
- [10. Security and diagnostics](#10-security-and-diagnostics)
- [Getting more help](#getting-more-help)
- [Quick reference commands](#quick-reference-commands)

---

## 1. Setup and installation

### Node.js version error

**Problem:** `The engine "node" is incompatible with this module`, or
`NODE_MODULE_VERSION 137 … requires 141`, or a native-module crash from
`better-sqlite3`.

**Cause:** This project requires **Node 24.x** (`>=24 <25`). It is enforced by
`engines`, `.npmrc` (`engine-strict=true`), `.nvmrc`/`.node-version`, and
`scripts/dev/ensure-node-24.js` (wired into `predev`/`prebuild`/`prestart`/
`pretest`). Running Jest directly under another major produces database errors
that look like application bugs.

```bash
node --version          # must print v24.x
nvm install 24 && nvm use 24

# Convenience wrapper that also rebuilds better-sqlite3 for the active ABI:
./scripts/dev/npm-node-24.sh test
```

### npm install fails with peer-dependency errors

```bash
npm ci --legacy-peer-deps      # preferred
# If the lockfile is out of sync:
rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required; plain `npm ci` can fail on peer resolution.

### "Setup script not found"

There is no `scripts/setup.sh`. Set up manually:

```bash
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:1345
```

If you meant the web-server setup, that is
`scripts/deployment/setup-nginx.sh` (edit `DOMAIN` first).

### Registration is rejected with "CAPTCHA verification failed"

**Cause:** Turnstile is skipped in development for **login only**. Registration,
forgot-password, reset-password, resend-verification and the anonymous contact
form always verify a token, so a development instance needs a secret.

**Fix:** copy Cloudflare's public always-pass test keys into `.env.local`:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

See [`INTEGRATIONS.md`](INTEGRATIONS.md#cloudflare-turnstile).

---

## 2. Database

### Database file not found

**Problem:** `Database file not found at: …`, or `SQLITE_CANTOPEN`.

`src/lib/prisma.ts` resolves a relative `file:` URL against the repository root
and **fails fast** when the file is missing.

```bash
npm run db:migrate      # creates prisma/dev.db and applies migrations
npm run db:seed         # reference data + synthetic demo users
```

Check the path itself: `DATABASE_URL="file:./prisma/dev.db"` means
`<repo>/prisma/dev.db`. A value like `file:./dev.db` points at `<repo>/dev.db`,
which the app will not find.

### `SQLITE_BUSY` / database is locked

**Cause:** SQLite allows **one writer**: multiple dev servers, a test run, and
Prisma Studio against the same file will collide.

```bash
pkill -f "next dev"
pkill -f jest
npm run test:api        # runs with --runInBand
lsof | grep dev.db      # look for a stuck process
```

Do not run multiple application replicas against one file over a network
filesystem.

### Migration fails

```bash
npx prisma format                      # check schema syntax
npx prisma migrate dev --name fix_schema
npm run db:generate
```

`npx prisma migrate reset` recreates the database and **destroys data** — use it
only in development. Never run `migrate dev` (or `reset`) against production:
production applies with `npx prisma migrate deploy` only.

### Prisma Studio will not start

```bash
npm run db:migrate                     # the file must exist first
lsof -i :5555                          # default Studio port
npm run db:studio
```

### Migration applied but the app still errors on a column

`prisma generate` has not run, or the server is holding an old client. Run
`npm run db:generate` and restart the dev server.

---

## 3. Authentication and access

### Cannot log in with correct credentials

1. The account must have `emailVerified` set — otherwise login is refused with
   "Please verify your email address before logging in."
2. Check the account exists and its `emailVerified` value:
   `npm run db:studio` → `User` table.
3. Reset the password without touching anything else:

   ```bash
   npm run db:reset-password -- username 'new-password'
   npm run db:reset-password -- --admins 'new-password'
   ```

4. Confirm `NEXTAUTH_SECRET` is set and unchanged (`grep NEXTAUTH_SECRET .env.local`).

### Everyone was logged out after a deploy

`NEXTAUTH_SECRET` changed, which invalidates every JWT. That is expected. There
is no server-side session store, so sessions cannot be revoked individually —
only by rotating the secret (everyone) or waiting for expiry.

### Session expires immediately

```bash
# NEXTAUTH_URL must match how you actually reach the app
NEXTAUTH_URL=http://localhost:1345
```

Also clear cookies, and make sure the secret is present in the same environment
the server reads (`.env.local` for `next dev`; `.env` for Docker/PM2).

### Verification email never arrives

Mail is only sent when Brevo is configured. Without `BREVO_API_KEY`,
registration still succeeds but no mail is sent, so the account can never verify.

```bash
grep -E "BREVO_API_KEY|DEV_EMAIL_RECIPIENT" .env.local
```

Set `DEV_EMAIL_RECIPIENT=you@example.com` in development to route all mail to
yourself. To inspect a pending token, open the `User` table in `npm run db:studio`
and look at `emailVerificationToken` / `emailVerificationExpires` — there is no
separate tokens table. Verification links expire after 24 hours, reset links
after 1 hour. Full setup: [`INTEGRATIONS.md`](INTEGRATIONS.md#brevo).

### `401` or `403` from an API route while signed in

Distinguish the two layers:

- **`403`** usually comes from `middleware.ts` — an admin-only prefix
  (`/admin`, `/api/admin`, `/api/change-requests`) or another user's
  `/api/users/[id]/*`.
- **`401`** from an in-route guard means the handler saw no session.

A `500 Internal server error` on a route you expected to be public is the
classic signature of `getSession()` being used where `getOptionalSession()`
belongs: `getSession()` **throws** when there is no session
(`src/lib/api-auth.ts`). `/api/sponsors` is the visible example.

Remember that the matcher proves _authentication_, not _authorization_: only the
administrative families listed under
[`SECURITY.md`](../SECURITY.md#authorization) are role-checked, and every other
route relies on whatever guard it carries itself.

### Locked out — no administrator account

`npm run db:seed` skips the demo users when `NODE_ENV=production`, so a
production instance starts with no admin. Register normally, then promote the
account — see [`SETUP.md`](../SETUP.md) §1.6 for the exact command.

### Stuck on `/consent-prompt`

The gate lives in `app/(authenticated)/template.tsx` and looks for
`UserConsent` rows with `dateGiven: null` for the active **legal** consent types.
Accepting the dialog writes the date and clears it.

Two gotchas: the check is client-rendered and **fails open** on a query error, and
a fresh-seed demo user has **no consent rows at all**, so it passes the gate
silently rather than being prompted (`IMPLEMENTATION.md` §11.4).

---

## 4. Development server

### Port 1345 already in use

```bash
lsof -i :1345
kill <PID>
# or temporarily:
npm run dev -- -p 3000
```

### Hot reload not working

```bash
rm -rf .next && npm run dev
# Linux file-watcher limit:
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

### Cannot find module '@/…'

```bash
npm run db:generate
rm -rf .next node_modules package-lock.json
npm ci --legacy-peer-deps
```

Import `@/…` aliases are enforced by ESLint (`no-restricted-imports` forbids
`../*`). In VS Code, run "TypeScript: Restart TS Server" after changing aliases.

### `check:all` fails on new lint warnings

`scripts/check-all.sh` runs ESLint + `tsc --noEmit` + `next build` with a
**ratcheted 69-warning budget** for `jsx-a11y`. Fix the warnings; do not raise
`ESLINT_MAX_WARNINGS`. `npm run lint` alone still tolerates warnings, so use
`check:all` before pushing.

---

## 5. Build and deployment

### Build runs out of memory

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

The Docker image builds with `--max-old-space-size=1024`.

### Type errors during build

Run `npm run type-check` and fix them. `SKIP_TYPE_CHECK=true` makes `next build`
ignore TypeScript errors — the Docker image sets it deliberately, but never ship
a release that relies on it.

### `npm run deploy` fails

`scripts/deployment/deploy.sh` deploys a **Docker image**; it is not a PM2 rsync
script. Before running it, edit its header: `REMOTE_USER`, `REMOTE_HOST`,
`REMOTE_PATH` (default `/srv/bwb`) and `DOMAIN`.

Checks, in order:

```bash
# 1. SSH works
ssh <REMOTE_USER>@<REMOTE_HOST> "echo OK"

# 2. The server has Docker (not Node/pm2)
ssh <REMOTE_USER>@<REMOTE_HOST> "docker version"

# 3. Host volumes exist and are writable by the container user (UID 1001)
ssh <REMOTE_USER>@<REMOTE_HOST> "ls -ld /srv/bwb/data /srv/bwb/uploads /srv/bwb/backups"
```

The script creates the server `.env` on first run, but it contains only
`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `UPLOADS_DIR`, `BACKUP_DIR`,
`NODE_ENV` and `PORT`. **Add `BACKUP_PASSWORD` and the integration keys by hand**
before going live, or backups use a public default password.

Common failures:

- **Migrations**: the script applies them in a one-off container. To do it by
  hand: `docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy`.
- **Health poll times out**: read `docker logs bwb-climbing --tail 50`. The most
  common causes are a missing `UPLOADS_DIR` and a database the container user
  cannot write.
- **Bind mounts**: the image runs as **UID/GID 1001**. Host directories owned by
  root produce permission errors: `chown -R 1001:1001 /srv/bwb/{data,uploads,backups}`.

### PM2 path (no Docker)

```bash
npm ci --legacy-peer-deps
npm run db:generate && npm run build
npm run db:migrate         # or: npx prisma migrate deploy
pm2 start npm --name bwb-climbing -- start
pm2 save && pm2 logs bwb-climbing
```

Set `NODE_ENV=production`, `UPLOADS_DIR`, `BACKUP_DIR`, `BACKUP_PASSWORD` and a
real `NEXTAUTH_SECRET` in `.env` first.

### A maintenance script fails inside Docker

`npm run db:cleanup-logs`, `db:cleanup-rate-limits`, `db:export-members` and
`db:reset-password` are **not available in the container**: `.dockerignore`
excludes `scripts/*` except `seed`, `shared` and `dev/ensure-node-24.js`, and the
Dockerfile copies only those. Run them from a checkout with `DATABASE_URL`
pointed at the mounted database, or add the script directories to the image.

---

## 6. Testing

### Tests fail with `SQLITE_BUSY`

Suites that touch the database run serially by design
(`test:api`, `test:contracts`, `test:e2e` use `--runInBand`). For a custom run
add `--runInBand` and make sure no dev server is writing to the same file.

### Tests fail because of existing data

`jest.globalSetup.js` deletes and recreates `prisma/test.db` and runs
`prisma migrate deploy` against it before any suite loads, and `jest.env.js`
points the suite at that file. If a suite still sees stale data, it is cleaning
up badly — fix the suite rather than the setup.

### A component suite fails on copy/structure

This is expected at handover: components were refactored and the assertions were
never updated. They fail on string matching, not logic. See
[`CONTRIBUTING.md`](../CONTRIBUTING.md) §7 for the current failing suites and the
suggested approach. Do not weaken assertions to make them pass.

### `Cannot find module` or a missing `fetch` in a test

- Run `npx jest --clearCache`.
- `jest.setup.js` installs a global `fetch` stub because jsdom has none. For a
  specific response: `(global.fetch as jest.Mock).mockResolvedValueOnce(...)`.
- `jest.mock` must be at **module top level** — inside `describe` it is not
  hoisted and has no effect.

### Coverage run fails the threshold

`test:coverage` enforces 50% branches/functions/lines/statements globally
(`jest.config.js`). New untested code lowers the total.

---

## 7. Uploads and files

### Uploads 404 even though the files exist

`UPLOADS_DIR` points somewhere other than where the file was written. In
production it is **required** (`getUploadsBaseDir()` throws without it); in
development it defaults to `<repo>/uploads`.

```bash
# Inside the container:
docker compose -f docker-compose.prod.yml exec bwb-climbing env | grep UPLOADS_DIR
docker compose -f docker-compose.prod.yml exec bwb-climbing ls -la /app/uploads
```

### An upload was written but the link is broken

Known defect: two subsystems write under `UPLOADS_DIR` but store or delete under
`public/uploads/` — Meister-report images and consent-type attachments. Deletions
leave orphaned files (the unlink error is swallowed). See `FEATURES.md` §9.

### Files are visible to people who should not see them

Known defect: `GET /api/uploads/[...path]` serves any file under the uploads root
with **no authorization**, and marks responses `Cache-Control: public, immutable`.
Until it is fixed, treat every upload as public: do not store anything sensitive
there, and restrict the route at the proxy if you can. See
[`SECURITY.md`](../SECURITY.md#known-defects-tracked-not-accepted).

### The public contact form accepted a huge file

Known defect: `POST /api/support-requests` checks only `size > 0` — no MIME
allow-list and no size or count cap. The helpdesk note endpoint does enforce
5 MB/25 MB. Clean up `$UPLOADS_DIR/support-requests/` manually until it is fixed.

---

## 8. Email, payments and integrations

Setup instructions for every external service live in one place:
[`docs/INTEGRATIONS.md`](INTEGRATIONS.md). Short version of the common failures:

| Symptom                           | Cause                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| No email at all                   | `BREVO_API_KEY` unset, or the sender address is not verified in Brevo              |
| Email sends but nobody receives   | `DEV_EMAIL_RECIPIENT` is set, or the delivery bounced — check the `EmailLog` table |
| Stripe payment stays `PENDING`    | The webhook never reached the app, or `STRIPE_WEBHOOK_SECRET` is wrong             |
| Stripe webhook signature fails    | A proxy parsed or re-encoded the body; verification needs the raw body             |
| Donation completed but no receipt | Known defect: no receipt email is sent                                             |
| OpenAI commit sync fails          | `OPENAI_API_KEY` unset; the feature is disabled without it                         |

`EmailLog` rows (delivery status, `brevoMessageId`, errors) are only visible
through `npm run db:studio` — there is no admin UI, and the 90-day retention date
is never enforced.

---

## 9. Environment variables

### Variables not loading

The app and the tooling read the same four files with **different precedence**:

| Consumer                    | Precedence (highest first)                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| Next.js (the app)           | `process.env` → `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env`     |
| Prisma CLI and Node scripts | `process.env` → **`.env`** → `.env.local` → `.env.<env>` → `.env.<env>.local` |

So a value defined in **both** `.env` and `.env.local` is read from `.env` by
scripts and from `.env.local` by the app. Keep canonical values in one file, and
restart the dev server after editing either.

`NEXT_PUBLIC_*` values are baked into the client bundle **at build time** — change
one and you must rebuild, not just restart.

### Variables missing in production

```bash
# Docker
docker compose -f docker-compose.prod.yml exec bwb-climbing env | grep -E "NEXTAUTH|DATABASE_URL|UPLOADS_DIR"

# PM2
pm2 env 0 | grep NEXTAUTH
```

Required: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `NODE_ENV`. Also
required in production: `UPLOADS_DIR`, `BACKUP_DIR`, and — strongly —
`BACKUP_PASSWORD`, which nothing enforces but which defaults to a public literal.
Docker/PM2 read `.env`, **not** `.env.local`.

### `next build` succeeds but the app throws type errors at runtime

`SKIP_TYPE_CHECK=true` was set. Run `npm run type-check`.

---

## 10. Security and diagnostics

### The health endpoint exposes internal paths

Known defect: `/api/health?detailed=true` is **public** (the route is outside the
middleware matcher) and returns the environment, the database user count, the
uploads directory path **and a listing of it**, the backup directory path, and the
database file path/size/mtime. Block it at the proxy:

```nginx
location = /api/health {
    if ($arg_detailed = "true") { return 403; }
    proxy_pass http://127.0.0.1:1345;
}
```

### A password appears in the server log

Known defect: `app/api/users/[id]/password/route.ts` logs the received password in
plaintext. Remove those `console.log` lines before a public deployment, and treat
any password that passed through the log as compromised.

### Auditing suspicious activity

`AuditLog` is browsable at `/admin/logs`. IP addresses are stored as **SHA-256
hashes**, so you cannot reverse them; the country comes from Cloudflare headers.
Retention is 90 days for `AUTH` and 730 days otherwise, but cleanup is the manual
`npm run db:cleanup-logs` — there is no scheduler.

### Rate limiting seems ineffective

The limiter trusts `CF-Connecting-IP` / `X-Forwarded-For` / `X-Real-IP`. If your
proxy does not overwrite them, they are spoofable. Login and reset-password are
not rate-limited at all (Turnstile only). See `SETUP.md` §6.5.

---

## Getting more help

1. **Check the docs** — [`docs/INDEX.md`](INDEX.md) lists everything, and the
   symptom may already be a documented defect in `IMPLEMENTATION.md` §16 or
   `FEATURES.md` §9.
2. **Search the issue tracker** for the exact error text.
3. **Run the health check** and the diagnostic commands below.
4. **Open an issue** with the error, the command you ran, your Node version, and
   the relevant log lines.

For a **security** issue, do not open a public issue — follow
[`SECURITY.md`](../SECURITY.md#reporting-a-vulnerability).

---

## Quick reference commands

### Diagnostics

```bash
node --version && npm --version       # expect v24.x
curl -s localhost:1345/api/health     # liveness
npm run db:studio                     # inspect data
npm run type-check                    # TypeScript
npm run check:all                     # lint + types + build
npm run security:secrets              # credential scan
docker logs bwb-climbing --tail 100   # Docker logs
pm2 logs bwb-climbing --lines 100     # PM2 logs
lsof -i :1345                         # port usage
```

### Recovery

```bash
# Fresh local environment
rm -rf node_modules .next && npm ci --legacy-peer-deps
npm run db:generate && npm run db:migrate && npm run db:seed

# Reset a password
npm run db:reset-password -- username 'new-password'

# Production, Docker
docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d --build

# Production, PM2
pm2 restart bwb-climbing
```
