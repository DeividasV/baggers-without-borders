# Setup & Operations Guide

A complete, linear guide to getting this application running, configuring it, and
keeping it running. Every command is copy-pasteable.

- New here? Start with [§1 Quick start](#1-quick-start).
- Deploying? Go to [§6 Production deployment](#6-production-deployment).
- Something broken? See [§8 Troubleshooting](#8-troubleshooting).

**Related documents**

| Document                                             | Covers                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| [`FEATURES.md`](FEATURES.md)                         | Every screen, capability, and known gap                                   |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md)             | Architecture, data model, API surface, §16 known issues, §20 placeholders |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)                 | Code map, workflow, how to add a route, current test state                |
| [`docs/QUICK_START.md`](docs/QUICK_START.md)         | Shortest local path, core commands, commit workflow                       |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)           | Deployment detail beyond this guide                                       |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Longer-form problem solving                                               |
| [`SECURITY.md`](SECURITY.md)                         | Security policy, accepted risks, vulnerability reporting                  |
| [`docs/INDEX.md`](docs/INDEX.md)                     | Index of every document under `docs/`                                     |

---

## 1. Quick start

### 1.1 Prerequisites

| Requirement | Version               | Notes                                        |
| ----------- | --------------------- | -------------------------------------------- |
| Node.js     | **24.x** (`>=24 <25`) | Other majors fail on native modules — see §8 |
| npm         | 10+ (<12)             |                                              |
| Git         | any recent            |                                              |
| Disk        | ~500 MB               | Dependencies plus the database file          |

No database server is needed: the database is a single SQLite file.

**Node 24 is enforced in four places**, so a wrong major fails fast and loudly rather
than mysteriously:

- `engines` in `package.json` (`>=24.0.0 <25.0.0`, npm `>=10 <12`).
- `.npmrc` sets `engine-strict=true`, so `npm install`/`npm ci` refuses the wrong engine.
- `.nvmrc` and `.node-version` both pin `24` for `nvm`/`fnm`/`asdf`.
- `scripts/dev/ensure-node-24.js` runs from the `predev`, `prebuild`, `prestart` and
  `pretest` hooks and exits non-zero on any other major.

Check your runtime:

```bash
node --version    # must print v24.x
npm --version
```

If you use `nvm` and switch Node versions often, `scripts/dev/npm-node-24.sh` is a
convenience wrapper: it activates Node 24, rebuilds the `better-sqlite3` native binding
for that ABI, and then runs whatever you passed it.

```bash
./scripts/dev/npm-node-24.sh install --legacy-peer-deps
./scripts/dev/npm-node-24.sh test
```

### 1.2 Install

```bash
git clone <repository-url>
cd <repository-directory>

# --legacy-peer-deps is required; plain npm ci can fail on peer resolution
npm ci --legacy-peer-deps
```

`npm ci` runs the `prepare` hook, which installs the Husky git hooks (§3.5).

### 1.3 Configure

For local development, `.env.local` is the only file you need:

```bash
cp .env.example .env.local
```

Generate a session secret and put it in `.env.local`:

```bash
openssl rand -base64 32
```

Minimum you must set for local development:

```env
NEXTAUTH_SECRET=<paste the generated value>
NEXTAUTH_URL=http://localhost:1345
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV=development
PORT=1345
```

Everything else is optional for a local run. See [§4](#4-configuration) for the full
reference.

**How the environment is loaded.** The application and the tooling read the same four
files but with **different precedence**, because Next.js and the Prisma CLI resolve
overrides differently:

| Consumer                    | Precedence (highest first)                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| Next.js (the app)           | `process.env` → `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env`     |
| Prisma CLI and Node scripts | `process.env` → **`.env`** → `.env.local` → `.env.<env>` → `.env.<env>.local` |

`prisma.config.ts` and `scripts/shared/prisma-client.js` load the four files in that
order with `override: false`, so the **first file that defines a variable wins** — which
makes `.env` the winner for CLI and scripts, while Next.js prefers `.env.local`. Keep
your canonical values in one file, or at least never put **different** values for the
same key in both `.env` and `.env.local`.

**Docker and PM2 read `.env`, not `.env.local`.** `docker-compose.prod.yml` declares
`env_file: .env`, and `scripts/deployment/deploy.sh` creates that file on the server. See
[§6.3](#63-docker).

### 1.4 Create the database

```bash
npm run db:generate     # generate the Prisma client
npm run db:migrate      # create the SQLite file and apply all migrations
npm run db:seed         # reference data + synthetic demo users
```

`db:seed` prints a **generated password** for three synthetic accounts:

```
demo-admin    (ADMIN)
demo-user     (USER)
demo-member   (USER)
```

Copy that password — it is printed once and not stored anywhere. To choose your own
instead, set `DEMO_USER_PASSWORD` in `.env.local` before seeding, or re-run with
`DEMO_USER_PASSWORD=your-password npm run db:seed`.

`db:seed` is the **only** data you need: it loads the country/region reference data from
the JSON files in `prisma/`, plus consent types, interests, Halls of Fame, years, the
BASELINE year, award tiers and the demo accounts. It is idempotent, and it needs no
network access. For what each group is for, and the minimum data a functional instance
needs, see [`IMPLEMENTATION.md` §19](IMPLEMENTATION.md#19-appendix--seeding-and-populating-data).

### 1.5 Run

```bash
npm run dev
```

Open <http://localhost:1345> and sign in with `demo-admin` and the password from the
previous step, or register a new account (it will need email verification — see
[§5.3](#53-email-with-brevo-optional)).

### 1.6 Create your first administrator (production)

Demo accounts are **skipped when `NODE_ENV=production`**
(`scripts/seed/seed-demo-users.js`), so a production instance has no administrator after
seeding. Register a normal account through `/register`, then promote it.

**Option A — Prisma Studio (interactive):**

```bash
npm run db:studio
```

Open the `User` table, find your account, and set `role` to `ADMIN`.

**Option B — one-liner (scriptable, works host-side or inside Docker):**

```bash
node -e 'const p=require("./scripts/shared/prisma-client");p.user.update({where:{username:"your-username"},data:{role:"ADMIN"}}).then(u=>console.log("promoted",u.username,"to",u.role)).finally(()=>p.$disconnect());'
```

Inside the container the same command works because `scripts/shared` is copied into the
image:

```bash
docker compose -f docker-compose.prod.yml exec bwb-climbing \
  node -e 'const p=require("./scripts/shared/prisma-client");p.user.update({where:{username:"your-username"},data:{role:"ADMIN"}}).then(u=>console.log("promoted",u.username)).finally(()=>p.$disconnect());'
```

Once one administrator exists, further roles are assigned from
`/admin/members/[id]`, and `npm run db:reset-password -- --admins '<password>'` can
service every admin account.

---

## 2. Verify the installation

Run through this checklist after a fresh setup.

| Check                | Command / action                    | Expected                                          |
| -------------------- | ----------------------------------- | ------------------------------------------------- |
| Types compile        | `npm run type-check`                | exits 0                                           |
| Lint passes          | `npm run lint`                      | 0 errors                                          |
| Full quality gate    | `npm run check:all`                 | passes within the warning budget (see below)      |
| App responds         | `curl -s localhost:1345/api/health` | `{"status":"ok",...}`                             |
| Database is seeded   | `npm run db:studio`                 | opens Prisma Studio; `User` table has 3 demo rows |
| Login works          | sign in as `demo-admin`             | lands on `/home`                                  |
| No secrets committed | `npm run security:secrets`          | exits 0                                           |
| Tests run            | `npm test`                          | see §7 — some suites are expected to fail         |

`npm run check:all` runs `scripts/check-all.sh` — ESLint, `tsc --noEmit` and a real
`next build` — with a **ratcheted accessibility-warning budget** (currently 69 known
`jsx-a11y` warnings) rather than `--max-warnings=0`. It does not run tests or formatting.
Lower the budget in `scripts/check-all.sh` as warnings are fixed; never raise it.

---

## 3. Operating the application

### 3.1 Day-to-day

```bash
npm run dev            # development server, port 1345
npm run build && npm start   # production build and serve
npm run db:studio      # browse and edit data
npm run lint:fix       # lint with autofix
npm run format         # Prettier write
```

### 3.2 Database maintenance

```bash
npx prisma migrate deploy      # apply migrations (production)
npm run db:cleanup-logs        # prune old audit log rows
npm run db:cleanup-rate-limits # prune expired rate-limit rows
npm run db:export-members      # export members to CSV
npm run db:delete-all          # DANGER: empty the database (use --dry-run first)
```

`db:delete-all` supports a dry run: `npm run db:delete-all:dry`.

Two further dev-data seeders exist beyond `db:seed`:

```bash
npm run db:seed-users          # 32 synthetic members
npm run db:seed-hof-entries    # synthetic Hall of Fame entries for those members
```

**Pulling the production database** (requires the `REMOTE_HOST` placeholder in
`scripts/deployment/pull-db.sh` to be edited first):

```bash
npm run db:pull                # download a copy to ./backups/pulled-from-prod/
npm run db:pull:restore        # download and restore into ./prisma/dev.db
npm run db:pull:compare        # compare local and production schemas
npm run db:pull:schema         # fetch the production schema only
```

**Inside the Docker image, the maintenance scripts are not present.**
`.dockerignore` excludes `scripts/*` except `seed`, `shared` and
`dev/ensure-node-24.js`, and the Dockerfile copies only those. `db:cleanup-logs`,
`db:cleanup-rate-limits`, `db:export-members`, `db:reset-password`, `db:delete-all` and
`security:secrets` therefore fail inside the container. Run them from a checkout with
`DATABASE_URL` pointed at the mounted database file, or add the script directories to the
image. See [§6.7](#67-scheduled-jobs).

> **There are no importers for the original member dataset.** That pipeline was one-off
> and has been removed. See `IMPLEMENTATION.md` §19 for how to write your own.

### 3.3 Backups

Two ways:

1. **Through the app** — sign in as an admin and use the Backups page, or
   `POST /api/backup`. Archives are written to `BACKUP_DIR` and encrypted with
   `BACKUP_PASSWORD`.
2. **By hand** — stop the app and copy the SQLite file. Copying it while the app is
   writing can produce a torn file.

Restore by replacing the database file with the app stopped, then restarting. There is
**no restore endpoint**; the app's backup modal documents the manual procedure.

> **Always set `BACKUP_PASSWORD`.** The backup code falls back to the literal string
> `default-password-change-me`, and the `.env` that `deploy.sh` generates on a fresh
> server does **not** include it. A deployment that never adds it encrypts every archive
> with a public default. See [§6.1](#61-before-you-deploy).

### 3.4 Resetting a password

```bash
npm run db:reset-password -- --admins 'new-password'          # all admins
npm run db:reset-password -- username 'new-password'          # one user
```

The `--admins` flag resolves administrators by role, not by a hardcoded list. The script
hashes with bcrypt cost 10, whereas account creation uses cost 12 — both are valid, but
new passwords are slightly cheaper to verify.

### 3.5 Commit hooks and versioning

`npm ci` installs three Husky hooks:

| Hook                 | Runs                                                                      |
| -------------------- | ------------------------------------------------------------------------- |
| `pre-commit`         | `lint-staged` (ESLint + Prettier on staged files) then the secret scanner |
| `commit-msg`         | `commitlint` — Conventional Commits with a fixed scope list               |
| `prepare-commit-msg` | the automatic versioning hook (`scripts/versioning/`)                     |

Practical consequences: a commit is rejected if the message is not conventional, if the
secret scanner finds credential material, or if a staged file fails lint/format. Use
`npm run commit` for an interactive Conventional Commit helper. Version bumps are handled
by `npm run version:calculate` / `version:update`; see
[`docs/AUTOMATIC_VERSIONING.md`](docs/AUTOMATIC_VERSIONING.md).

---

## 4. Configuration

All variables are documented inline in [`.env.example`](.env.example). For local work,
put them in `.env.local`; for Docker/PM2, put them in `.env` ([§1.3](#13-configure)).

### 4.1 Required

| Variable          | Purpose                                                                             |
| ----------------- | ----------------------------------------------------------------------------------- |
| `NEXTAUTH_SECRET` | Signs session tokens. `openssl rand -base64 32`. **Rotating it logs everyone out.** |
| `NEXTAUTH_URL`    | Canonical app URL. Must be `https://` in production.                                |
| `DATABASE_URL`    | SQLite `file:` URL.                                                                 |
| `NODE_ENV`        | `development` \| `production` \| `test`.                                            |

### 4.2 Required in production

| Variable          | Purpose                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UPLOADS_DIR`     | Where uploaded files are stored. **The app refuses to start without it in production** — a `public/` fallback would expose user documents. Set by the Docker image to `/app/uploads`. |
| `BACKUP_DIR`      | Where backup archives are written. Set by the Docker image to `/app/backups`.                                                                                                         |
| `BACKUP_PASSWORD` | Encrypts backup archives. **Strongly required — not enforced by the app.** The literal fallback is public knowledge ([§3.3](#33-backups)).                                            |

### 4.3 Optional integrations

| Variable                                                   | Enables                                    |
| ---------------------------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`   | CAPTCHA on auth and contact forms (§5.2)   |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`               | Donations (§5.1)                           |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Transactional email (§5.3)                 |
| `OPENAI_API_KEY`                                           | Commit summarisation for change requests   |
| `GITHUB_REPO` / `NEXT_PUBLIC_GITHUB_REPO`                  | Commit deep links and the AGPL source link |
| `APP_URL`, `DEV_EMAIL_RECIPIENT`, `SUPPORT_FALLBACK_EMAIL` | Email link base and routing                |
| `DEMO_USER_PASSWORD`                                       | Fixed password for seeded demo accounts    |

> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is **not used**. Donations redirect to hosted
> Stripe Checkout, so no Stripe.js or client-side key is loaded. The variable is left
> commented in `.env.example` only as a placeholder for future Stripe Elements work.

### 4.4 Tooling and build

| Variable               | Enables                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `SKIP_TYPE_CHECK=true` | Makes `next build` ignore TypeScript errors. Emergency local builds only.   |
| `NEXT_PUBLIC_API_URL`  | Base URL for the admin roles page API calls (defaults to `localhost:3100`). |
| `BWB_COMMIT_MSG`       | Commit message consumed by the versioning hook.                             |

### 4.5 Placeholders

Every value in `.env.example` is a **placeholder**, not a working credential.
`IMPLEMENTATION.md` §20 lists every placeholder in the repository, the files it appears
in, and what to replace it with — including the site URL, the privacy-policy contact
address, the `REMOTE_HOST`/`DOMAIN` values in `scripts/deployment/*.sh`, and the domains
in the nginx config. Read it before deploying.

---

## 5. Optional integrations

Each is independent; skip what you do not need. Full walkthroughs — account setup,
webhooks, verification steps, failure modes and the data each service receives —
are in [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md).

### 5.1 Stripe (donations)

1. Create an account and open the Dashboard in **test mode** first.
2. Copy the **secret key** from <https://dashboard.stripe.com/test/apikeys> into
   `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```
3. Create a webhook endpoint pointing at
   `https://your-domain/api/donations/webhook`, listening for
   `checkout.session.completed` and `checkout.session.expired`.
4. Copy the **signing secret** into `STRIPE_WEBHOOK_SECRET`.
5. Locally, use the Stripe CLI to forward events:
   ```bash
   stripe listen --forward-to localhost:1345/api/donations/webhook
   ```

**Note:** signature verification needs the **raw** request body. If you put a proxy in
front, make sure it does not rewrite or re-encode the body of
`/api/donations/webhook`.

**Note:** fulfilment happens only in the webhook. Nothing is recorded as `COMPLETED`
unless Stripe can reach your endpoint. See [`docs/STRIPE_DONATIONS.md`](docs/STRIPE_DONATIONS.md)
and `FEATURES.md` §9 for the current limitations (no receipt email, no monthly-renewal
handling, no admin donations view).

### 5.2 Cloudflare Turnstile (bot protection)

1. Create a Turnstile widget at
   <https://dash.cloudflare.com/?to=/:account/turnstile>.
2. Put the site key and secret in `.env.local`:
   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
   TURNSTILE_SECRET_KEY=...
   ```
3. Locally you can use Cloudflare's public test keys, which always pass:
   ```env
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
   TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
   ```

**Use the test keys locally — they are required.** Turnstile is skipped in development
for the **login** form only. Registration, password reset, resend-verification and the
anonymous contact form always call the verification API, so with the placeholder keys
from `.env.example` those submissions are rejected as soon as Cloudflare is reachable
("CAPTCHA verification failed"). Copying the test keys from step 3 into `.env.local`
fixes this and needs no Cloudflare account. The env files that happen to carry these
values in a working checkout (`.env.development`) are gitignored and are **not** present
on a fresh clone.

Turnstile also **fails open** on network errors or timeouts — a Cloudflare outage does
not lock users out, but it does remove bot protection for the duration.

### 5.3 Email with Brevo (optional)

Without this, registration and password reset still work but no mail is sent, so users
cannot verify their address and therefore cannot log in.

1. Create a Brevo account and verify a sender address.
2. Add to `.env.local`:
   ```env
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=no-reply@your-domain
   BREVO_SENDER_NAME="Your Project"
   APP_URL=http://localhost:1345
   ```
3. For development, route all mail to yourself:
   ```env
   DEV_EMAIL_RECIPIENT=you@example.com
   ```

Delivery status (delivered, bounced, blocked) is tracked in the `EmailLog` table via
`POST /api/webhooks/brevo`; there is no admin UI for it, and its 90-day retention date is
never enforced automatically.

---

## 6. Production deployment

The project ships two paths: an **automated script** ([§6.2](#62-automated-deployment-deploysh)),
and **manual Docker or PM2** ([§6.3](#63-docker), [§6.4](#64-pm2-no-docker)). Both need
the prerequisites below.

### 6.1 Before you deploy

- [ ] Replace every placeholder — `IMPLEMENTATION.md` §20, including `REMOTE_HOST`/`DOMAIN`
      in `scripts/deployment/deploy.sh`, `pull-db.sh` and `setup-nginx.sh`
- [ ] Generate a real `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to your `https://` URL
- [ ] Set `UPLOADS_DIR`, `BACKUP_DIR` — and **`BACKUP_PASSWORD`** (see below)
- [ ] Set `NODE_ENV=production`
- [ ] Run `npx prisma migrate deploy` on the target
- [ ] Read `IMPLEMENTATION.md` §16 — **known security limitations**
- [ ] Confirm the reverse proxy sets client IP headers (rate limiting depends on it)
- [ ] Block `/api/health?detailed=true` at the proxy ([§6.6](#66-health-check-and-monitoring))
- [ ] Create a host volume directory writable by **UID/GID 1001** (Docker)

> `deploy.sh` generates a server `.env` on first run containing `NEXTAUTH_SECRET`,
> `NEXTAUTH_URL`, `DATABASE_URL`, `UPLOADS_DIR`, `BACKUP_DIR`, `NODE_ENV` and `PORT` —
> but **not** `BACKUP_PASSWORD`, `TURNSTILE_*`, `STRIPE_*` or `BREVO_*`. Add those by
> hand before going live.

### 6.2 Automated deployment (`deploy.sh`)

`npm run deploy` runs `scripts/deployment/deploy.sh`, which performs the whole release:

1. Builds the Docker image locally and saves it to a tar.
2. Ships the image, `docker-compose.prod.yml` and `data/git-commits/` to the server.
3. Creates the server `.env` if it does not exist.
4. Ensures `/srv/bwb/{data,uploads,backups}` exist and are owned by **UID/GID 1001**
   (the container's non-root user), and creates an empty `bwb.db` on a fresh install.
5. Takes a **pre-deployment backup** of the production database.
6. Applies migrations with a one-off `docker run --rm … npx prisma migrate deploy`.
7. Recreates the container and **polls `/api/health` for up to 30 seconds**, exiting
   non-zero if it never becomes healthy.
8. Prunes old images, verifies the nginx configuration, and deletes backups older than
   30 days (keeping the 10 most recent).

Edit `REMOTE_USER`, `REMOTE_HOST`, `REMOTE_PATH` and `DOMAIN` at the top of the script
first — they default to `root@example.com` and `/srv/bwb`.

### 6.3 Docker

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Three details matter:

- **The compose file reads `.env`, not `.env.local`** (`env_file: .env`). Put the
  production configuration there.
- **The volumes are host bind mounts, not named volumes.** The compose file maps
  `/srv/bwb/data`, `/srv/bwb/uploads` and `/srv/bwb/backups` onto `/app/data`,
  `/app/uploads` and `/app/backups`. The host directories must exist and be writable by
  **UID/GID 1001**, because the image runs as the non-root `nodejs` user:

  ```bash
  sudo mkdir -p /srv/bwb/{data,uploads,backups}
  sudo chown -R 1001:1001 /srv/bwb/{data,uploads,backups}
  ```

- **The image is production-only.** It installs with `npm ci --omit=dev`, builds with
  `SKIP_TYPE_CHECK=true`, and contains only `.next`, `public`, the Prisma client,
  `prisma/` (schema + migrations), `scripts/seed`, `scripts/shared`,
  `scripts/dev/ensure-node-24.js` and `data/legal`. The maintenance scripts in
  `scripts/admin` and `scripts/data` are **not** in the image ([§3.2](#32-database-maintenance)).

| Container path | Holds                      | Host path (compose) |
| -------------- | -------------------------- | ------------------- |
| `/app/data`    | SQLite database (`bwb.db`) | `/srv/bwb/data`     |
| `/app/uploads` | Uploaded files             | `/srv/bwb/uploads`  |
| `/app/backups` | Backup archives            | `/srv/bwb/backups`  |

Apply migrations inside the running container after a manual deploy:

```bash
docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy
```

The image's `CMD` is `npm start`, which runs `next start -p 1345`; it does **not** run
migrations on boot, so a release must apply them first (§6.2 does this automatically).

### 6.4 PM2 (no Docker)

```bash
npm ci --legacy-peer-deps
npm run db:generate
npm run build
pm2 start npm --name bwb-climbing -- start
pm2 save
```

Before starting, set `NODE_ENV=production`, `UPLOADS_DIR`, `BACKUP_DIR`,
`BACKUP_PASSWORD` and a real `NEXTAUTH_SECRET` in `.env`, and apply migrations with
`npx prisma migrate deploy`. `pm2 start npm … start` uses the `prestart` hook, so Node 24
is enforced. Logs: `pm2 logs bwb-climbing`.

### 6.5 Reverse proxy

The app expects a proxy in front that:

1. Terminates TLS and forwards to port 1345.
2. Sets `X-Forwarded-For` / `X-Real-IP` (or Cloudflare headers). **Without this, rate
   limiting can be bypassed by spoofing headers.**
3. Passes `/api/donations/webhook` bodies through unmodified.
4. Allows body sizes large enough for document (50 MB) and journal (20 MB) uploads.
5. Blocks `/api/health?detailed=true` ([§6.6](#66-health-check-and-monitoring)).

`scripts/deployment/setup-nginx.sh` is a starting point — edit `DOMAIN` and the certbot
email placeholder first.

### 6.6 Health check and monitoring

```
GET /api/health                 → {"status":"ok","timestamp":"..."}
GET /api/health?detailed=true   → operational internals
```

Use the basic form for container health checks (both the Dockerfile and the compose file
already do).

> **The detailed form is public.** `/api/health` is not in the middleware matcher, so
> `?detailed=true` is reachable by anyone and returns the environment name, the database
> user count, the uploads directory path **and a listing of it**, the backup directory
> path, and the database file path, size and modification time. Treat that as
> information disclosure: block it at the proxy, e.g.

```nginx
location = /api/health {
    if ($arg_detailed = "true") { return 403; }
    proxy_pass http://127.0.0.1:1345;
}
```

### 6.7 Scheduled jobs

There is no background worker; schedule these externally (cron, systemd timer). Note that
the maintenance scripts are **not in the Docker image** ([§3.2](#32-database-maintenance)),
so run them from a checkout with `DATABASE_URL` pointed at the mounted database, or from
a one-off container that mounts the repo's scripts.

| Task              | Command                          | Suggested |
| ----------------- | -------------------------------- | --------- |
| Prune audit logs  | `npm run db:cleanup-logs`        | weekly    |
| Prune rate limits | `npm run db:cleanup-rate-limits` | daily     |
| Database backup   | admin UI, or `POST /api/backup`  | daily     |

Email logs carry a 90-day retention date but have **no cleanup script**, so they grow
indefinitely.

---

## 7. Tests

```bash
npm test               # the critical chain (§7.1)
npm run test:unit
npm run test:api
npm run test:contracts
npm run test:e2e
npm run test:integration
npm run test:components
npm run test:a11y
npm run test:all       # everything except coverage
npm run test:coverage
```

**Run tests under Node 24.** Under another major, `better-sqlite3` was compiled for a
different ABI and fails to load, producing database errors that look like application
bugs.

### 7.1 Suite map

| Command                  | Scope                                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| `npm test`               | `test:critical`: unit → api → contracts → e2e → integration → results  |
| `test:unit`              | `__tests__/unit`                                                       |
| `test:api`               | `__tests__/api` (serial)                                               |
| `test:contracts`         | `jest.contracts.config.js` (serial)                                    |
| `test:e2e`               | `jest.e2e.config.js` (serial)                                          |
| `test:integration`       | `jest.integration.config.js`                                           |
| `test:components`        | `__tests__/components`                                                 |
| `test:a11y`              | `__tests__/a11y` (jest-axe)                                            |
| `test:coverage`          | Jest with coverage collection                                          |
| `test:results`           | Writes `data/test-results/test-results.json` for `/admin/test-results` |
| `test:watch` / `test:ui` | Watch modes                                                            |

### 7.2 Expected result

The suite is **partially red** at handover, and this is expected:

```
4,312 tests · 4,166 passing · 74 failing · 72 skipped
23 failing suites of 167
```

These figures come from a local `npm run test:results` run and will drift as code and
tests change — the JSON that command writes under `data/test-results/` is generated
rather than committed, so read the dashboard at `/admin/test-results` or regenerate it
instead of trusting the numbers above.

Every failure is a **stale assertion**, not a product defect: components were refactored
and the tests still assert old headings and labels. They fail on string matching.
`CONTRIBUTING.md` §7 lists the largest suites and suggests an approach.

---

## 8. Troubleshooting

| Symptom                                                  | Cause and fix                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Database file not found at: …`                          | The SQLite file does not exist. Run `npm run db:migrate`.                                                                                                                                                                                                                                                                                                                 |
| `prisma migrate dev` asks for a new migration name       | The schema has drifted from the migration history. Check before naming anything: `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --exit-code` (exit 0 means in sync). Accepting the prompt writes a migration you probably did not want — and if it proposes dropping a `sqlite_autoindex_*`, SQLite will refuse to run it. |
| `UPLOADS_DIR must be set in production`                  | Intentional. Set `UPLOADS_DIR`; do not point it at `public/`.                                                                                                                                                                                                                                                                                                             |
| `NODE_MODULE_VERSION 137 … requires 141`                 | Wrong Node major. Switch to Node 24.                                                                                                                                                                                                                                                                                                                                      |
| `npm ci` fails resolving peer dependencies               | Add `--legacy-peer-deps`.                                                                                                                                                                                                                                                                                                                                                 |
| `npm ci` fails with `EBADENGINE`                         | `.npmrc` sets `engine-strict=true`. Switch to Node 24 / npm 10+.                                                                                                                                                                                                                                                                                                          |
| Registration says "CAPTCHA verification failed"          | Turnstile is only skipped for login. Set Cloudflare's test keys locally — see [§5.2](#52-cloudflare-turnstile-bot-protection).                                                                                                                                                                                                                                            |
| Cannot log in after a deploy                             | `NEXTAUTH_SECRET` changed, which invalidates every session. Otherwise check `emailVerified` and, in production, the Turnstile keys.                                                                                                                                                                                                                                       |
| Registration succeeds but login says "verify your email" | No email is configured, or the verification mail failed. See §5.3, or verify the user manually.                                                                                                                                                                                                                                                                           |
| Uploads return 404 although the files exist              | `UPLOADS_DIR` differs from where the files were written.                                                                                                                                                                                                                                                                                                                  |
| Stripe webhooks fail signature verification              | The body was parsed or modified before verification. See §5.1.                                                                                                                                                                                                                                                                                                            |
| Stripe payments stay `PENDING`                           | The webhook never reached the app. Check the endpoint URL and `STRIPE_WEBHOOK_SECRET`.                                                                                                                                                                                                                                                                                    |
| Rate limiting seems ineffective                          | The proxy is not setting client IP headers. See §6.5.                                                                                                                                                                                                                                                                                                                     |
| `SQLITE_BUSY` under load                                 | Concurrent writers. SQLite allows one writer; shorten write transactions and do not run multiple replicas against the same file.                                                                                                                                                                                                                                          |
| Container cannot write the database or uploads           | Host bind mounts are not owned by UID/GID 1001. See §6.3.                                                                                                                                                                                                                                                                                                                 |
| A scheduled `npm run db:cleanup-*` fails in Docker       | The scripts are not in the image. Run them from a checkout. See §3.2.                                                                                                                                                                                                                                                                                                     |
| Backups open with a known password                       | `BACKUP_PASSWORD` was never set. See §3.3.                                                                                                                                                                                                                                                                                                                                |
| A script fails with `MODULE_NOT_FOUND`                   | Check the relative `require`; scripts use `../shared/prisma-client`.                                                                                                                                                                                                                                                                                                      |
| Commit rejected                                          | `commitlint` needs Conventional Commits, or the secret scanner found a credential. See §3.5.                                                                                                                                                                                                                                                                              |
| Build succeeds but type errors appear at runtime         | `SKIP_TYPE_CHECK=true` was set. Never enable it for a release.                                                                                                                                                                                                                                                                                                            |

### Where to look when something breaks

| Area                 | Location                                                            |
| -------------------- | ------------------------------------------------------------------- |
| Application logs     | stdout, or `pm2 logs bwb-climbing`                                  |
| Auth and audit trail | `AuditLog` and `EmailLog` tables (`npm run db:studio`)              |
| Deployment specifics | `IMPLEMENTATION.md` §13, [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Known defects        | `IMPLEMENTATION.md` §16, `FEATURES.md` §9                           |
| Longer-form fixes    | [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)                |

---

## 9. Taking over the project

If you are taking the project on, read in this order:

1. **This guide** — get it running.
2. [`FEATURES.md`](FEATURES.md) — what the application does, screen by screen, and the
   41 documented gaps.
3. [`IMPLEMENTATION.md`](IMPLEMENTATION.md) — architecture, data model, authorization,
   integrations, and **§16 known issues**.
4. [`CONTRIBUTING.md`](CONTRIBUTING.md) — code map, workflow, how to add an API route
   safely, and the current test state.
5. [`NOTICE`](NOTICE) and [`LICENSE`](LICENSE) — the project is **AGPL-3.0-only**; running
   a modified version as a network service triggers the section 13 source-availability
   obligation. Set `NEXT_PUBLIC_SOURCE_URL` (or `NEXT_PUBLIC_GITHUB_REPO`) so the footer can
   offer that source.

### Immediate priorities

1. **Create your own credentials for every service.** Credentials used by the original
   deployment have been revoked, and none appear in this repository. Never reuse values
   from examples or documentation.
2. **Replace the placeholders** — `IMPLEMENTATION.md` §20.
3. **Set `BACKUP_PASSWORD`** and confirm existing archives were not written with the
   default ([§3.3](#33-backups)).
4. **Restrict `/api/health?detailed=true`** at the proxy ([§6.6](#66-health-check-and-monitoring)).
5. **Fix the upload endpoint.** `app/api/uploads/[...path]/route.ts` currently
   serves any file under the uploads root with no authorization (`IMPLEMENTATION.md`
   §16.1). This is a real defect, not intended behaviour.
6. **Work through the failing tests** — `CONTRIBUTING.md` §7.

### Using your own name and details

This release is a template, not a branded site. Before anyone uses your instance,
change what still carries the original project's identity:

| Where                                                                    | What to change                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data/legal/terms-of-service.md`, `data/legal/privacy-policy.md`         | Replace `[SITE NAME]`, `[SITE URL]`, `[PREVIOUS SITE URL, IF ANY]`, `[OPERATOR NAME]` and `[CONTACT EMAIL]`, and review the terms before use.                                                                                                                                                                                                                    |
| `NEXTAUTH_URL` (and `APP_URL` if you set it)                             | Your own public URL.                                                                                                                                                                                                                                                                                                                                             |
| `NEXT_PUBLIC_SITE_NAME`                                                  | The site name in page titles, the app manifest, email headers and the footer. Defaults to `Peak-bagging Community`; it never defaults to the original project's name.                                                                                                                                                                                            |
| `NEXT_PUBLIC_OPERATOR_NAME`                                              | Shown as `Operated by <name>` beside the copyright notice. Omitted when unset.                                                                                                                                                                                                                                                                                   |
| `NEXT_PUBLIC_SOURCE_URL`                                                 | Your own Corresponding Source for the footer's source link. **Anyone running a modified version as a network service must set this:** AGPL-3.0 section 13 requires you to offer that source to the people using your instance, and the link is omitted when this is unset. `NEXT_PUBLIC_GITHUB_REPO` (`owner/name`) still works as a shorthand.                  |
| `app/page.tsx`, `src/lib/email-templates.ts`                             | The original wording, and the copyright notice `Software © 2025–2026 Deividas Valaitis, licensed under AGPL-3.0-only`. That notice belongs to the software and must stay (AGPL §7(b), [`NOTICE`](NOTICE)); `NEXT_PUBLIC_OPERATOR_NAME` adds your own operator line beside it rather than presenting the original author as your operator.                        |
| `src/config/site.ts`                                                     | Every external link on the landing page and the Hall of Fame footer. All are empty by default and a link is rendered only when set, so nothing points at another site. Fill in whichever of `home`, `news`, `hallOfFame`, `manual`, `journalArchive`, `resources`, `socialMedia`, `eTalks`, `membersSurvey`, `about`, `contact`, `terms` and `privacy` you have. |
| `docs/CHANGE_REQUEST_ATTACHMENTS.md`, `docs/STRIPE_DONATIONS.md`         | The S3 example uses `[BUCKET NAME]`/`[BUCKET URL]` and the payment example uses `[STATEMENT DESCRIPTOR]`; set your own bucket and your own Stripe statement descriptor.                                                                                                                                                                                          |
| `.env.example` and any guide showing a key, account ID or sender address | Placeholders for the original project's services. Create your own; `.env.example` documents each variable.                                                                                                                                                                                                                                                       |
