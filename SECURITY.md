# Security Policy

This document is the security policy for the Baggers Without Borders (BWB)
application. It covers how to report a vulnerability, what is in scope, the
security model **as actually implemented**, and the risks that are knowingly
accepted.

Read it alongside:

- [`IMPLEMENTATION.md`](IMPLEMENTATION.md) §16 — the technical defect catalogue.
- [`FEATURES.md`](FEATURES.md) §9 — the full 41-item list of gaps and inconsistencies.
- [`SETUP.md`](SETUP.md) §6 — deployment, including the pre-deployment checklist
  at §6.1.

## Project status and reporting

This is a handover release. It is not actively maintained, no instance of it is
running, and there are no supported versions. Fixes are not planned or guaranteed.

If you find a security problem in this code, fix it in your own fork.

If you find real personal data or a working credential in this repository, report
it privately using GitHub's "Report a vulnerability" button on the Security tab. Do
not open a public issue, and do not include the data or credential itself in your
report. Private reports reach the repository owner. No response or fix is promised.

### What to include

- What you found: real personal data or a working credential.
- Where it is: the file path and line number.

Do not include the personal data or the credential value itself.

### Testing

No safe harbour is offered. If you test this software, test only your own
deployment and your own accounts. Never test against real member data or anyone
else's service.

Several of the mitigations described below depend on how a deployment is
configured — the reverse proxy, the environment variables, and the ownership of the
data volumes — so they are properties of the deployment, not promises about it.

## Scope

**In scope**

- Authentication and session handling (`src/lib/auth.ts`, `middleware.ts`).
- Authorization on any `/api/**` route, including privilege escalation and IDOR.
- File upload handling and the uploads serving route
  (`app/api/uploads/[...path]/route.ts`).
- Injection (SQL, command, template), path traversal, and SSRF.
- Stored and reflected XSS, and CSRF.
- Exposure of personal data or credentials.
- Payment and webhook handling (`app/api/donations/**`, `app/api/webhooks/**`).

**Out of scope**

- Findings that require a compromised administrator account or physical access.
- Reports produced solely by an automated scanner with no demonstrated impact.
- Missing security headers or cookie attributes where no concrete attack is shown.
- Self-XSS and social engineering.
- Denial of service through unbounded resource consumption by an authenticated
  admin — it is already documented (see _Known accepted risks_).
- Vulnerabilities in third-party services (Stripe, Brevo, Cloudflare, OpenAI);
  report those to the vendor.

## Threat model and trust boundaries

| Property        | Reality                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Deployment unit | One Node.js process, one SQLite file, single writer                                                            |
| Perimeter       | A reverse proxy the operator supplies; the app has no WAF, no SIEM, no secret manager                          |
| Assets          | Member PII (names, emails, birth years, residence, climbing records), consent evidence, credentials, donations |
| Adversaries     | Anonymous internet users, and **authenticated members** (see _Authorization_)                                  |
| Non-goals       | Multi-tenant isolation, formal compliance certification, defence against a compromised host                    |

Four trust boundaries matter:

1. **The proxy.** Rate limiting, audit-log country attribution and client-IP
   logging all trust `CF-Connecting-IP`, `X-Forwarded-For`, `X-Real-IP` and
   `CF-IPCountry`. If the proxy does not overwrite them, all three are spoofable.
2. **The session cookie.** A signed JWT with no server-side store, so it cannot
   be revoked before expiry.
3. **The uploads root.** Files written by the app are served by an API route that
   performs no authorization (`IMPLEMENTATION.md` §16.1).
4. **Third parties.** Inbound webhooks are authenticated by signature (Stripe) or
   by a source-IP check (Brevo); outbound calls carry member data to Stripe,
   Brevo and OpenAI.

## Authentication

- **Provider.** NextAuth v4 with a single Credentials provider. The identifier is
  an email **or** a username (`src/lib/identifierUtils.ts`).
- **Password storage.** bcrypt. Cost **12** on account creation; cost **10** in the
  in-app password-change route and in `scripts/admin/reset-password.js` —
  inconsistent, but all are above the current minimum recommendation.
- **Email verification is mandatory.** `emailVerified` must be set before a login
  succeeds.
- **Tokens.** 32 random bytes stored hashed, single-use: verification links expire
  in 24 hours, password-reset links in 1 hour.
- **Bot protection.** Cloudflare Turnstile on login, registration,
  forgot-password, reset-password, resend-verification and the anonymous contact
  form. It **fails open** on timeouts and non-2xx responses (see _Known accepted
  risks_). The development skip applies to **login only**.
- **Not implemented:** MFA, breach-list checks against a compromised-password
  corpus, password expiry, and login notifications.

### Known defect: passwords written to the server log

`app/api/users/[id]/password/route.ts` logs the received password in plaintext
(`console.log("[PASSWORD CHANGE] Password received:", password)`), along with its
length and the first characters of the resulting hash. Anyone with access to the
application log can read a password that may be reused elsewhere. Remove those
statements before running a public deployment (`FEATURES.md` §9).

## Authorization

The authorization model is the single most important thing to understand before
threatening or extending this application.

`middleware.ts` is an **allow-list**: only path prefixes in its matcher are
checked at all. Within it:

- `/admin`, `/api/admin` and `/api/change-requests` require `role === "ADMIN"`.
- `/api/users/[id]/*` requires ownership or `ADMIN` (`accept-consents` is exempt).
- **Every other matched prefix requires only that a session exists.**

Consequences:

- The role check is enforced **only** in the middleware, and only for those three
  prefixes. Handlers elsewhere carry comments claiming "middleware ensures
  ADMIN"; those comments are false. Role checks that do exist are applied
  inconsistently route by route.
- Routes outside the matcher (`/api/journal`, `/api/sponsors`,
  `/api/hof-year-configs`, `/api/award-tiers`, `/api/hof-tables`,
  `/api/support-requests`, `/api/donations`, `/api/uploads`, …) enforce whatever
  they enforce in-route, or nothing.
- **`/api/uploads/[...path]` performs no authorization at all** — see _Known
  accepted risks_.

Administrative endpoints that were reachable by any signed-in member are now
role-checked in the middleware (`IMPLEMENTATION.md` §16.5, §16.6):
`/api/backup`, `/api/documents`, `/api/hof-entries` and the `/api/users`
collection require `ADMIN` for every method, and writes to `/api/hofs`,
`/api/years`, `/api/consent-types`, `/api/interests` and `/api/app-settings`
require it too. The former exposures were `POST /api/users` accepting a `role`
field (a member could mint an `ADMIN`), `/api/backup` handing any member the
archive password, and unguarded `/api/documents` reads.

What is still readable without an admin role:

| Endpoint                    | Exposure                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `GET /api/hof-year-configs` | configuration thresholds, internal notes, Meister report      |
| `GET /api/consent-types`    | consent types including admin-only internal notes             |
| `GET /api/hof-tables`       | **public**: member names, totals, FPR, retirement/death years |

The first two are open on purpose — the member consents screen reads the consent
types, and `/api/hof-year-configs` sits outside the matcher — so the internal
notes they return are a data-minimisation problem, not an access-control one.

The coverage test `__tests__/security/api-route-auth-coverage.test.ts` does not
catch a wrong rule: its `GUARD_PATTERN` counts `getSession()` — and even
`verifyTurnstileToken` — as a guard, and never inspects the role. Passing CI is
not evidence that a route is authorized. The role rule itself is pinned by
`__tests__/unit/routeAuthz.test.ts`; that guards `requiresAdminRole()`, not the
absence of a needed in-route check.

**Deployer mitigation.** The administrative families are role-checked now, but
the middleware is a single barrier and the handlers behind it carry no role check
of their own. Restricting `/api/backup`, `/api/app-settings`, `/api/documents`,
`/api/users` and `/admin` to trusted addresses at the proxy is still worthwhile
defence in depth.

## Sessions and cookies

- A signed JWT in an HttpOnly cookie (`next-auth.session-token`), `SameSite=Lax`,
  `Secure` when `NEXTAUTH_URL` is `https://`.
- **No server-side session store.** A token cannot be revoked before it expires;
  role changes and sign-out take effect only when the JWT is refreshed. Rotating
  `NEXTAUTH_SECRET` invalidates every session at once.
- The JWT carries `id` and `role`, so a role downgrade is not immediate.

## CSRF and browser security

- NextAuth applies its own CSRF protection to `/api/auth/*`.
- Custom API routes rely on the `SameSite=Lax` session cookie and same-origin
  deployment rather than per-request CSRF tokens. Cross-site `POST`s do not carry
  the cookie, but **do not add permissive CORS**, and keep state-changing
  operations on `POST`/`PATCH`/`DELETE`, never `GET`.
- Response headers set for every path in `next.config.js`:

  | Header                      | Value                                                                                                         |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
  | `Content-Security-Policy`   | `default-src 'self'` plus Cloudflare Turnstile; **`script-src` allows `'unsafe-inline'` and `'unsafe-eval'`** |
  | `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                                                                         |
  | `X-Frame-Options`           | `SAMEORIGIN`                                                                                                  |
  | `X-Content-Type-Options`    | `nosniff`                                                                                                     |
  | `Referrer-Policy`           | `strict-origin-when-cross-origin`                                                                             |
  | `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                                                                    |

- The application never uses `dangerouslySetInnerHTML` and never enables
  `rehype-raw`. Journal markdown is rendered without `rehype-sanitize` (raw HTML
  is escaped, not executed); helpdesk timeline markdown **is** sanitised.

## Input handling and uploads

- **SQL injection.** All access goes through Prisma with parameterised queries.
  There is no `$queryRawUnsafe`/`$executeRawUnsafe` in the tree; the one raw
  query uses the tagged-template form.
- **Path traversal.** `safeResolvePath()` (`src/lib/fileUtils.ts`) rejects paths
  that escape the base directory, and `/api/uploads/[...path]` rejects `..` and
  leading `/`, then verifies the resolved path stays inside the uploads root.
- **Upload validation.** Images are validated by **magic bytes**, not just
  extension, and re-encoded with `sharp`. Per-subsystem size and type limits are
  tabulated in `FEATURES.md` §7.6.
- **Exception:** the public support form (`POST /api/support-requests`) checks
  only `size > 0` — no MIME allow-list, no per-file cap, no count cap — and the
  files it writes are then served by the unauthenticated uploads route. See
  _Known accepted risks_.
- **Upload serving.** Content-Type is derived from the file extension; anything
  outside the small map is served as `application/octet-stream`, and `nosniff` is
  set globally. Responses are nonetheless cached
  `public, max-age=31536000, immutable` and are **not** authorization-checked.

## Secrets management

- All secrets arrive through environment variables; `.env*` is gitignored.
  `IMPLEMENTATION.md` §20 lists every placeholder to replace.
- **Two-tier secret scanning** (`scripts/security/scan-secrets.js`): a pattern
  scan of the tracked tree, plus a cross-reference of every value ≥ 16 characters
  from your local `.env` files against that tree. It runs in `.husky/pre-commit`
  and in the CI `security-audit` workflow. Never bypass it — rotate the credential
  and remove the value.
- **Historical exposure.** Credentials used by the original deployment have been
  revoked. None appear in this repository. Anyone deploying this software must
  create and use their own.
- **Weak default.** Backup archives fall back to the literal password
  `default-password-change-me` when `BACKUP_PASSWORD` is unset, and the `.env`
  that `deploy.sh` generates on a fresh server does not set it. Always set it.

## Abuse controls

Rate limiting is a DB-backed fixed window (`RateLimitAttempt`); the limiter table
is in `IMPLEMENTATION.md` §6.4. Three caveats for threat modelling:

- **Login and reset-password are not rate-limited** — only Turnstile protects them.
- The donation limiter reads `X-Forwarded-For` **before** `CF-Connecting-IP`,
  unlike every other caller.
- All limiters are bypassable if the proxy does not overwrite client-IP headers
  (see _Threat model_).

Turnstile is the only control on the public registration and contact forms, and
it fails open.

## Third-party services and data flows

| Service              | Direction | Data leaving the boundary              | Inbound authentication             |
| -------------------- | --------- | -------------------------------------- | ---------------------------------- |
| Stripe               | both      | donor email, name, amount, currency    | `stripe-signature` on the raw body |
| Brevo                | both      | recipient email, name, message content | source-IP check (spoofable)        |
| Cloudflare Turnstile | outbound  | visitor IP, challenge token            | —                                  |
| OpenAI               | outbound  | git commit messages and hashes         | —                                  |
| GitHub               | links     | repository name (public)               | —                                  |

The Brevo webhook authenticates by matching the caller IP against hard-coded
Brevo ranges from `X-Forwarded-For`. That header is client-controlled unless a
trusted proxy overwrites it, so the check is weaker than a signature. The Stripe
webhook correctly verifies a signature against the unparsed body.

## Data protection and retention

- **PII held:** names, email addresses, birth year, gender, birth/residence
  country and region, external platform IDs, climbing records, and consent
  evidence including optional document uploads.
- **Audit logs** store a **SHA-256 hash of the IP**, never the raw address, plus
  a Cloudflare-derived country code, a parsed user agent, and the affected
  resource. Retention is 90 days for `AUTH` and 730 days otherwise, but cleanup
  is a manual command (`npm run db:cleanup-logs`) with no scheduler configured.
- **Email logs** carry a 90-day retention date that **nothing enforces** — no
  cleanup script exists — so they grow without bound.
- **Consent** is tracked per `ConsentType` with a date, method and evidence.
  Registration creates a row per active type; the gate is client-rendered and
  fails open (`src/lib/consent-check.ts`), so it is a compliance aid, not an
  access control.
- **Backups** are AES-256 ZIP archives of the database or uploads tree. There is
  no restore endpoint and no pruning; the archive password defaults to a public
  literal if unset.
- **Deletion** anonymises or deletes most member data (`IMPLEMENTATION.md` §5.4),
  but a member who created a journal cannot currently be deleted (generic 500).

## Logging and monitoring

- Administrative mutations and auth events are written to `AuditLog`
  (`src/lib/auditLog.ts`). Writes are fire-and-forget, so gaps are possible under
  DB contention.
- All IP addresses written to the audit log are hashed, so the log is not a
  source of raw member IPs.
- **There is no alerting, no log shipping and no intrusion detection.** Detecting
  abuse depends on the operator reading the audit log and watching rate-limit
  rejections. Request bodies are never logged — except the password-logging
  defect above.

## Dependency and supply-chain security

- `.github/workflows/security-audit.yml` runs the secret scan on every push and
  pull request, and on a weekly schedule; it also reports `npm audit` findings
  and outdated packages **without failing the build**.
- `npm run sbom` produces a CycloneDX software bill of materials.
- Dependabot **alerts** are enabled on this repository, so its dependency graph and
  advisories are visible on the Security tab. The repository contains no
  `.github/dependabot.yml`, and automated security-update pull requests are turned
  off: this release is not developed here, so dependency changes are not made here.
- The tree as published has open advisories, including critical and high ones in
  `next` and `next-auth`. Patched versions of both exist. Upgrading is left to
  whoever continues the project; `npm audit` lists what is outstanding.
- The runtime and native modules are pinned to **Node 24** (`engines`,
  `engine-strict`, `.nvmrc`, `scripts/dev/ensure-node-24.js`); other majors fail
  on `better-sqlite3`'s ABI.

## Hardening checklist for deployers

Before exposing an instance to the internet:

1. Set every production variable, including `BACKUP_PASSWORD`; never deploy with
   the defaults from `.env.example` or a generated `.env` alone (`SETUP.md` §6.1).
2. Terminate TLS at a proxy that **overwrites** `CF-Connecting-IP` /
   `X-Forwarded-For` / `X-Real-IP`, and block `/api/health?detailed=true`.
3. Create your own credentials for every service. Never reuse values from examples
   or documentation.
4. Restrict `/admin`, `/api/backup`, `/api/app-settings`, `/api/documents` and
   `/api/users` to trusted addresses until the authorization boundary is fixed.
5. Remove the plaintext password logging in
   `app/api/users/[id]/password/route.ts`.
6. Give the uploads route a per-prefix policy (public for `sponsors/`,
   session-or-admin for the rest) and switch its cache header to `private,
no-store` for non-public prefixes.
7. Keep backups off the web root, restrict their directory to the service user,
   and test a restore.
8. Schedule the audit-log and rate-limit cleanup jobs; note they are not in the
   Docker image.

## Known accepted risks

These are deliberate trade-offs or environment-dependent weaknesses, not
oversights:

- **Turnstile fails open.** A Cloudflare outage removes bot protection rather
  than locking users out. Availability was chosen over strictness.
- **CSP allows `'unsafe-inline'` and `'unsafe-eval'` in `script-src`** for Next.js
  compatibility. This weakens XSS defence-in-depth; tightening it is left to whoever continues the project.
- **No server-side session revocation**, so a stolen token stays valid until it
  expires and role changes are delayed.
- **No MFA** on any account, including administrators.
- **Dependency advisories** are reported by CI but do not fail the build. The tree
  as published has open advisories, several of them critical or high, in `next`,
  `next-auth` and `hono` among others; patched versions exist for all of the ones
  checked. Check `npm audit`, `npm run sbom` and the repository's Security tab.

## Known defects (documented, not accepted)

These are bugs, not policy choices. They are catalogued in
`IMPLEMENTATION.md` §16 and `FEATURES.md` §9:

- `/api/uploads/[...path]` performs no authorization — **high severity**.
- The authorization boundary described under _Authorization_ above.
- Passwords written to the server log.
- The Brevo webhook's spoofable source-IP check.
- `GET /api/health?detailed=true` is public and discloses internal paths and a
  directory listing.
- Backup archives default to a public password when `BACKUP_PASSWORD` is unset. The
  backup endpoints themselves require `ADMIN` for every method (see _Authorization_
  above); the fallback password is the defect, not the reachability.
- The public support form accepts unbounded uploads (no MIME allow-list, no size
  or count cap) and stores them under a path served without authorization, which
  makes it a disk-exhaustion and data-exposure path.
