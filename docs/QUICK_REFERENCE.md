# Quick Reference

Common commands and paths for the BWB application. For anything longer than a
one-liner, follow the link to the canonical document.

> This page is a shortcut. [`SETUP.md`](../SETUP.md) is the operational guide and
> [`docs/INDEX.md`](INDEX.md) is the full index.

---

## Development

```bash
npm run dev                  # dev server on http://localhost:1345
npm run type-check           # tsc --noEmit
npm run lint                 # ESLint (warnings tolerated)
npm run lint:fix             # ESLint with autofix
npm run format               # Prettier write
npm run format:check         # Prettier check
npm run check:all            # ESLint + tsc + next build (69-warning ratchet)
npm run security:secrets     # credential scan
```

Runtime is pinned to **Node 24** (`>=24 <25`). Another major fails on native
modules; `scripts/dev/npm-node-24.sh` activates and rebuilds for you.

### First run

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local   # then set the values below
npm run db:generate && npm run db:migrate && npm run db:seed
npm run dev
```

```env
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:1345
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

The Turnstile test keys are required: only **login** skips CAPTCHA in
development, so registration and password reset fail without a secret.

No demo credentials are documented here. `npm run db:seed` prints a generated
password for `demo-admin` / `demo-user` / `demo-member` once, or set
`DEMO_USER_PASSWORD`. Demo users are skipped when `NODE_ENV=production`.

## Tests

```bash
npm test                     # critical chain: unit → api → contracts → e2e → integration → results
npm run test:unit
npm run test:api
npm run test:contracts
npm run test:e2e
npm run test:integration
npm run test:components
npm run test:a11y
npm run test:all             # everything except coverage
npm run test:coverage        # 50% thresholds
npx jest __tests__/api/users.api.test.ts   # one file
```

Run under Node 24. Database-touching suites use `--runInBand` because SQLite
allows one writer. The suite is **partially red at handover** — stale copy
assertions, not product defects ([`CONTRIBUTING.md`](../CONTRIBUTING.md) §7).

## Database

```bash
npm run db:generate          # generate the Prisma client
npm run db:migrate           # dev: create/apply migrations
npx prisma migrate deploy    # production: apply only
npm run db:seed              # reference data + synthetic demo users
npm run db:studio            # Prisma Studio (localhost:5555)
npm run db:export-members    # members to CSV
npm run db:cleanup-logs      # prune audit logs
npm run db:cleanup-rate-limits
npm run db:delete-all:dry    # preview a full wipe (DANGER without :dry)
npm run db:reset-password -- --admins '<password>'
npm run db:reset-password -- <username> '<password>'
```

**Never** run `prisma migrate reset` against production, and never edit an
applied migration. `scripts/admin` and `scripts/data` are **not** inside the
Docker image — run those from a checkout.

### Pulling production data

```bash
npm run db:pull              # download a copy to ./backups/pulled-from-prod/
npm run db:pull:restore      # download and restore into ./prisma/dev.db
npm run db:pull:compare      # compare local and production schemas
npm run db:pull:schema       # fetch the production schema only
```

Edit `REMOTE_HOST` in `scripts/deployment/pull-db.sh` first.

## Deployment

```bash
npm run deploy               # scripts/deployment/deploy.sh — builds and ships a Docker image
```

The script builds locally, ships the image and compose file, creates the server
`.env` if missing, ensures `/srv/bwb/{data,uploads,backups}` are owned by
**UID/GID 1001**, takes a pre-deployment backup, applies migrations in a one-off
container, recreates the container and polls `/api/health`. Edit `REMOTE_USER`,
`REMOTE_HOST`, `REMOTE_PATH` and `DOMAIN` first.

Verify:

```bash
docker ps --filter name=bwb-climbing
docker logs bwb-climbing --tail 50
curl -s https://<your-domain>/api/health
```

The generated server `.env` does **not** include `BACKUP_PASSWORD` or any
integration key — add those by hand. No production hostname is configured in this
repository; every domain is a placeholder.

PM2 alternative: `npm ci --legacy-peer-deps && npm run db:generate && npm run build`,
then `pm2 start npm --name bwb-climbing -- start`.

Full detail: [`SETUP.md`](../SETUP.md) §6, [`docs/DEPLOYMENT.md`](DEPLOYMENT.md),
[`docs/INTEGRATIONS.md`](INTEGRATIONS.md).

## Application map

| Area         | Where                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public pages | `app/` (landing, auth, `/donate`, `/contact`, `/hof-tables`, `/journal`, `/awards`, `/other`, `/p-index`)                                                                                               |
| Member pages | `app/(authenticated)/` — `/home`, `/profile`, `/my-bags`, `/member-hof-tables`, `/sponsors`, `/support`                                                                                                 |
| Admin pages  | `app/(authenticated)/admin/` — members, data entry, years, HoFs, configuration, consent types, interests, journal, documents, helpdesk, changes, backups, logs, test results, roles, sponsors, settings |
| API          | `app/api/**/route.ts` — 93 handlers                                                                                                                                                                     |
| Auth         | `src/lib/auth.ts`, `middleware.ts`, `src/lib/api-auth.ts`, `src/lib/journal-auth.ts`                                                                                                                    |
| Domain       | `src/lib/hofQualificationRules.ts`, `src/lib/hofTierUtils.ts`, `src/lib/recalculate-totals.ts`                                                                                                          |
| Uploads      | `src/lib/constants.ts`, `app/api/uploads/[...path]/route.ts`                                                                                                                                            |

**`app/(authenticated)/` is not a guard** — a page is protected only if its path
is in the `middleware.ts` matcher. See [`SECURITY.md`](../SECURITY.md#authorization).

Admin routes for HoFs and years have no sidebar entry:
`/admin/hofs`, `/admin/years`, `/admin/configuration`, `/admin/data-entry`.

## Hall of Fame concepts

- **Qualification** requires every enabled threshold in a `HofYearConfig`:
  minimum total peaks, minimum foreign peaks, minimum FPR, minimum age.
- **LCE — Large Country Exception** (`lceMinPeaks` / `lceMinForeignPeaks` /
  `lceMinFpr`) relaxes thresholds for members resident in configured countries.
- **FPR — Foreign Peak Ratio**: foreign peaks ÷ total peaks × 100.
- **Six award tiers**: Bronze, Silver, Gold, Emerald, Sapphire, Diamond.
- **Cumulative totals**: `totalPeaks` sums all active years by `displayOrder`,
  starting from the seeded **`BASELINE`** year (pre-2019 opening balances).
  Recalculated on create and update; **not** on delete.
- **Progress Register** exclusions (retired / deceased / inactive) apply only to
  the non-qualified list, not to qualification.

Deep dives: [`docs/HOF_SYSTEM.md`](HOF_SYSTEM.md),
[`docs/QUALIFICATION_RULES.md`](QUALIFICATION_RULES.md),
[`docs/TOTAL_PEAKS_RECALCULATION.md`](TOTAL_PEAKS_RECALCULATION.md).

## Git and versioning

```bash
npm run commit               # interactive Conventional Commit helper
npm run commit:suggest       # suggest a message from the staged diff
docker compose -f docker-compose.prod.yml up -d --build   # rebuild locally
```

`feat:` → MINOR, `fix:` → PATCH, `BREAKING CHANGE:` → MAJOR. Scopes come from
`commitlint.config.cjs`. Hooks enforce lint-staged, the secret scan and the commit
format. See [`docs/AUTOMATIC_VERSIONING.md`](AUTOMATIC_VERSIONING.md).

## Quick help

| Issue                                           | First thing to try                                  |
| ----------------------------------------------- | --------------------------------------------------- |
| Dev server will not start                       | Check port 1345 (`lsof -i :1345`)                   |
| Database locked                                 | Serialise tests; stop extra dev servers             |
| `Database file not found`                       | `npm run db:migrate`                                |
| Native module / ABI error                       | Switch to Node 24                                   |
| Registration says "CAPTCHA verification failed" | Add the Turnstile test keys                         |
| Type errors                                     | `npm run db:generate`, then `npm run type-check`    |
| Migration conflicts                             | Never `migrate reset`; add a new migration          |
| Uploads 404                                     | `UPLOADS_DIR` differs from where files were written |
| Anyone logged out                               | `NEXTAUTH_SECRET` changed                           |
| New-user email never arrives                    | Brevo is not configured (see below)                 |
| Commit rejected                                 | Commitlint format, or the secret scanner fired      |

**Email:** without `BREVO_API_KEY`, registration succeeds but no verification mail
is sent, so new accounts can never log in. Set it, or use
`DEV_EMAIL_RECIPIENT` in development.

Deeper diagnosis: [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) and
[`SETUP.md`](../SETUP.md) §8.

## Documentation

- [`README.md`](../README.md) — orientation
- [`SETUP.md`](../SETUP.md) — install, configure, deploy, operate
- [`FEATURES.md`](../FEATURES.md) — every screen, plus §9 known gaps
- [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) — architecture, data model, §16 defects
- [`SECURITY.md`](../SECURITY.md) — security model and accepted risks
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — workflow and conventions
- [`docs/INDEX.md`](INDEX.md) — everything else
