# Development Guide

This document is for whoever picks up active development of this codebase. It
assumes you have the application running — if not, start with the
[README](README.md), then read [`IMPLEMENTATION.md`](IMPLEMENTATION.md) for how
the system works.

---

## 1. Read these first

| Document                                             | What it gives you                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`README.md`](README.md)                             | Orientation                                                                           |
| [`SETUP.md`](SETUP.md)                               | Install, configure, run, deploy, troubleshoot                                         |
| [`FEATURES.md`](FEATURES.md)                         | Every screen and capability, UX and error handling, and 41 known gaps (§9)            |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md)             | Architecture, data model, authorization model, integrations, deployment, known issues |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md) §16         | **Known defects.** Read before changing anything security-related                     |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md) §20         | Placeholders you must replace before deploying                                        |
| [`SECURITY.md`](SECURITY.md)                         | Security policy, accepted risks, how to report a vulnerability                        |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)           | Behaviour expected in project spaces                                                  |
| [`docs/QUICK_START.md`](docs/QUICK_START.md)         | Shortest local path, core commands, commit workflow                                   |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md)     | Per-endpoint request/response reference                                               |
| [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) | Symptom-by-symptom diagnosis, including known-defect triage                           |
| [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)       | Connecting Stripe, Brevo, Turnstile, OpenAI and GitHub                                |
| [`docs/INDEX.md`](docs/INDEX.md)                     | Index of every document under `docs/`                                                 |

> **Authorization caveat:** comments in some API routes claim the middleware
> "already validated auth". For the administrative families listed in §4 that is
> true now; everywhere else it means _authentication_ only, not _authorization_ —
> see §4.

---

## 2. Code map

Start here when you need to find something.

| I want to change…                  | Look in                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- |
| A page or its layout               | `app/`, `app/(authenticated)/`                                         |
| An HTTP endpoint                   | `app/api/**/route.ts`                                                  |
| A UI component                     | `app/components/features/` (domain), `app/components/ui/` (primitives) |
| Route protection                   | `middleware.ts`, `src/lib/routeAuthz.ts`, `src/lib/api-auth.ts`        |
| Authentication or session handling | `src/lib/auth.ts`, `src/lib/identifierUtils.ts`, `src/lib/tokens.ts`   |
| Journal authoring rules            | `src/lib/journal-auth.ts`                                              |
| The consent gate                   | `src/lib/consent-check.ts`, `app/(authenticated)/template.tsx`         |
| Rate limiting                      | `src/lib/rateLimit.ts`                                                 |
| Audit logging                      | `src/lib/auditLog.ts`                                                  |
| A database model                   | `prisma/schema.prisma`, then migrate                                   |
| Hall of Fame rules                 | `src/lib/hofQualificationRules.ts`, `src/lib/hofTierUtils.ts`          |
| Cumulative totals                  | `src/lib/recalculate-totals.ts`                                        |
| Email                              | `src/lib/email.ts`, `src/lib/email-templates.ts`                       |
| Uploads and file serving           | `src/lib/constants.ts`, `app/api/uploads/[...path]/route.ts`           |
| Funding bar figures                | `src/lib/funding-settings.ts`, `src/lib/funding-bar-utils.ts`          |
| Client failure/retry patterns      | `src/lib/fetchWithTimeout.ts`, `src/lib/changeRequestClient.ts`        |
| Seed data                          | `prisma/seed.js`, `scripts/seed/`                                      |
| Operational scripts                | `scripts/` (inventory: `IMPLEMENTATION.md` §18)                        |
| Tests                              | `__tests__/`, `jest.*.config.js`                                       |

**Routing is filesystem-based.** `app/api/users/[id]/route.ts` becomes
`/api/users/:id`. There is no route registry, and **a new route is unprotected
until you add it to the matcher or guard it in-route** — see §4.

---

## 3. Development workflow

### Setup

```bash
npm ci --legacy-peer-deps     # --legacy-peer-deps is required
cp .env.example .env.local    # then set the values below
```

Minimum for a working local instance:

```env
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:1345
DATABASE_URL="file:./prisma/dev.db"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

The Turnstile keys matter: only **login** skips CAPTCHA in development.
Registration, password reset and resend-verification always verify, so without a
secret those forms fail with "CAPTCHA verification failed". The values above are
Cloudflare's public always-pass test pair.

```bash
npm run db:generate
npm run db:migrate
npm run db:seed               # reference data + synthetic demo users
npm run dev                   # http://localhost:1345
```

`npm run db:seed` prints a generated password for the demo accounts
(`demo-admin`, `demo-user`, `demo-member`). Set `DEMO_USER_PASSWORD` to choose
your own. Note that a fresh seed gives the demo users no consent rows, so they
are not prompted for legal consent (`IMPLEMENTATION.md` §11.4).

### Before you commit

```bash
npm run type-check
npm run lint
npm test
```

`npm run check:all` bundles a fuller gate — ESLint, `tsc --noEmit` and a real
`next build` — and is the closest local match to CI. It does **not** run tests or
formatting. It enforces a ratcheted **69-warning** ESLint budget: `npm run lint`
alone tolerates warnings, `check:all` rejects any increase beyond that count.
Lower the budget in `scripts/check-all.sh` as warnings are fixed; never raise it.

Husky runs `lint-staged` (ESLint + Prettier) and the secret scanner on every
commit. Commits must follow
[Conventional Commits](https://www.conventionalcommits.org/) — `commitlint`
enforces this, and the `prepare-commit-msg` hook can infer a scope from the
files you staged.

Allowed scopes: `ui`, `api`, `db`, `auth`, `docs`, `test`, `deploy`, `deps`,
`hof`, `data`, `admin`, `infra`, `tooling`, `legal`.

Use `legal` for changes to `LICENSE`, `NOTICE`, `LICENSES/`, or the licensing
text in `README.md` and `CONTRIBUTING.md`.

The commit type drives **automatic versioning**: `feat:` is a MINOR bump, `fix:`
a PATCH, and a `BREAKING CHANGE:` footer a MAJOR. The `prepare-commit-msg` hook
(`.husky/prepare-commit-msg`) infers a scope from the files you staged and seeds
the version bump. `npm run commit` opens an interactive helper, and
`npm run commit:suggest` proposes a message from your staged diff. See
[`docs/AUTOMATIC_VERSIONING.md`](docs/AUTOMATIC_VERSIONING.md).

`.gitmessage` is the same list as a commit template. It is not wired up
automatically — opt in once per clone:

```bash
git config commit.template .gitmessage
```

```bash
git checkout -b feature/add-route-logging
# ... make changes ...
git commit -m "feat(api): add route logging"
```

### Never commit

Real member data, credentials, or addresses. `.env*` is gitignored, the
pre-commit hook scans for credential patterns, and
`scripts/security/scan-secrets.js` also cross-references your local `.env`
values against the tracked tree. If it fires, do not bypass it — rotate the
credential and remove the value.

---

## 4. Adding an API route

This is the area with the most sharp edges.

`middleware.ts` protects a fixed list of path prefixes. **A new route is not
protected by default.** You must do one of:

1. **Add a matcher prefix** in `middleware.ts`, or
2. **Guard it in-route** using `src/lib/api-auth.ts`:

   ```ts
   import { getSession, isAdmin } from "@/src/lib/api-auth";

   export async function GET() {
     const session = await getSession(); // throws if middleware did not run
     // or: const session = await getOptionalSession();  // returns null instead
   }
   ```

3. **Declare it public** in `PUBLIC_API_ROUTES` in
   `__tests__/security/api-route-auth-coverage.test.ts`, with a reason.

If you do none of these, that test fails and CI goes red. This is deliberate:
an unguarded endpoint used to be shipped.

### Conventions

- **Dynamic params are async** in Next.js 16:
  ```ts
  export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  }
  ```
- **Errors:** `NextResponse.json({ error: "..." }, { status: 4xx })`, optionally
  with `details`. `401` vs `403` is not used consistently across the codebase —
  follow the surrounding route rather than inventing a new convention.
- **Paginated lists:** `{ data, total, page, limit, pages }`.
- **The matcher enforces roles for a fixed set of families.** It requires
  `ADMIN` for `/admin`, `/api/admin`, `/api/change-requests`, `/api/backup`,
  `/api/documents`, `/api/hof-entries` and the `/api/users` collection, and for
  every method except the bare collection `GET` of `/api/hofs`, `/api/years`,
  `/api/consent-types`, `/api/interests` and `/api/app-settings`. Every other
  matcher prefix proves only that a session exists. The comment _"Middleware
  ensures user is authenticated and is ADMIN"_ found on several routes is still
  **no substitute** for an in-route check: when a handler reads sensitive data,
  check the role in-route with `isAdmin()`. **If you rename or move a route,
  re-check the matcher.**
- **The coverage test is coarse.** `GUARD_PATTERN` in
  `__tests__/security/api-route-auth-coverage.test.ts` counts `getSession()` —
  and even `verifyTurnstileToken` — as a guard, and never inspects the role.
  Passing the test does not mean a route is correctly authorized. The role rule
  itself is pinned separately by `__tests__/unit/routeAuthz.test.ts`, so if you
  change `requiresAdminRole()`, expect that suite to be the one that tells you
  what you broke.
- **Journal routes** additionally gate published-content changes through
  `isJournalEditor()` (`src/lib/journal-auth.ts`).
- **Log admin mutations** with `logEvent` from `src/lib/auditLog.ts`, matching
  the `EventType` used by neighbouring routes.

---

## 5. Adding a page

1. Create `app/.../page.tsx`. The parenthesised groups (`(authenticated)`) are
   folder names, **not** URL segments and **not** guards.
2. **A page is protected only if its path is in the `middleware.ts` matcher.**
   `app/(authenticated)/layout.tsx` is a client component that renders children
   unconditionally, so placing a page in that group does not require a session —
   several existing member pages are anonymously reachable. If the page needs a
   session, add its route to the matcher and add a `redirect()` guard as defence
   in depth.
3. Pages in the group inherit `template.tsx`, which runs the required-consent
   check and diverts to `/consent-prompt`.
4. Server Components by default. Add `"use client"` only when you need state,
   effects, or browser APIs.
5. Use existing primitives from `app/components/ui/` before writing new ones.
6. Keep the dark theme: `bg-dark-*`, `text-primary-*` (see `app/globals.css`).

---

## 6. Database changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create the migration
npm run db:migrate          # dev: prisma migrate dev
# 3. Production applies with:
npx prisma migrate deploy
```

- Migrations are committed under `prisma/migrations/`. `.gitignore` ignores
  `*.sql` **except** `prisma/migrations/**/migration.sql`.
- Never use `migrate dev` against production — it can reset the database.
- **Never edit an applied migration.** Add a new one. Production runs
  `prisma migrate deploy`, which applies history verbatim and will not run your
  edit.
- Reference data (ISO countries/regions) is loaded from `prisma/countries/` and
  `prisma/regions/` by the seed script, not by migrations.
- **Inside Docker**, migrations run in the container (the `prisma` CLI is a
  runtime dependency, so it is present):
  `docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy`.
  `scripts/deployment/deploy.sh` already does this in a one-off container.
- **Env loading:** `prisma.config.ts` loads `.env` → `.env.local` → `.env.<NODE_ENV>`
  → `.env.<NODE_ENV>.local` with `override: false`, so **`.env` wins** for the CLI
  while Next.js prefers `.env.local`. Never put conflicting values in both.
- **Adding a reference table** means writing a seeder under `scripts/seed/` and
  calling it from `prisma/seed.js` in dependency order (`IMPLEMENTATION.md` §19).
  Seeders must upsert so `db:seed` stays idempotent.

### Scripts that touch the database

Always use the shared client:

```js
const prisma = require("../shared/prisma-client");
```

It loads `.env`/`.env.local` itself and refuses to run against a database file
that does not exist. A bare `new PrismaClient()` will not see `DATABASE_URL`
under plain `node` and will fail confusingly.

---

## 7. Testing

```bash
npm test                 # test:critical — unit → api → contracts → e2e → integration → results
npm run test:unit
npm run test:api
npm run test:contracts
npm run test:e2e
npm run test:integration
npm run test:components
npm run test:a11y
npm run test:all         # everything except coverage
npm run test:coverage
npm run test:results     # writes data/test-results/test-results.json for /admin/test-results
```

**Run tests under Node 24.** Under Node 25 the `better-sqlite3` native binding
was compiled for a different ABI and fails to load, producing misleading
database errors that look like application bugs. If you see
`NODE_MODULE_VERSION` in a failure, that is the cause.

### Current state — please read

At handover the suite is **partially red**:

```
4,312 tests · 4,166 passing · 74 failing · 72 skipped
23 failing suites of 167
```

These figures are a point-in-time snapshot from a local `npm run test:results` run.
The JSON it writes under `data/test-results/` is generated rather than committed,
so regenerate the numbers yourself with `npm run test:results`, or read
`/admin/test-results`, instead of trusting the snapshot above.

**Every failure is stale test copy, not a product defect.** Components were
refactored — headings changed, labels were renamed, one component became an
async server component — and the assertions were never updated. They fail on
string matching, not on logic.

The largest offenders:

| Suite                                              | Failures |
| -------------------------------------------------- | -------- |
| `ProgressRegisterExpandedDetails.test.tsx`         | 8        |
| `ConfigurationForm.test.tsx`                       | 7        |
| `HofMemberExpandedDetails-inline-editing.test.tsx` | 7        |
| `HofTableFilters.test.tsx`                         | 6        |
| `HofForm.test.tsx`                                 | 5        |
| `HofInfoPanels.test.tsx`                           | 5        |
| `UserProfile.test.tsx`                             | 5        |
| `ConfigurationManagement.test.tsx`                 | 4        |
| `MembersManagement.test.tsx`                       | 4        |

Suggested approach: fix them a suite at a time by reading what the component
renders now and updating the assertion — or delete the suite if it tests
behaviour that no longer exists. Do not weaken assertions to make them pass.

### Conventions for new tests

- `jest.setup.js` installs global mocks, including a `fetch` stub — jsdom has no
  `fetch`, so components that call it in an effect would otherwise throw.
  Override per call with `(global.fetch as jest.Mock).mockResolvedValueOnce(...)`.
- `jest.globalSetup.js` applies migrations to `prisma/test.db` before the run.
- `jest.mock` must be at **module top level**, not inside `describe`, or it is
  not hoisted above the imports and has no effect.
- Security tests live in `__tests__/security/` and must keep passing — the
  auth-coverage test in particular fails when a new route is neither
  matcher-covered, declared in `PUBLIC_API_ROUTES`, nor guarded.
- `test:coverage` enforces **50%** branches/functions/lines/statements
  (`jest.config.js`); adding untested code can push the whole run below it.

---

## 8. Code style

ESLint (`eslint.config.mjs`) and Prettier (`.prettierrc.json`) are configured;
run `npm run format` before committing.

`eslint.config.mjs` is an **ESLint 9 flat config** and is the only lint config —
there is no `.eslintrc`. It enables `@typescript-eslint` (recommended),
`jsx-a11y` (recommended, plus explicit rules) and `react-hooks`, and it forbids
relative parent imports (`../*`) in favour of the `@/` path aliases. Note that
`**/__tests__/**` is in the config's `ignores` list, so test files are not
linted.

Several rules are deliberately **off**, so do not rely on lint to catch them:
`@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`,
`react-hooks/exhaustive-deps` and `@typescript-eslint/no-require-imports`. Treat
the conventions below as the real standard.

Next.js-specific rules (`@next/next/*`) are **not** enabled: `eslint-config-next`
was never wired into the flat config and has been removed. If you want them,
install it and spread it into the config array:

```bash
npm i -D eslint-config-next
```

```js
// eslint.config.mjs
import next from "eslint-config-next";
export default [/* ...existing entries... */ ...next()];
```

Expect new findings when you do — the codebase has never been linted with those
rules.

- TypeScript, strict (`tsconfig.json` sets `"strict": true`). Avoid `any` — prefer
  precise types, even though the lint rule is off.
- Function components and hooks.
- Prefer editing an existing component or helper over adding a parallel one.
- Formatting is Prettier with `printWidth: 100`; `npm run format` rewrites,
  `npm run format:check` verifies without writing.
- Run `npm run security:secrets` before pushing if you touched anything that
  could contain a credential — it is the same scanner the pre-commit hook runs,
  with the same two tiers.
- `npm run sbom` produces a CycloneDX software bill of materials for a release.
- `npm run check:all` runs ESLint + `tsc --noEmit` + `next build`, with a
  ratcheted budget for the 69 known accessibility warnings. **Lower that budget
  as you fix them; never raise it.**

---

## 9. Gotchas

| Symptom                                               | Cause                                                                             |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Database file not found`                             | Run `npm run db:migrate`; the client fails fast by design                         |
| `UPLOADS_DIR must be set in production`               | Intentional — a `public/` fallback would bypass API authorization                 |
| Native module ABI error                               | Wrong Node major; use Node 24                                                     |
| `npm ci` fails on peer deps                           | Use `--legacy-peer-deps`                                                          |
| Registration fails with "CAPTCHA verification failed" | Development skips Turnstile for **login only**; set the test keys (§3)            |
| A script fails with `MODULE_NOT_FOUND`                | Check the relative `require` path; scripts use `../shared/prisma-client`          |
| A maintenance script 404s inside Docker               | `scripts/admin` and `scripts/data` are not in the image; run from a checkout      |
| Commit rejected                                       | `commitlint` requires Conventional Commits, or the secret scanner found something |
| `check:all` fails with new ESLint warnings            | The warning budget is a ratchet; fix the warnings rather than raising it          |

### Where to be careful

- **`middleware.ts`** — the authorization boundary. Changing the matcher changes
  what is protected, and the matcher proves _authentication_, not _authorization_
  (`IMPLEMENTATION.md` §16.5).
- **Uploads** — `app/api/uploads/[...path]/route.ts` serves any file under the
  uploads root **without authorization**. This is a known defect
  (`IMPLEMENTATION.md` §16.1), not intended behaviour.
- **`getSession()` throws.** Any route an anonymous caller can reach must use
  `getOptionalSession()`, or the throw is caught and returned as a `500`.
- **The consent gate is client-rendered and fails open**
  (`consent-check.ts`, `ConsentRedirect.tsx`). Do not treat it as a security
  boundary.
- **Cumulative totals** — `recalculate-totals.ts` is not transactional with the
  write that triggers it, so totals can drift after an interrupted operation.
- **Notifications** — the email layer is minimal: helpdesk replies, donations,
  change requests, journal publication and consent assignment send nothing. If
  your change implies a notification, you have to add it
  (`IMPLEMENTATION.md` §10.3).
- **Upload paths drift** — some subsystems write under `UPLOADS_DIR` but link or
  delete under `public/uploads/`. When touching attachment storage, check both
  ends.
- **`ChangeRequestTicketCounter`** — sequential IDs are a contention point.

---

## 10. Pull requests

**This project has been handed over.** It is published so that somebody else can
continue it, not as a repository that reviews and merges contributions: the
original author is not accepting pull requests and cannot promise to be available.
Fork it and work in your own copy ([`README.md` → Taking this on](README.md#taking-this-on)).
The checklist below is what a change should satisfy before it is worth carrying
forward — it is not a promise of review.

`.github/PULL_REQUEST_TEMPLATE.md` lists the same checklist. In short:

- `npm run type-check`, `npm run lint`, `npm test` and `npm run security:secrets` pass.
- New API routes are matcher-covered or guarded in-route (§4).
- No real member data, email addresses, or credentials anywhere — code, tests,
  fixtures, docs, or commit messages.
- Documentation updated when behaviour or setup changed.

Branch names are descriptive (`feature/…`, `fix/…`, `docs/…`) and commit types follow
Conventional Commits (§3). This repository carries Dependabot alerts but no
`.github/dependabot.yml`, and automated security-update pull requests are turned
off — see
[`SECURITY.md`](SECURITY.md#dependency-and-supply-chain-security).
`.github/workflows/security-audit.yml` runs the secret scan and a dependency audit
on every push.

---

## 11. Reporting and legal

- Security issues: read [`SECURITY.md`](SECURITY.md) and §16 of
  [`IMPLEMENTATION.md`](IMPLEMENTATION.md) first — several limitations are already
  known and documented. Fix security problems in your own fork. If you find real
  personal data or a working credential in the repository, report it privately using
  the "Report a vulnerability" button on the Security tab rather than opening a
  public issue. Those private reports reach the repository owner; nothing else in
  this repository is monitored.
- Conduct: participation is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- Licensing: the project is **AGPL-3.0-only**. Attribution requirements and
  third-party licences are in [`NOTICE`](NOTICE). If you redistribute a modified
  version, including running it as a network service, AGPL section 13 applies.

### Contribution licensing (inbound)

Copyright in this project is held by Deividas Valaitis (see [`NOTICE`](NOTICE)).

**This repository is not accepting contributions** (§10), so none of the following
is being asked of you here. It is the licence a fork should attach to inbound
changes if it wants them to stay redistributable on the same terms.

**By submitting a contribution — a pull request, patch, or any other change —
you agree that your contribution is licensed to the project and to everyone who
receives it under the GNU AGPL, version 3 only, and that you have the right to
grant that.** You keep the copyright in your own contribution; you are not
assigning it. This is the same licence the project already carries, so
contributing costs you no rights you would otherwise have.

You are confirming in particular that:

1. The contribution is your own original work, or you otherwise have the right
   to submit it under these terms.
2. It contains no third-party code, text, image, or data that is not compatible
   with AGPL-3.0-only — if it does, say so in the pull request and record the
   attribution in [`NOTICE`](NOTICE).
3. It contains no real member data and no credentials.

**Why this matters.** The project can only stay free if everyone who adds to it
grants the same freedoms they received. Without this grant a contributor would
retain exclusive rights over their own patch, and the project could never be
safely relicensed, forked, or redistributed as a whole. Nothing here transfers
your copyright, and nothing here lets anyone relicense the project away from the
AGPL.
