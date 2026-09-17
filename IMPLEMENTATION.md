# BWB — Implementation Reference

**System:** Baggers Without Borders (BWB) — climbing and hill-bagging community platform
**Application:** `bwb-climbing-app`
**Version:** 0.1218.0
**License:** AGPL-3.0-only (see `LICENSE`, `NOTICE`)
**Audience:** system administrators, DevOps engineers, and developers taking over this codebase

**Related documents**

| Document                                         | Covers                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| [`SETUP.md`](SETUP.md)                           | Install, configure, run, deploy, operate                              |
| [`FEATURES.md`](FEATURES.md)                     | Screen-by-screen behaviour, UX and error handling, 41 known gaps (§9) |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)             | Code map, workflow, adding a route, current test state                |
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Per-endpoint request/response reference                               |
| [`SECURITY.md`](SECURITY.md)                     | Security policy, accepted risks, reporting                            |

---

## 1. Purpose and scope

This document describes how the system is built, how it runs, how data flows through it, and what an operator must know to deploy and maintain it. It is the primary technical reference. It intentionally documents behaviour as implemented, including known defects (§16).

It does **not** contain credentials, member data, or environment-specific secrets. Everything secret is supplied through environment variables (§12).

---

## 2. System summary

A server-rendered Next.js application backed by a single SQLite file. There is no separate database server, no message broker, and no cache tier. All state is either in the SQLite file, on the local filesystem under the uploads root, or in signed cookies.

| Characteristic  | Value                                                                        |
| --------------- | ---------------------------------------------------------------------------- |
| Deployment unit | One Node.js process (Docker container or PM2 process)                        |
| HTTP port       | 1345                                                                         |
| Database        | SQLite, single file, accessed via Prisma 7 + `better-sqlite3` driver adapter |
| Session model   | Stateless JWT in an HttpOnly cookie (NextAuth v4)                            |
| Rendering       | React Server Components + client components (Next.js App Router)             |
| Scale model     | Vertical only. Single writer. Not horizontally scalable as shipped.          |
| Background work | None. No cron, no queue, no workers. All work is request-scoped.             |

**Deliberate constraints worth knowing before you change anything:**

- SQLite means **one writer at a time**. Running multiple app replicas against one file over a network filesystem will corrupt it. Scale up, not out.
- There is **no background job runner**. Scheduled or long-running work (backups, recalculations) is triggered by an HTTP request or a CLI script.
- Sessions are stateless JWTs. Revoking a user's access requires rotating `NEXTAUTH_SECRET` (invalidates everyone) or changing the user's role and waiting for token expiry — there is no server-side session store.

---

## 3. Architecture

### 3.1 Request lifecycle

```
Browser
  │
  ├─ static asset ──────────────► /public/*  (served directly by Next.js)
  │
  ├─ page request ──────────────► middleware.ts  (NextAuth withAuth)
  │                                   │
  │                                   ├─ no session  ──► redirect /login
  │                                   └─ session      ──► App Router page (RSC)
  │                                                          │
  │                                                          └─ Prisma ──► SQLite file
  │
  └─ API request ───────────────► middleware.ts  (matcher-gated, see §6.3)
                                      │
                                      ├─ role/ownership rejection ──► 401 / 403
                                      └─ pass ──► app/api/**/route.ts
                                                      │
                                                      ├─ getServerSession()  (in-route guard)
                                                      └─ Prisma ──► SQLite file
```

**Only matcher-listed paths are gated.** `middleware.ts` is an allow-list, so a page or API route whose prefix is not in the matcher runs with no middleware check at all. The `authorized` callback requires merely `!!token`, so for every matched prefix except `/admin`, `/api/admin` and `/api/change-requests` the middleware proves _authentication_, never _authorization_. See §6.3 and §16.5.

### 3.2 Directory layout

| Path                                    | Contents                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                                  | Next.js App Router. Routing is filesystem-based.                                                                                                            |
| `app/api/**/route.ts`                   | 93 HTTP handlers. Each file is an endpoint group (GET/POST/PATCH/DELETE).                                                                                   |
| `app/(authenticated)/`                  | Route group for signed-in pages. Parentheses = group, not a URL segment.                                                                                    |
| `app/components/`                       | `features/` (domain components) and `ui/` (primitives).                                                                                                     |
| `src/lib/`                              | Server-side domain and infrastructure modules.                                                                                                              |
| `prisma/`                               | Schema, migration history, seed script, ISO 3166 reference data.                                                                                            |
| `scripts/`                              | CLI utilities: seeding, data admin, deployment, versioning, security scanning. `scripts/publish/` is release tooling and is excluded from the release tree. |
| `__tests__/`                            | Jest suites (unit, api, components, integration, a11y, security).                                                                                           |
| `data/legal/`                           | Privacy policy and ToS markdown, served at runtime.                                                                                                         |
| `public/`                               | Static assets served verbatim.                                                                                                                              |
| `uploads/` (dev) / `UPLOADS_DIR` (prod) | User-uploaded files. **Outside `public/` by design.**                                                                                                       |

### 3.3 Module responsibilities (`src/lib/`)

| Module                                          | Responsibility                                                                                |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `prisma.ts`                                     | Prisma client singleton, absolute `file:` URL resolution, fail-fast if the DB file is missing |
| `auth.ts`                                       | NextAuth options: credentials provider, JWT callbacks, Turnstile verification                 |
| `api-auth.ts`                                   | Session accessors for route handlers (`getSession`, `getOptionalSession`, `isAdmin`)          |
| `auditLog.ts`                                   | Writes `AuditLog` rows; parses user agent and Cloudflare geo headers                          |
| `rateLimit.ts`                                  | DB-backed fixed-window rate limiting (`RateLimitAttempt`)                                     |
| `tokens.ts`                                     | Cryptographically random tokens + expiry for email verification and password reset            |
| `turnstile.ts`                                  | Server-side CAPTCHA verification with fail-open on network errors                             |
| `email.ts` / `email-templates.ts`               | Brevo transactional email + templates                                                         |
| `stripe.ts`                                     | Stripe SDK singleton                                                                          |
| `hofQualificationRules.ts`                      | Hall of Fame eligibility predicates (§7.2)                                                    |
| `hofTierUtils.ts`                               | Award tier colour mapping, member sorting, rank assignment                                    |
| `recalculate-totals.ts`                         | Recomputes cumulative peak totals for a user/HoF pair                                         |
| `constants.ts`                                  | Upload directory resolution, upload path prefixes, validation messages                        |
| `fileUtils.ts`                                  | Path normalisation and safe resolution                                                        |
| `markdown-table-*.ts`                           | Markdown table alignment and style presets for the journal editor                             |
| `consent-check.ts`                              | Required-consent query used by the authenticated layout — legal consents only                 |
| `journal-auth.ts`                               | Journal-editor allow-list check (`journal_editor_ids` AppSetting)                             |
| `funding-settings.ts`                           | Reads the `funding_*` AppSettings for the funding bar                                         |
| `identifierUtils.ts`                            | Parses a login identifier as email or username                                                |
| `imageOptimizer.ts`                             | sharp re-encode helpers (WebP, dimension caps) shared by upload routes                        |
| `fetchWithTimeout.ts`, `changeRequestClient.ts` | Client-side abort timeout and retry-on-read wrapper for the changes UI                        |
| `geoip.ts`                                      | Extracts IP and country from Cloudflare/proxy headers                                         |
| `passwordStrength.ts`, `validation/`            | Input validation                                                                              |

---

## 4. Technology stack

| Layer            | Technology                                                                 | Version                     |
| ---------------- | -------------------------------------------------------------------------- | --------------------------- |
| Runtime          | Node.js                                                                    | 24.x (`>=24 <25`, enforced) |
| Package manager  | npm                                                                        | 10+ (<12)                   |
| Framework        | Next.js (App Router)                                                       | 16.1.6                      |
| UI               | React / React DOM                                                          | 19.2.4                      |
| Language         | TypeScript                                                                 | 5.9.3                       |
| Styling          | Tailwind CSS                                                               | 4.1.18                      |
| ORM              | Prisma Client                                                              | 7.3.0                       |
| DB driver        | `@prisma/adapter-better-sqlite3` over `better-sqlite3`                     | 7.3.0 / 12.6.2              |
| Auth             | NextAuth.js (credentials)                                                  | 4.24.13                     |
| Password hashing | bcryptjs (cost 12)                                                         | 3.0.3                       |
| CAPTCHA          | Cloudflare Turnstile                                                       | HTTP API                    |
| Payments         | Stripe SDK                                                                 | 20.3.0                      |
| Validation       | zod (request-body schemas in `app/api/hofs/*`)                             | 4.3.6                       |
| Email            | Brevo transactional API                                                    | HTTP API                    |
| Images           | sharp                                                                      | 0.34.5                      |
| Archive/backup   | archiver + archiver-zip-encrypted                                          | 7.0.1 / 2.0.0               |
| Markdown         | react-markdown + remark-gfm (journal); rehype-sanitize (helpdesk timeline) | 10.1.0 / 4.0.1 / 6.0.0      |
| Testing          | Jest 30 + Testing Library + jest-axe                                       | 30.2.0                      |

**Node version is enforced four ways:** `engines` in `package.json`, `engine-strict=true` in `.npmrc`, `.nvmrc`/`.node-version`, and `scripts/dev/ensure-node-24.js` wired into the `predev`/`prebuild`/`prestart`/`pretest` hooks. Bypassing it (e.g. running Jest directly under Node 25) produces native-module ABI errors from `better-sqlite3`.

> **Markdown sanitisation is not uniform.** The journal viewer (`app/components/ui/MarkdownViewer.tsx`) uses `react-markdown` + `remark-gfm` with **no** `rehype-sanitize`; raw HTML is escaped rather than rendered, so it is not an XSS vector, but sanitisation is not applied (see `FEATURES.md` §9). The helpdesk timeline does apply `rehype-sanitize`.

---

## 5. Data model

Schema: `prisma/schema.prisma` — 36 models, 3 enums, 65 migrations.

### 5.1 Entity groups

| Group               | Models                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**        | `User`, `UserConsent`, `UserConsentAttachment`, `EmailLog`, `AuditLog`, `RateLimitAttempt`                                          |
| **Reference**       | `Country`, `Region`, `ConsentType`, `ConsentTypeAttachment`, `Interest`, `UserInterest`, `AppSetting`                               |
| **Hall of Fame**    | `HallOfFame`, `Year`, `HofYearConfig`, `HofEntry`, `AwardTier`, `CountryLceConfig`, `UserHofParticipation`, `UserYearParticipation` |
| **Journal**         | `Journal`, `JournalAuthor`, `JournalPhoto`                                                                                          |
| **Helpdesk**        | `SupportRequest`, `SupportRequestAttachment`, `TicketNote`, `TicketNoteAttachment`, `TicketStatusHistory`                           |
| **Change requests** | `ChangeRequest`, `ChangeRequestVote`, `ChangeRequestTicketCounter`, `ChangeRequestAttachment`                                       |
| **Commerce**        | `Donation`, `Sponsor`                                                                                                               |
| **Documents**       | `Document`                                                                                                                          |

### 5.2 `User` — authoritative fields

| Field                                                                              | Notes                                                                                                                                                                 |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `username`                                                                         | Unique. Generated from the email local part at registration (or supplied there); the admin Create Member flow generates `first.last`. Not editable in the member UI.  |
| `email`                                                                            | Unique; `emailVerified` must be non-null before login succeeds. `emailVerificationResendCount` tracks resends.                                                        |
| `password`                                                                         | bcrypt hash — cost 12 at creation, cost 10 in the password-change route                                                                                               |
| `role`                                                                             | Plain string, default `USER`. Only `USER` and `ADMIN` are assignable from the members UI; `CLERK` is referenced by the delete handler but no code path can assign it. |
| `status`                                                                           | `NEW`, `ACTIVE`, `ARCHIVED`, … — used for inclusion rules, not for login                                                                                              |
| `givenName`, `familyName`, `displayName`                                           | Display name is derived/editable; given+family drive username generation                                                                                              |
| `birthYear`, `gender`, `birthCountryId`, `residenceCountryId`, `residenceRegionId` | Demographic fields used by HoF qualification (age requirement, LCE)                                                                                                   |
| `peakbaggerId`, `hillBaggingId`, `bwbForumNickname`                                | External identity mapping                                                                                                                                             |
| `retiredYear`, `deceasedYear`                                                      | Exclude a member from qualification from that year                                                                                                                    |
| Consent timestamps                                                                 | `prHallConsent`, `pIndexConsent`, `infoRetentionConsent`, `publishTotalsConsent` — nullable timestamps; null means not granted                                        |
| `allowManualEntry`                                                                 | Gates whether the member may enter their own data                                                                                                                     |

**Field-name traps.** The schema avoids several obvious names, so a query written from memory fails at the Prisma type level: `User` has `displayName`, not `name` or `title`; `HallOfFame` and `Year` have `code`, not `key`; `HofEntry` has `totalPeaks`, not `peakCount`. `HofEntry` also has no `category` column (§5.3).

### 5.3 Key relationships and invariants

- `HofEntry` is unique per `(memberId, hofId, yearId)` — there is **no `category` column**. It stores the per-year inputs (`peaksInYear`, `foreignPeaksInYear`) and the cumulative results (`totalPeaks`, `foreignPeaks`) for that member in that HoF-year.
- `HofYearConfig` is unique per `(hofId, yearId)` and carries the per-year thresholds plus an optional assigned Hofmeister.
- `UserConsent` is unique per `(userId, consentTypeId)`. A null `dateGiven` means the user has been prompted but has not accepted — this drives the consent-prompt redirect.
- `AppSetting` is a key/value store partitioned by `category`. Funding bar figures live here under `category = 'funding'`.
- `ChangeRequestTicketCounter` provides sequential human-readable ticket IDs. It is a counter table, so concurrent inserts must be treated as a critical section.

### 5.4 Cascades and deletion

Most child records cascade from `User` (consents and their attachments, participations, interests, journal authorships) or from their parent (`ChangeRequest` → attachments and votes, `SupportRequest` → notes → note attachments, `HofYearConfig` → award tiers and LCE countries).

The admin delete handler treats the rest in two groups:

- **Deleted:** HoF entries, HoF/year participations, consents and their attachments, interests, ticket notes and status history.
- **Anonymised (`SetNull`):** audit logs, donations, support requests, email logs, and journal authorship.

`Journal.createdBy` is `Restrict` and the handler does not check it, so deleting a member who created a journal fails with a generic 500. The handler also refuses self-deletion, `ADMIN`/`CLERK` accounts, and any member holding a Hofmeister assignment. Deleting a user is destructive and irreversible; the UI gates it behind two confirmations. See `FEATURES.md` §5.1 and §9.

---

## 6. Authentication and authorization

### 6.1 Authentication

NextAuth v4 with a single Credentials provider.

```
POST /api/auth/callback/credentials
  1. Turnstile token verified server-side      (src/lib/auth.ts; skipped only when NODE_ENV === "development")
  2. Identifier resolved: email OR username    (src/lib/identifierUtils.ts)
  3. bcrypt.compare against User.password
  4. Reject if user.emailVerified IS NULL
  5. auditLog: AUTH_LOGIN_SUCCESS / AUTH_LOGIN_FAILED
  6. Issue JWT
```

> The development skip is **login-only**. Registration, forgot-password, reset-password, resend-verification and the anonymous contact form call `verifyTurnstileToken` unconditionally, so a development instance still needs a Turnstile secret — use Cloudflare's public test keys (`SETUP.md` §5.2).

**JWT payload:** `{ sub, id, role, name, email }`. The `jwt` callback copies `id` and `role` from the user record at sign-in; the `session` callback projects them onto `session.user`. **Role changes do not take effect until the token is refreshed** — there is no server-side session invalidation.

**Cookie:** HttpOnly, SameSite=Lax, secure when `NEXTAUTH_URL` is `https://`.

### 6.2 Registration and recovery flows

| Flow                | Endpoint                             | Notes                                                                                                                                                                                         |
| ------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register            | `POST /api/auth/register`            | Creates user with `status=NEW`, `emailVerified=null`. Role is **not** accepted from the request — hardcoded to default `USER`. Auto-creates HoF/year participations and pending consent rows. |
| Verify email        | `POST /api/auth/verify-email`        | 32-byte hex token, 24h expiry                                                                                                                                                                 |
| Resend verification | `POST /api/auth/resend-verification` | Resend count tracked on the user row                                                                                                                                                          |
| Forgot password     | `POST /api/auth/forgot-password`     | Token, 1h expiry; Turnstile-protected                                                                                                                                                         |
| Reset password      | `POST /api/auth/reset-password`      | Consumes token, rehashes                                                                                                                                                                      |

Tokens are `crypto.randomBytes(32).toString("hex")` and single-use.

### 6.3 Authorization — two enforcement layers

This is the most important thing to understand before adding a route.

**Layer 1 — `middleware.ts`.** A NextAuth `withAuth` wrapper with an explicit matcher. It runs before the route handler. The role rule itself is the pure function `requiresAdminRole(pathname, method)` in `src/lib/routeAuthz.ts`, pinned by `__tests__/unit/routeAuthz.test.ts`:

| Matcher prefix                                                                         | Rule                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `/admin`, `/api/admin`                                                                 | `role === "ADMIN"` (403 for APIs, redirect to `/home` for pages)                |
| `/api/change-requests`                                                                 | `role === "ADMIN"`                                                              |
| `/api/users/[id]/*`                                                                    | Owner (`token.sub === id`) or `ADMIN`; `accept-consents` exempted               |
| `/my-bags`, `/api/my-bags`                                                             | Any authenticated session                                                       |
| `/profile`, `/home`, `/consent-prompt`                                                 | Any authenticated session                                                       |
| `/api/backup`, `/api/documents`, `/api/hof-entries`, `/api/users`                      | `role === "ADMIN"` for every method (the collection path only for `/api/users`) |
| `/api/hofs`, `/api/years`, `/api/consent-types`, `/api/interests`, `/api/app-settings` | `role === "ADMIN"` for writes; any authenticated session for reads              |

Notable prefixes that are **not** in the matcher at all:

| Prefix                                                                                                             | Reached how                                                                                                |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `/api/auth/*`, `/api/turnstile/*`, `/api/legal/*`, `/api/health`, `/api/version`, `/api/countries`, `/api/regions` | Public by design; auth routes are Turnstile- and/or rate-limited                                           |
| `/api/hof-tables/*`                                                                                                | Public read via `getOptionalSession()`; exposes member data to anonymous callers                           |
| `/api/journal/*`                                                                                                   | In-route session checks; writes require `ADMIN`, published-content edits require journal-editor membership |
| `/api/sponsors/*`                                                                                                  | Public read; writes check `ADMIN` in-route                                                                 |
| `/api/hof-year-configs/*`, `/api/award-tiers/*`                                                                    | Session-only reads; writes check `ADMIN` in-route                                                          |
| `/api/support-requests/*`                                                                                          | Deliberately excluded so the public contact form can POST; listing is admin-checked in-route               |
| `/api/donations/*`                                                                                                 | Public checkout plus a signature-verified Stripe webhook                                                   |
| `/api/uploads/*`, `/api/webhooks/*`                                                                                | No authorization / third-party webhook — §16.1 and §16.7                                                   |

**Layer 2 — in-route guards.** Routes outside the matcher must guard themselves via `src/lib/api-auth.ts`. Many handlers carry the comment _"Middleware ensures user is authenticated and is ADMIN"_ — **that comment is false**: the matcher proves only that a session exists, never the role. **If you move or rename a route, verify the matcher still covers it, and never rely on the matcher for `ADMIN`.**

`__tests__/security/api-route-auth-coverage.test.ts` enforces this: it enumerates every `app/api/**/route.ts`, and fails if a route is neither matcher-covered, listed in `PUBLIC_API_ROUTES` with a reason, nor containing a recognised guard call. Adding an unprotected endpoint breaks CI.

**Known consequence:** `/api/uploads/[...path]` is not matcher-covered and performs no authorization. See §16.1.

### 6.4 Rate limiting

DB-backed fixed window (`RateLimitAttempt`), keyed on client IP or email plus a limiter name. Configurations live in `src/lib/rateLimit.ts`:

| Limiter              | Key      | Limit | Window     | Applied to                              |
| -------------------- | -------- | ----- | ---------- | --------------------------------------- |
| `registration`       | IP       | 5     | 1 hour     | `POST /api/auth/register`               |
| `password-reset`     | email    | 5     | 1 hour     | `POST /api/auth/forgot-password`        |
| `email-verification` | email    | 10    | 1 hour     | `POST /api/auth/resend-verification`    |
| `support-request`    | IP/email | 5     | 15 minutes | `POST /api/support-requests`            |
| `note-creation`      | user     | 20    | 15 minutes | `POST /api/support-requests/[id]/notes` |
| `donation-checkout`  | IP       | 10    | 15 minutes | `POST /api/donations/checkout`          |

Two gaps worth knowing: **login and reset-password are not rate-limited** (Turnstile only), and the donation limiter reads `X-Forwarded-For` **before** `CF-Connecting-IP`, unlike every other caller.

Client IP is taken from `CF-Connecting-IP`, then `X-Forwarded-For`, then `X-Real-IP`. **If you deploy without a trusted reverse proxy that overwrites these headers, the rate limiter can be bypassed by spoofing them.** No client component handles a `429` — there is no countdown or limiter-specific copy. `npm run db:cleanup-rate-limits` prunes the table.

### 6.5 Audit logging

`src/lib/auditLog.ts` writes `AuditLog` rows for auth events and administrative mutations. It records event type, status, actor, IP, parsed user agent, and Cloudflare country. Logging is fire-and-forget with respect to request success — a logging failure must not fail the request, so log gaps are possible under DB contention.

---

## 7. Domain logic

### 7.1 Hall of Fame model

Three axes define every data point:

- **HoF** (`HallOfFame`) — a competition category, identified by `code` (e.g. `P30`, `P100`, `P-INDEX`), plus three Progress-Register filter fields. Qualification thresholds live on the config, not here.
- **Year** (`Year`) — a season, ordered by `displayOrder`, gated by `isActive`. The **`BASELINE`** year (code `BASELINE`, `displayOrder: -1`, seeded by `scripts/seed/seed-baseline-year.js`) holds pre-2019 opening balances. There is no boolean flag — BASELINE is an ordinary row whose position makes it the first term of every cumulative sum.
- **Entry** (`HofEntry`) — a member's per-year inputs (`peaksInYear`, `foreignPeaksInYear`) and cumulative results (`totalPeaks`, `foreignPeaks`) within one HoF-year.

`HofYearConfig` binds an HoF and year together and carries the thresholds for that pairing: minimum peaks, minimum foreign peaks, minimum FPR and minimum age — each with its own `*Enabled` switch — plus LCE enablement and thresholds, internal notes, Meister-report content and the assigned Hofmeister. The pair `(hofId, yearId)` is unique.

### 7.2 Qualification rules

Implemented as pure predicates in `src/lib/hofQualificationRules.ts`, evaluated per `(member, hof, year)`:

| Predicate                             | Rule                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `meetsMinimumAgeRequirement`          | Member age in the year ≥ configured minimum                                  |
| `meetsMinimumPeaksRequirement`        | `totalPeaks` ≥ configured minimum                                            |
| `meetsMinimumForeignPeaksRequirement` | `foreignPeaks` ≥ configured minimum                                          |
| `meetsMinimumFprRequirement`          | Foreign-peak ratio ≥ configured minimum                                      |
| `checkLceApplies`                     | Whether the Large Country Exception applies to the member's residence region |

**Exclusion predicates — Progress Register only.** These three predicates are applied to the non-qualified ("Progress Register") list, not to qualification itself. A retired or deceased member can still qualify and appears in the Qualified table carrying a badge.

| Predicate               | Rule                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `isRetiredAndExcluded`  | `retiredYear` is set and the HoF's `progressRegisterExcludeRetired` is on                 |
| `isDeceasedAndExcluded` | `deceasedYear` is set and `progressRegisterExcludeDeceased` is on                         |
| `isInactiveAndExcluded` | No entries at all, or no entry within `progressRegisterInactivityYears` (1–10, default 2) |

These are the `progressRegister*` fields on `HallOfFame`, so they are configured per HoF, and the route computes exclusion statistics for admins. `FEATURES.md` §6 has the user-facing summary.

### 7.3 LCE (Large Country Exception)

LCE relaxes thresholds for members in configured countries. Two pieces:

- **Which countries** — `CountryLceConfig` rows link a country to a `HofYearConfig` with a `hasLce` flag (unique per `(hofYearConfigId, countryId)`).
- **Which thresholds** — `lceMinPeaks`, `lceMinForeignPeaks` and `lceMinFpr` live on the `HofYearConfig`. A null LCE value falls back to the standard threshold, so LCE can relax any subset of the rules.

`checkLceApplies` resolves the member's country from their **residence country** (`residenceCountryId`), unless that year's `UserYearParticipation.countryId` overrides it, and matches it against the config's LCE country set. Everything is data-driven — no country is special-cased in code. See [`docs/QUALIFICATION_RULES.md`](docs/QUALIFICATION_RULES.md).

### 7.4 Cumulative totals

`src/lib/recalculate-totals.ts` recomputes cumulative totals for a `(user, hof)` pair across all years, beginning from the baseline year's opening balance. It is invoked after entry mutations. **It is not transactional with the mutation that triggered it** — a crash between the two leaves totals stale. If you automate imports, recalculate explicitly afterwards.

### 7.5 Award tiers

`AwardTier` rows define named bands (`Bronze` … `Diamond`) with `minPeaks`/`maxPeaks` per HoF-year config. `hofTierUtils.ts` resolves a member's tier and its colour mapping. Tier definitions are seeded per config; adding an HoF-year pairing requires seeding tiers for it.

### 7.6 Ranking

`sortAndRankHofMembers` / `assignRanks` implement competition ranking (ties share a rank) over the member list for a given HoF-year.

---

## 8. API surface

93 `route.ts` modules exposing **149 HTTP operations** (62 GET, 39 POST, 24 DELETE, 19 PUT, 5 PATCH). Per-endpoint request/response detail lives in [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md); this section is the authorization overview. Overview by area:

| Area                                                                                          | Routes | Authorization                                           |
| --------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| `users`                                                                                       | 11     | Matcher (owner-or-admin)                                |
| `journal`                                                                                     | 10     | In-route session checks                                 |
| `years`                                                                                       | 7      | Matcher (authenticated)                                 |
| `support-requests`                                                                            | 6      | In-route; admin for listing, public POST with Turnstile |
| `change-requests`                                                                             | 6      | Matcher (**admin**)                                     |
| `auth`                                                                                        | 6      | Public (rate-limited, Turnstile-protected)              |
| `documents`                                                                                   | 5      | Matcher (authenticated)                                 |
| `consent-types`                                                                               | 5      | Matcher (authenticated)                                 |
| `admin`                                                                                       | 5      | Matcher (**admin**)                                     |
| `sponsors`                                                                                    | 3      | In-route; public read, admin write                      |
| `hof-year-configs`                                                                            | 3      | In-route admin                                          |
| `backup`                                                                                      | 3      | Matcher (`ADMIN`, every method) — see §16.6             |
| `my-bags`                                                                                     | 2      | Matcher (authenticated)                                 |
| `hof-tables`                                                                                  | 2      | In-route public read                                    |
| `award-tiers`, `interests`, `hofs`, `hof-entries`, `donations`                                | 2 each | Mixed                                                   |
| `uploads`                                                                                     | 1      | **None — see §16.1**                                    |
| `health`, `version`, `countries`, `regions`, `legal`, `turnstile`, `webhooks`, `app-settings` | 1 each | Public or matcher                                       |

**Conventions**

- Errors: `{ error: string }` with an appropriate status. Some handlers also return `details`.
- Success: either the resource directly or `{ data, total, page, limit, pages }` for paginated lists.
- Dynamic segments use `params: Promise<{ id: string }>` and must be awaited (Next.js 16 async params).

> **"Authenticated" is not "authorized".** The middleware enforces a role for `/admin`, `/api/admin`, `/api/change-requests`, `/api/backup`, `/api/documents`, `/api/hof-entries`, the `/api/users` collection, and writes to `/api/hofs`, `/api/years`, `/api/consent-types`, `/api/interests` and `/api/app-settings` (`src/lib/routeAuthz.ts`). Every other matcher prefix proves only that a session exists, so a route whose table entry says "Matcher (authenticated)" is reachable by any signed-in member unless it checks the role itself — and several do not. See §6.3, §16.6, and the full 41-item list in `FEATURES.md` §9.

---

## 9. File storage

### 9.1 Locations

All user uploads live under a single root, resolved by `getUploadsBaseDir()`:

- Development: `<repo>/uploads`
- Production: `$UPLOADS_DIR` — **required**. The function throws if `NODE_ENV=production` and the variable is unset, deliberately, because a `public/` fallback would bypass API-level authorization.

| Subdirectory        | Contents                        |
| ------------------- | ------------------------------- |
| `documents/`        | Document store files            |
| `user-consents/`    | Consent evidence                |
| `change-requests/`  | Change-request attachments      |
| `consent-types/`    | Consent templates               |
| `meister-reports/`  | Hofmeister report images        |
| `notes/`            | Support-ticket note attachments |
| `support-requests/` | Support-ticket attachments      |
| `journal/`          | Journal photos                  |
| `sponsors/`         | Sponsor logos                   |

Filenames are UUID/cuid-based and the original name is stored in the DB, never used as a path.

### 9.2 Serving

`GET /api/uploads/[...path]` reads from the uploads root and streams the file. It validates for traversal (`..`, absolute paths) and resolves the final path against the root. **It performs no authorization** (§16.1).

### 9.3 Backups

`POST /api/backup` creates AES-256 encrypted ZIP archives of either the database or the uploads tree, written to `$BACKUP_DIR`, using `archiver-zip-encrypted` keyed by `BACKUP_PASSWORD` (falling back to the literal `default-password-change-me`). `GET /api/backup/[filename]` downloads one and `DELETE` removes one, both restricted to `.zip` files whose names start with `manual-`, `auto-`, `deploy-`, `db-` or `files-`. That filter is why the plain `.db` files written by `scripts/deployment/deploy.sh` are invisible to the UI.

There is **no restore endpoint** and no automatic pruning. The endpoint requires `ADMIN` for every method, but only because of its middleware entry — the handler itself contains no role check (§16.6). `FEATURES.md` §9 covers the rest of the backup debt.

---

## 10. External integrations

Every outbound call the application makes. None is optional at the code level; features degrade individually. For the operator-facing setup of each — account, keys, webhooks, verification and failure modes — see [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md).

### 10.1 Cloudflare Turnstile — bot protection

- **Where:** `src/lib/turnstile.ts`, `src/lib/turnstileUtils.ts`
- **Endpoint:** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- **Call sites:** login, registration, forgot-password, reset-password, resend-verification, public support-request form
- **Config:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (client), `TURNSTILE_SECRET_KEY` (server)
- **Failure mode:** **fail-open.** Timeouts and non-2xx responses allow the request and set `failedOpen=true`. Only an explicit `success: false` blocks. This is deliberate (availability over strictness) and is the single most important security trade-off in the auth path.
- **The development skip is login-only.** `src/lib/auth.ts` wraps only the login check in `NODE_ENV !== "development"`; every other call site verifies unconditionally, so local registration and password reset need a secret — Cloudflare's public test keys are the intended choice (`SETUP.md` §5.2).

### 10.2 Cloudflare proxy headers — geo and client IP

- **Where:** `src/lib/geoip.ts`
- **Headers read:** `CF-IPCountry`, `CF-Connecting-IP`, `CF-Ray`, plus `X-Forwarded-For` / `X-Real-IP` fallbacks
- **Purpose:** audit-log country attribution and rate-limit keying
- **Requirement:** these headers are trustworthy **only** behind a proxy that sets them. See §6.4.

### 10.3 Brevo — transactional email

- **Where:** `src/lib/email.ts`, `src/lib/email-templates.ts`
- **Endpoint:** `POST https://api.brevo.com/v3/smtp/email`
- **Used for:** email verification, resend verification, password reset, support notifications and requester auto-confirmations. **Nothing else sends mail** — helpdesk replies, donations, change requests, journal publication and consent assignments are all silent.
- **Audit trail:** `sendEmail` writes an `EmailLog` row before sending. Status moves `PENDING` → `SENT` (with `brevoMessageId`) or `FAILED`.
- **Config:** `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `APP_URL`, `SUPPORT_FALLBACK_EMAIL`
- **Inbound webhook:** `POST /api/webhooks/brevo` — authorises by matching the caller IP against a hard-coded list of Brevo ranges (a spoofable `X-Forwarded-For` prefix check, not a signature); advances the log to `DELIVERED`, `BOUNCED` or `FAILED`.
- **Retention:** `EmailLog` rows carry a 90-day `retentionDate` that nothing reads — there is no cleanup script and no admin UI.
- **Dev override:** `DEV_EMAIL_RECIPIENT` reroutes all mail to one address when `NODE_ENV=development`
- **Failure mode:** send failures are caught and logged; registration still succeeds, leaving the user unverified and unable to log in until a resend succeeds.
- **Unused:** `getEmailStats` and `getAdminCreatedUserEmail` have no callers.

### 10.4 Stripe — donations

- **Where:** `src/lib/stripe.ts`, `app/api/donations/*`
- **Endpoints:** hosted Stripe Checkout (redirect), `POST /api/donations/webhook`
- **Config:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. There is **no client-side key** — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` exists in `.env.example` for future Stripe Elements work but is read nowhere.
- **Webhook verification:** `stripe.webhooks.constructEvent` with the raw body — **the raw body must not be parsed before verification**, or signatures will not match
- **Events handled:** exactly `checkout.session.completed` (→ `COMPLETED`) and `checkout.session.expired` (→ `CANCELLED`). Monthly subscriptions are created, but renewals, refunds and failed payments are not handled, and `FAILED` is never written.
- **Failure mode:** an invalid signature is rejected. Donations are recorded on webhook receipt, not on redirect, so a user closing the tab still records the donation once Stripe confirms. No receipt email is sent.

### 10.5 OpenAI — change-request summarisation

- **Where:** `app/api/change-requests/sync-git/route.ts`
- **Used for:** converting batched git commit messages into business-readable change-request descriptions
- **Config:** `OPENAI_API_KEY`
- **Data leaving the boundary:** commit messages and hashes from the configured repository
- **Failure mode:** feature disabled if the key is unset; the route returns a clear error.

### 10.6 GitHub — commit deep links

- **Where:** `app/api/change-requests/sync-git/route.ts`, `app/components/features/changes/ChangeForm.tsx`
- **Config:** `GITHUB_REPO` or `NEXT_PUBLIC_GITHUB_REPO` (`owner/name`)
- **Behaviour:** when unset, commit hashes render as plain text instead of links.

### 10.7 Google Sites — journal import (removed)

The original Google Sites journal importers
(`scripts/data/import-journal-google-sites.js` and the
`scripts/data/journal/*` bundle tooling) were one-off migration scripts and have
been **removed from this repository**. Journal content is now managed through
the application's own journal editor.

If you need to migrate content from an external site, write a one-off importer
against the `Journal` / `JournalPhoto` models rather than reinstating the old
scrapers — automated fetching may conflict with the source site's terms.

### 10.8 PeakBagger — member data source (removed)

The PeakBagger-derived member import pipeline (`scripts/migration/`,
`scripts/data/import-*.js`, and the CSV fixtures) was a one-off migration for
the original dataset and has been **removed**. Those scripts required data
files that are not distributed, so they could not run.

`scripts/migration/` still exists in a working checkout but contains only
`bwb-members-export.json` and `user-profiles-template.csv`, both **gitignored**
(`.gitignore` lines 127–128) and therefore absent from a fresh clone and from
the release tree. Nothing reads them.

See §19 for how to seed and populate a fresh instance.

### 10.9 Wikimedia — image attribution

`public/images/hero-mountain.jpg` is CC BY-SA 2.5 by Luca Galuzzi. Attribution and ShareAlike obligations are recorded in `NOTICE`. This image is **not** covered by the project's AGPL licence.

---

## 11. Database

### 11.1 How to connect

There is no database server to connect to. The database is a file, addressed by a `file:` URL.

```bash
# Environment
DATABASE_URL="file:./prisma/dev.db"           # development, relative to the repo root
DATABASE_URL="file:/app/data/bwb.db"          # production (Docker), absolute, on a mounted volume
```

Resolution happens in `src/lib/prisma.ts`: the URL is converted to an absolute path, a driver adapter is constructed with `fileMustExist`, and the singleton is cached on `globalThis` to survive hot reloads.

**Failure modes you will hit:**

| Symptom                                       | Cause                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `Database file not found at: …`               | The file does not exist and `NODE_ENV` is not `test`. Create it with `prisma migrate deploy`. |
| `UPLOADS_DIR must be set in production`       | Set `UPLOADS_DIR`; this is intentional (§9.1).                                                |
| Native module ABI error from `better-sqlite3` | Wrong Node major. Use Node 24.                                                                |

### 11.2 Bootstrapping a fresh database

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local          # then set DATABASE_URL and NEXTAUTH_SECRET
npm run db:generate                 # generate the Prisma client
npm run db:migrate                  # apply all 65 migrations (dev)
# production instead: npx prisma migrate deploy
npm run db:seed                     # reference data + synthetic demo users
```

`db:seed` creates the reference data the application needs: countries and
regions, consent types, interests, Halls of Fame, years (including the baseline
year), HoF-year configs, award tiers, **and** a few synthetic demo users. It
refuses to create demo users when `NODE_ENV=production`. §19 lists the exact
row counts, what is deliberately _not_ seeded, and which groups you could omit.

### 11.3 Migration workflow

- Development: `npm run db:migrate` → `prisma migrate dev` (creates a migration from schema drift).
- Production: `npx prisma migrate deploy` (applies only; never generates).
- Migrations are committed under `prisma/migrations/`. `.gitignore` ignores `*.sql` **except** `prisma/migrations/**/migration.sql`.
- Reference data (ISO 3166 countries and regions) is loaded from `prisma/countries/*.json` and `prisma/regions/*.json` by the seed script, not by migrations.

### 11.4 Seeding and synthetic data

`prisma/seed.js` uses `scripts/shared/prisma-client.js`, which loads `.env`/`.env.local` itself. This matters: a script using bare `new PrismaClient()` will not see `DATABASE_URL` when run with plain `node`.

Demo accounts created by the seed (password generated randomly and printed once, or set `DEMO_USER_PASSWORD`):

```
demo-admin  (ADMIN)
demo-user   (USER)
demo-member (USER)
```

**Demo users have no `UserConsent` rows on a fresh seed.** `seedConsentTypes`
assigns the two legal consents to every user that exists when it runs, and
`seedDemoUsers` runs later in the same pass — so on a first seed there is
nothing to assign. Because `checkMissingRequiredConsents` only looks for rows
with `dateGiven: null`, a demo account that has no rows at all passes the
consent gate silently. Re-running `db:seed` assigns the rows (the users now
exist), which is also the quickest way to make the gate behave as it does for
registered users.

### 11.5 Operational characteristics

- **Concurrency:** SQLite serialises writes. Long transactions block all writers. Keep writes short.
- **Durability:** default journal mode. Back up by copying the file with the app stopped, or use the backup API which snapshots safely.
- **Size:** dominated by `AuditLog`, `EmailLog`, and `HofEntry`. `npm run db:cleanup-logs` prunes audit logs (90 days for `AUTH`, 730 days otherwise) and `npm run db:cleanup-rate-limits` prunes expired limiter rows — but **`EmailLog` has no cleanup script**, so its 90-day retention date is never enforced and the table grows without bound.
- **No scheduler:** neither cleanup runs automatically. See `SETUP.md` §6.7 for the recommended cron entries.

---

## 12. Configuration reference

The application reads **22 variables** directly (`app/` + `src/`) — 21 application
variables plus `JEST_WORKER_ID` when running under Jest — and four more drive
tooling: `PORT` (Next.js), `SKIP_TYPE_CHECK` (`next.config.js`), `DEMO_USER_PASSWORD`
(the seed script) and `BWB_COMMIT_MSG` (the versioning hook). Full descriptions are in
`.env.example`.

### Required

| Variable          | Purpose                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `NEXTAUTH_SECRET` | Signs/encrypts session JWTs. `openssl rand -base64 32`. **Rotating it logs everyone out.** |
| `NEXTAUTH_URL`    | Canonical app URL; must be `https://` in production                                        |
| `DATABASE_URL`    | SQLite `file:` URL                                                                         |
| `NODE_ENV`        | `development` \| `production` \| `test`                                                    |

### Production-required

| Variable          | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `UPLOADS_DIR`     | Upload root. **Throws if unset in production.**       |
| `BACKUP_DIR`      | Backup archive directory (defaults to `/app/backups`) |
| `BACKUP_PASSWORD` | Encryption password for backup archives               |

### Integrations

| Variable                                                   | Integration                         |
| ---------------------------------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`   | Cloudflare Turnstile                |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`               | Stripe (no client-side key is used) |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | Brevo                               |
| `OPENAI_API_KEY`                                           | OpenAI                              |
| `GITHUB_REPO` / `NEXT_PUBLIC_GITHUB_REPO`                  | Commit links                        |

### Optional

| Variable                 | Purpose                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| `PORT`                   | Listen port (default 1345)                                                          |
| `APP_URL`                | Base URL for email links                                                            |
| `DEV_EMAIL_RECIPIENT`    | Reroute all mail in development                                                     |
| `SUPPORT_FALLBACK_EMAIL` | Support notification recipient fallback                                             |
| `DEMO_USER_PASSWORD`     | Fixed password for seeded demo users                                                |
| `NEXT_PUBLIC_API_URL`    | API base for the admin roles page                                                   |
| `BWB_COMMIT_MSG`         | Commit message consumed by the versioning hook                                      |
| `SKIP_TYPE_CHECK`        | `true` makes `next build` ignore TypeScript errors. **Do not enable for releases.** |

> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is documented in `.env.example` but read nowhere — see §10.4.

---

## 13. Build and deployment

### 13.1 Local development

```bash
npm ci --legacy-peer-deps
npm run dev            # port 1345
```

`npm run dev` triggers `predev` → `ensure-node-24.js`, which aborts on the wrong Node major.

### 13.2 Production build

```bash
npm ci --legacy-peer-deps
npm run db:generate
npm run build          # runs ensure-node-24 first
npm start              # next start -p 1345
```

### 13.3 Docker

Multi-stage `Dockerfile`: `node:24-bookworm-slim` builder → `node:24-bookworm-slim` runtime, non-root `nodejs` user (uid/gid 1001).

```
/app/data      ← DATABASE_URL target   (mount a volume)
/app/uploads   ← UPLOADS_DIR target    (mount a volume)
/app/backups   ← BACKUP_DIR target     (mount a volume)
```

`docker-compose.prod.yml` wires those three volumes, loads `.env` via `env_file`, sets `NODE_ENV=production`, and defines a healthcheck hitting `/api/health`.

**Note:** the Docker build sets `SKIP_TYPE_CHECK=true`, so type errors do not fail the image build. Run `npm run type-check` in CI instead.

### 13.4 Automated deployment (`deploy.sh`)

`npm run deploy` (or `./scripts/deployment/deploy.sh`) is the project's own release path and does more than `docker compose up --build`: it builds the image locally, ships the tar plus `docker-compose.prod.yml` and `data/git-commits/`, creates the server `.env` if missing, ensures `/srv/bwb/{data,uploads,backups}` exist and are owned by UID/GID 1001, takes a pre-deployment database backup, applies migrations with a one-off `docker run --rm … npx prisma migrate deploy`, recreates the container, polls `/api/health` for up to 30 seconds, then prunes old images and backups. Edit `REMOTE_USER`, `REMOTE_HOST`, `REMOTE_PATH` and `DOMAIN` at the top first. `SETUP.md` §6.2 has the operator-facing version.

**The generated `.env` is deliberately incomplete.** It contains `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`, `UPLOADS_DIR`, `BACKUP_DIR`, `NODE_ENV` and `PORT` — but **not** `BACKUP_PASSWORD`, `TURNSTILE_*`, `STRIPE_*` or `BREVO_*`. Add those by hand before going live, or backups silently use the default password (§9.3).

### 13.5 PM2 (no Docker)

The non-Docker path uses PM2 with process name `bwb-climbing`. `docs` and helper scripts referenced the previous hosting provider; replace hostnames with your own.

### 13.6 Reverse proxy requirements

The application expects to sit behind a proxy that:

1. Terminates TLS and sets `NEXTAUTH_URL` to the public `https://` origin.
2. Sets `X-Forwarded-For` / `X-Real-IP` (or Cloudflare headers) — otherwise rate limiting is bypassable.
3. Allows request bodies to reach `/api/donations/webhook` **unmodified** — Stripe signature verification depends on the raw body.
4. Raises the body size limit for document and journal uploads.

### 13.7 Health checks

`GET /api/health` returns `{status, timestamp}`. With `?detailed=true` it additionally reports environment, DB reachability and user count, upload/backup directory status, and DB file path/size/mtime. Use the basic form for container healthchecks.

> **`?detailed=true` is public.** `/api/health` is not in the middleware matcher, and the route's comment claiming admin auth is wrong. The detailed response discloses internal paths and a listing of the uploads directory to anyone. Block it at the reverse proxy (`SETUP.md` §6.6).

---

## 14. Testing

```bash
npm test                # unit + api + contracts + e2e + integration
npm run test:unit       # __tests__/unit
npm run test:api        # __tests__/api
npm run test:components # component suites
npm run test:a11y       # jest-axe accessibility
npm run test:coverage   # with coverage thresholds
```

- Configuration: `jest.config.js` (plus separate configs for contracts, e2e and integration).
- `jest.globalSetup.js` deletes `prisma/test.db`, recreates it and runs `prisma migrate deploy` against it before any suite loads.
- `jest.setup.js` installs global mocks — including a `fetch` stub, because jsdom provides no `fetch`; `jest.env.js` supplies the test environment.
- Coverage thresholds are 50% for branches/functions/lines/statements.
- `npm run test:results` writes `data/test-results/test-results.json`, which `/admin/test-results` reads. The full suite map is in `SETUP.md` §7.1.

**Run tests under Node 24.** Under Node 25 the `better-sqlite3` native binding compiled for Node 24 fails to load and produces misleading database errors.

**Current state:** a portion of the component suites fail against UI copy that has since changed. The last recorded run was **4,312 tests / 4,166 passing / 74 failing / 72 skipped, 23 failing suites of 167** (a local `npm run test:results`; the JSON it writes under `data/test-results/` is generated rather than committed). These are stale assertions, not product defects. See §16.3.

---

## 15. Operational runbook

| Task                  | Command / action                                               |
| --------------------- | -------------------------------------------------------------- |
| Deploy (automated)    | `npm run deploy` — see §13.4                                   |
| Start (Docker)        | `docker compose -f docker-compose.prod.yml up -d`              |
| Start (PM2)           | `pm2 start npm --name bwb-climbing -- start`                   |
| Apply migrations      | `npx prisma migrate deploy`                                    |
| Inspect data          | `npm run db:studio`                                            |
| Create backup         | Admin UI, or `POST /api/backup`                                |
| Restore a backup      | Manual only — there is no restore endpoint (§9.3)              |
| Promote first admin   | Prisma Studio, or the one-liner in `SETUP.md` §1.6             |
| Export members        | `npm run db:export-members`                                    |
| Pull production DB    | `npm run db:pull` / `db:pull:restore`                          |
| Prune audit logs      | `npm run db:cleanup-logs` (not inside the Docker image)        |
| Prune rate limits     | `npm run db:cleanup-rate-limits` (not inside the Docker image) |
| Reset a password      | `npm run db:reset-password`                                    |
| Check version         | `GET /api/version`                                             |
| Rotate session secret | Change `NEXTAUTH_SECRET`, restart, accept global logout        |

### Common failures

| Symptom                                | Diagnosis                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Users cannot log in after deploy       | `NEXTAUTH_SECRET` changed → expected. Otherwise check `emailVerified`, Turnstile keys, and clock skew affecting JWT validation. |
| Uploads return 404 but files exist     | `UPLOADS_DIR` points somewhere other than where the files were written.                                                         |
| Stripe webhooks fail signature check   | Body was parsed before verification, or a proxy rewrote it.                                                                     |
| Rate limiting ineffective              | Proxy is not setting client IP headers (§6.4).                                                                                  |
| `SQLITE_BUSY` under load               | Concurrent writers. Reduce write transaction length; do not run multiple replicas.                                              |
| Build succeeds but runtime type errors | `SKIP_TYPE_CHECK=true` masked them; run `npm run type-check`.                                                                   |
| `npm run db:cleanup-*` fails in Docker | `scripts/admin` and `scripts/data` are excluded from the image; run from a checkout against the mounted DB.                     |
| Health endpoint discloses paths        | `/api/health?detailed=true` is public; block it at the proxy (§13.7).                                                           |

---

## 16. Known issues and technical debt

Read this section before deploying.

### 16.1 `/api/uploads/[...path]` performs no authorization — **high severity**

`app/api/uploads/[...path]/route.ts` streams any file under the uploads root to any caller. It validates against path traversal but has **no session, role, or ownership check**, and it is not covered by `middleware.ts`.

Consequences:

- `user-consents/` (consent evidence), `support-requests/` and `notes/` (helpdesk attachments), `change-requests/`, `meister-reports/`, and `documents/` are all retrievable by anyone who knows or guesses a path.
- Responses carry `Cache-Control: public, max-age=31536000, immutable`, so shared caches and browsers may retain them.

Mitigating factor: filenames are UUID/cuid-generated and not enumerable. That is obscurity, not authorization.

**Recommended remediation:** add a per-prefix policy — public for `sponsors/`, session-or-admin for the rest — and change the cache header to `private, no-store` for non-public prefixes. This is a contained change in the route handler.

### 16.2 Dependency advisories

`npm audit` reports advisories across the dependency tree, including `next` and `next-auth`. At the time of writing no in-range fix was available for two critical entries. Re-check with `npm audit` and `npm run sbom` before each release.

### 16.3 Stale test assertions

A number of component test suites assert UI copy and structure that no longer exists (renamed fields, changed headings, refactored components). They fail on string mismatches, not logic. They should be rewritten against current behaviour or removed.

### 16.4 Other debt

| Item                                                             | Detail                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src` | Required for Next.js compatibility; tightening it is left to whoever continues the project |
| No server-side session revocation                                | Role changes and logouts apply only when the JWT is refreshed                              |
| `recalculate-totals` is not transactional with its trigger       | Totals can drift after an interrupted write; recalculate after bulk imports                |
| `ChangeRequestTicketCounter`                                     | Sequential ID generation is a contention point                                             |
| Turnstile fails open                                             | Deliberate availability trade-off; a Turnstile outage removes bot protection               |
| No background worker                                             | Backups, recalculations, and cleanup are request- or CLI-triggered                         |
| `npm run check:all` warning budget                               | Set to the current 69 accessibility warnings as a ratchet; lower it, never raise it        |
| Unenforced data retention                                        | Email-log retention is not cleaned up; backup pruning is manual; see §11.5                 |

> This section is the deep-dive. `FEATURES.md` §9 is the complete, itemised catalogue of
> 41 verified defects and inconsistencies, and is the list to check before making changes.

### 16.5 Authentication is not authorization

The matcher now enforces the role for the administrative families (§6.3):
`/api/backup`, `/api/documents`, `/api/hof-entries` and the `/api/users`
collection require `ADMIN` for every method, and writes to `/api/hofs`,
`/api/years`, `/api/consent-types`, `/api/interests` and `/api/app-settings`
require it too. Before that change every one of those prefixes proved only that a
session existed, while several handlers carried a comment claiming the middleware
enforced `ADMIN`.

What the middleware still does **not** do — reads it deliberately leaves open,
and routes it does not cover at all:

- `GET /api/consent-types` returns consent types including their admin-only internal notes to any signed-in member.
- `GET /api/hof-year-configs` (outside the matcher) returns configuration thresholds, internal notes and the Meister report to any signed-in member.
- `GET /api/hof-tables` is public and exposes member display names, totals, FPR and retirement/death years to anonymous callers.

`__tests__/security/api-route-auth-coverage.test.ts` does not catch a wrong rule
here: a `getSession()` call counts as a guard, and the test never inspects the
role. It proves coverage, not correctness. The role rule is pinned by
`__tests__/unit/routeAuthz.test.ts`, which is what keeps `requiresAdminRole()`
honest.

### 16.6 Administrative endpoints — role-checked by the middleware only

These were reachable by any signed-in member. The middleware now enforces the
role for each, but **none of the handlers below contains a role check of its
own**, so one matcher entry is the only barrier:

- `POST /api/users` accepts a `role` field. Rejecting the `/api/users` collection for non-admins closes the path by which a member could create an `ADMIN` account.
- `/api/backup` — list, create, download, delete **and the archive password** — requires `ADMIN` for every method.
- `DELETE /api/app-settings?key=` still has no auth code; writes to `/api/app-settings` are rejected for non-admins by the middleware. Reads stay open to any session because the funding bar and the contact form read settings.
- `GET /api/documents/[id]/content`, `GET /api/documents/[id]/stats` and `POST /api/documents/[id]/copy` still contain no authorization code; `/api/documents` requires `ADMIN` for every method.

Because the check lives in one place, a family that is only write-guarded is
protected for writes and open for reads by design. When adding a handler that
reads sensitive data, add an in-route guard rather than relying on §6.3.

### 16.7 Unauthenticated input surfaces

- **`/api/uploads/[...path]`** — see §16.1.
- **`POST /api/webhooks/brevo`** authenticates by an `X-Forwarded-For` prefix match against hard-coded Brevo ranges (§10.3). That header is client-controlled unless a trusted proxy overwrites it, so the check is spoofable.
- **`POST /api/support-requests`** is reachable without a session (Turnstile-gated only for anonymous callers) and its only upload check is `size > 0` — no MIME allow-list, no per-file cap, no count cap. Files land under `$UPLOADS_DIR/support-requests/` and are then served by the unauthenticated uploads route, which is a disk-exhaustion path. The helpdesk note endpoint enforces 5 MB/25 MB with an allow-list; the public form does not.

### 16.8 Workflow and data-integrity defects

| Area              | Defect                                                                                                                                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Donations         | No receipt email despite the success page promising one; `FAILED` never written; monthly renewals, refunds and failures unhandled; no admin UI       |
| Email             | `EmailLog` retention never enforced; no admin UI; no mail on helpdesk replies, donations, change requests, journal publication or consent assignment |
| Helpdesk          | Members cannot see their own tickets and are never emailed; priority and assignee exist in the API but have no UI control                            |
| Journal           | No scheduled publishing — a future `publishedAt` goes live immediately                                                                               |
| Documents         | Saving from the markdown editor deletes and re-uploads the file; rename/move never update the on-disk `path`                                         |
| Cumulative totals | Deleting a HoF entry does not recalculate, unlike create and update                                                                                  |
| Uploads           | Meister-report and consent-type attachments are written under the uploads root but linked and deleted under `public/uploads`                         |
| Sponsors          | `POST /api/sponsors` honours a client-supplied `slug`                                                                                                |

---

## 17. Appendix — full environment variable order

Recommended `.env` ordering for readability (all documented in `.env.example`):

```
# Core
NODE_ENV
PORT
NEXTAUTH_URL
NEXTAUTH_SECRET
DATABASE_URL
UPLOADS_DIR
BACKUP_DIR
BACKUP_PASSWORD

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET

# Brevo
BREVO_API_KEY
BREVO_SENDER_EMAIL
BREVO_SENDER_NAME
APP_URL
DEV_EMAIL_RECIPIENT
SUPPORT_FALLBACK_EMAIL

# Optional
OPENAI_API_KEY
GITHUB_REPO
NEXT_PUBLIC_GITHUB_REPO
NEXT_PUBLIC_API_URL
SKIP_TYPE_CHECK
BWB_COMMIT_MSG
DEMO_USER_PASSWORD
```

---

## 18. Appendix — scripts inventory

`scripts/` is organised by purpose. Every script is plain Node (run directly or via an npm script).

| Directory     | Purpose                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| `admin/`      | User administration and maintenance (password reset, log and rate-limit cleanup) |
| `data/`       | Data management (export members, delete all data)                                |
| `deployment/` | Deployment and server setup helpers                                              |
| `dev/`        | Development utilities (Node check, icon and placeholder generation)              |
| `security/`   | Credential scanning                                                              |
| `seed/`       | Database seeding — required by `prisma/seed.js`                                  |
| `shared/`     | Common utilities (the shared Prisma client)                                      |
| `versioning/` | Automatic semantic versioning and commit helpers                                 |
| `publish/`    | Release tooling: builds the public release tree. Excluded from that tree.        |

> The one-off migration pipeline that originally lived in `scripts/migration/`,
> `scripts/utilities/` and `scripts/data/import-*.js` has been removed — see §10.7
> and §10.8. A working checkout may still contain two **gitignored** data fixtures in
> `scripts/migration/`; nothing reads them.

### Conventions

1. **Always use the shared Prisma client:**

   ```javascript
   const prisma = require("../shared/prisma-client");
   ```

   It loads `.env`/`.env.local` itself (a bare `new PrismaClient()` will not see
   `DATABASE_URL` under plain `node`), resolves the SQLite URL to an absolute
   path, and refuses to run against a database file that does not exist.

2. **File naming:** kebab-case, prefixed by domain where useful
   (`seed-users.js`, `export-members-csv.js`).

3. **Destructive scripts must support `--dry-run`**, and the corresponding npm
   script should expose a `:dry` variant.

4. **Exit non-zero on failure** and clean up resources in a `finally` block.

5. **No credentials in scripts.** Passwords are supplied by environment
   variable or CLI argument; never hardcode one, even as a "development
   default" — scripts are published.

### Adding a script

1. Put it in the directory matching its purpose.
2. Use the shared Prisma client.
3. Add an npm script in `package.json` if it is user-facing.
4. Support `--dry-run` if it mutates data.

---

## 19. Appendix — seeding and populating data

### What `npm run db:seed` actually creates

Country and region data ships in the repository (`prisma/countries/*.json` — 7
continent files; `prisma/regions/<CC>.json` — one file per country with
subdivisions). Everything else is inline in the seed scripts. Nothing is
downloaded at seed time, so a fresh clone seeds with no network access.

A fresh `npm run db:seed` produces exactly this and nothing else:

| Table           | Rows | Source                                                     |
| --------------- | ---- | ---------------------------------------------------------- |
| `Country`       | 249  | `prisma/countries/*.json`                                  |
| `Region`        | 2891 | `prisma/regions/*.json`                                    |
| `ConsentType`   | 6    | Inline in `prisma/seed.js`                                 |
| `Interest`      | 9    | Inline in `scripts/seed/seed-interests.js`                 |
| `HallOfFame`    | 11   | Inline in `scripts/seed/seed-hofs.js`                      |
| `Year`          | 8    | Inline; includes the baseline year for pre-2019 balances   |
| `HofYearConfig` | 88   | Derived, one per HallOfFame × Year                         |
| `AwardTier`     | 528  | Derived from the HoF-year configurations                   |
| `User`          | 3    | `demo-admin`, `demo-user`, `demo-member` (random password) |

`AppSetting`, `HofEntry`, `Journal*`, `Document`, `Donation` and `Sponsor` are
**not** seeded. App settings are written at runtime through the admin UI
(`FEATURES.md` §5.14) and the rest are user data.

Every step upserts, so `npm run db:seed` is idempotent and safe to re-run.

### Minimum data for a functional instance

`npm run db:seed` **is** the minimum — run it and stop there. What each group
buys you, if you are deciding what to trim:

| Group                                 | Required? | What breaks without it                                                                                                                                                                                   |
| ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Country`, `Region`                   | **Yes**   | Registration and profile forms cannot record a country or region — the selectors are empty. HoF table statistics that key off residence country (`app/api/hof-tables/route.ts`) have nothing to resolve. |
| `ConsentType`                         | **Yes**   | Registration finds no active consent types, so new users are created with no consent records and the consent prompt has nothing to show. GDPR-relevant, not cosmetic.                                    |
| `HallOfFame`, `Year`, `HofYearConfig` | **Yes**   | The Hall of Fame tables have no Halls or years to render. Entry, ranking and award pages are empty.                                                                                                      |
| `AwardTier`                           | No        | Entries still store and display totals, but no award tier is shown for any total.                                                                                                                        |
| `Interest`                            | No        | Only the profile interest selector is affected — it offers no options. Registration does not ask for interests, and admins can add them under Admin → Interests.                                         |
| `AppSetting`                          | No        | Funding-bar figures fall back to `FUNDING_DEFAULTS` in `src/lib/funding-bar-utils.ts`; journal visibility settings fall back to code defaults. Admins edit these at runtime.                             |
| `User` (the 3 demo accounts)          | No        | Convenience only, and skipped automatically when `NODE_ENV=production`. A fresh seed gives them **no** `UserConsent` rows (§11.4), so they pass the consent gate silently.                               |
| `HofEntry`                            | No        | Real member results. Add `npm run db:seed-hof-entries` for synthetic ones in development.                                                                                                                |

### Seeding dependency order

`prisma/seed.js` calls its seeders in this order because of foreign-key
dependencies:

1. Countries and regions (geography)
2. Consent types (also assigns a `UserConsent` row to every user that already
   exists — so it is a no-op on a brand-new database, where the demo users do
   not exist yet)
3. Interests
4. Halls of Fame
5. Years (including the baseline year)
6. HoF-year configurations (depends on Halls of Fame + years)
7. Award tiers (depends on HoF-year configurations)
8. Demo users (depends on geography)

Running steps out of order produces foreign-key errors. If you add a seeder,
place it after everything it references.

### Populating development data

There are no importers for the original member dataset — that pipeline was
one-off and has been removed (§10.7, §10.8). To get a usable instance:

```bash
npm run db:seed              # reference data + synthetic demo users
npm run db:seed-users        # optional: create 32 additional random users
npm run db:seed-hof-entries  # optional: create random HoF entries for existing users
```

`db:seed-users` and `db:seed-hof-entries` generate **synthetic** data for
development. They are safe to re-run but will add more rows each time.

> ⚠️ `db:seed-users` assigns every one of its 32 users the hard-coded password
> `change-me-1234`, and the script has no `NODE_ENV` guard — it will run against
> production, where `db:seed` would have skipped the demo accounts. Never run it
> there, and treat any account carrying that password as compromised.

### Populating real member data

You will need to write your own importer. The pieces you need:

1. **Users** — insert into `User` with a bcrypt-hashed `password`
   (`bcrypt.hash(pw, 12)`), a unique `username` and `email`, and
   `emailVerified` set, or the account cannot log in.
2. **Participations** — the registration endpoint creates the
   `UserHofParticipation` and `UserYearParticipation` rows that the HoF tables
   expect. Mirror that logic, or create them explicitly.
3. **Entries** — one `HofEntry` per `(memberId, hofId, yearId)` carrying the per-year
   inputs and the cumulative totals. The combination is unique.
4. **Totals** — after inserting entries, run the cumulative recalculation
   (`src/lib/recalculate-totals.ts`) for each affected member/HoF pair. It is
   not triggered automatically by a bulk insert.

#### The shape of the original member register

The released example — `data/examples/member-register.example.csv` — carries the
24 columns the removed importer consumed:

`Personal Name`, `Family Name`, `Residence Country`, `Birth Country`,
`Year of Birth`, `Gender`, `Email address`, `Is active`, `Is forum member`,
`2019 RL Participator?`, `2020`–`2024 PR/Hall Participator?`,
`P-Index Registered?`, `Info retention consent`, `Publish totals consent`,
`Peakbagger Member`, `Peakbagger All Ascents?`, `BwB Forum Nickname`,
`Hill Bagging ID`, `Forum Join month`, `Forum Join year`.

Three things that source data needed, worth knowing if you write a similar
importer:

- **Country codes were not ISO 3166-1.** The register used `UK`, `UK-ENG`,
  `UK-SCO`, `UK-CYM`, `USA`, `CAN`, `D`, `F`, `N`, `A`, `H`, `IRL` and several
  `ES` variants; map them to `GB`, `US`, `CA`, `DE`, `FR`, `NO`, `AT`, `HU`,
  `IE` and `ES`.
- **Region codes were not the database's.** `ES-CAT` → `ES-CT`, `ES-MAD` →
  `ES-MD`, `GB-SCO` → `GB-SCT`, `GB-CYM` → `GB-WLS`, `D-BY` → `DE-BY`, `D-HE` →
  `DE-HE`, `NL-Limburg` → `NL-LI`. Treat `prisma/regions/<CC>.json` as
  authoritative and expect rows that match no region.
- **Consent was derived, not stored.** A `1` or `R` in a participation column
  implied PR/Hall consent and `P-Index Registered?` implied P-Index consent,
  while the two consent columns held explicit `DD/MM/YYYY` dates.

Use `scripts/shared/prisma-client.js` and wrap the import in a transaction, or
run it with `--dry-run` support so it can be rehearsed. If your source is a
CSV, keep it out of git — `.gitignore` already covers `data/import/`.

**Note:** the CSV fixtures that shipped with earlier versions of this project
contained real member data and are no longer in version control.

---

## 20. Placeholders to replace before deploying

Every value in this repository that referred to a real domain, address, or
credential has been replaced with a placeholder. **Nothing here is a working
value.** Replace the items below with your own before deploying.

### How to find them

```bash
git ls-files -z | xargs -0 grep -n "example\.com"
```

Search the whole tracked tree rather than a list of file extensions. An
`--include`-based search misses `.env.example` (no matching extension),
`public/robots.txt`, `scripts/seed/seed-demo-users.js` and
`data/examples/member-register.example.csv`, while pulling in unpublished
material such as `docs/internal/` and `CHANGELOG.md`. `git ls-files` returns
every tracked file, so nothing that ships is missed; the release manifest
(`scripts/publish/public-exclude.txt`) decides what is actually published.

### Required

| Placeholder                       | Where                                                                                                          | Replace with                                                                                                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://example.com`             | `app/layout.tsx`, `app/sitemap.ts`                                                                             | Your public base URL. Both read `NEXTAUTH_URL` first and only fall back to the placeholder, so setting the env var is normally enough.                                                                                                   |
| `https://www.example.com`         | `data/legal/privacy-policy.md`, `data/legal/terms-of-service.md`                                               | Your public URL. These are served to users at `/api/legal/*`.                                                                                                                                                                            |
| `privacy@example.com`             | `data/legal/privacy-policy.md`, `data/legal/terms-of-service.md`                                               | Your data-controller contact address. Required for the privacy policy to be valid.                                                                                                                                                       |
| `no-reply@example.com`            | `.env.example`, `app/api/support-requests/route.ts`                                                            | Your sender address (must be verified with Brevo).                                                                                                                                                                                       |
| `example.com`                     | `scripts/deployment/deploy.sh`, `setup-nginx.sh`, `pull-db.sh`, `deploy-turnstile-env.sh`, `public/robots.txt` | Your domain. `deploy.sh` / `pull-db.sh` set it as `REMOTE_HOST`; `deploy-turnstile-env.sh` uses the `bwb.example.com` form.                                                                                                              |
| `admin@example.com`               | `scripts/deployment/setup-nginx.sh`                                                                            | The registration address passed to `certbot --email` when issuing the TLS certificate.                                                                                                                                                   |
| `root@example.com`                | `package.json` (`restart-prod`)                                                                                | Your server user and host. Note the deployment scripts do not contain this literal — they compose it from `REMOTE_USER` and `REMOTE_HOST`.                                                                                               |
| `your-server`, `your-server-user` | `scripts/deployment/deploy-turnstile-env.sh`                                                                   | Your server host and user.                                                                                                                                                                                                               |
| `/srv/bwb`                        | `scripts/deployment/deploy.sh`, `setup-nginx.sh`, `pull-db.sh`, `docker-compose.prod.yml`                      | Your server install prefix. `deploy.sh` reads `REMOTE_PATH`; the others use this default. It is a conventional Linux path, not a sensitive value — change it to match your server. `src/lib/constants.ts` mentions it only in a comment. |

> `release-bot@example.com` (the release commit identity) lives in
> `scripts/publish/build-public-tree.sh`, which is release tooling and **not
> part of the release tree**. You only need to change it if you keep using that
> builder in the private repository.

### Credentials

All of these live in `.env.example` as documented templates.

| Placeholder                                            | Replace with                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `your-secret-key-change-this-in-production`            | `openssl rand -base64 32`                                                                                                                                                                                                                                                                                                                    |
| `your-turnstile-site-key`, `your-turnstile-secret-key` | Cloudflare Turnstile keys                                                                                                                                                                                                                                                                                                                    |
| `sk_test_your_stripe_secret_key_here`                  | Stripe secret key                                                                                                                                                                                                                                                                                                                            |
| `whsec_your_webhook_secret_here`                       | Stripe webhook signing secret                                                                                                                                                                                                                                                                                                                |
| `xkeysib-...`                                          | Brevo API key                                                                                                                                                                                                                                                                                                                                |
| `sk-...`                                               | OpenAI API key (optional)                                                                                                                                                                                                                                                                                                                    |
| `your-org/your-repo`                                   | GitHub `owner/name` for commit deep links (optional)                                                                                                                                                                                                                                                                                         |
| `change-me-1234`                                       | **Live, not historical.** `npm run db:seed-users` gives all 32 synthetic users this hard-coded password (`scripts/seed/seed-users.js`, bcrypt cost 10) and prints it to the console. That script has **no `NODE_ENV` guard**, so unlike `db:seed` it will run against production. Never run it there, and reset any account that carries it. |

Prefer environment variables over editing files.
`scripts/deployment/deploy.sh` generates `NEXTAUTH_SECRET` at deploy time with
`openssl rand -base64 32`, and `scripts/deployment/deploy-turnstile-env.sh`
reads the Turnstile keys from the environment and aborts if they are unset.

### Do NOT change

- **`i@izs.me` in `package-lock.json`** — third-party npm deprecation metadata.
- **`@example.com` / `@test.com` addresses under `__tests__/`,
  `data/examples/` and `scripts/seed/seed-demo-users.js`** — synthetic fixtures
  and demo accounts, intentionally fake. The demo users need a reserved domain,
  and `example.com` is the correct one.
- **`LICENSES/` and `NOTICE`** — legal attributions, including copyright
  holders' names and the CC BY-SA 2.5 image credit. Reproduce verbatim.
- **`data/legal/` structure** — the application serves these files at runtime;
  deleting or renaming them breaks the consent and legal flow.
