# API Reference

Complete route inventory for the BWB (Baggers Without Borders) HTTP API: every
route handler under `app/api`, the HTTP methods it exports, and the access level
that applies.

The inventory is derived from the routing tree, so it is exhaustive — **93 route
handlers exposing 149 HTTP operations**. Authorization is enforced in two layers
(`middleware.ts` and in-route guards); the model is described in
[`SECURITY.md`](../SECURITY.md) and [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) §6.3.

> 📅 **Verified:** 2026-09-16 against `main`.
>
> Routes change with the code. If you add or rename one, update this file — and
> note that `__tests__/security/api-route-auth-coverage.test.ts` will fail CI if a
> new route is neither matcher-covered, declared public with a reason, nor guarded
> in-route.

**Base URL (Development)**: `http://localhost:1345/api`
**Base URL (Production)**: `https://your-domain/api` (see `.env.example`)

---

## Table of Contents

- [Authentication and access levels](#authentication-and-access-levels)
- [Conventions](#conventions)
- [Endpoint inventory](#endpoint-inventory)
- [Rate limiting](#rate-limiting)
- [Webhooks](#webhooks)
- [Known limitations](#known-limitations)

---

## Authentication and access levels

BWB uses **NextAuth v4** with a single Credentials provider (email **or**
username). Sessions are stateless JWTs in an HttpOnly cookie. Include the session
cookie in requests; there is no API key or bearer-token scheme.

### Login

`POST /api/auth/callback/credentials` is handled by NextAuth. The credentials
flow, in order: Turnstile verification (login only, skipped in development),
identifier resolution, `bcrypt.compare`, a mandatory `emailVerified` check, and
an audit-log entry.

### Access levels

| Label                | Meaning                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| **Public**           | No session required.                                                                           |
| **Session**          | Any authenticated session; no role check. Enforced by `middleware.ts`.                         |
| **Owner or admin**   | `token.sub` equals the `:id` in the path, or the role is `ADMIN`. Enforced by `middleware.ts`. |
| **Admin**            | Role must be `ADMIN`. Enforced by `middleware.ts` — see the role rules below.                  |
| **Admin (in-route)** | The handler checks the role itself.                                                            |
| **In-route**         | The handler enforces its own check (session, owner, or role) — read the handler.               |

> **How the role check works.** `middleware.ts` requires `ADMIN` for `/admin`,
> `/api/admin`, `/api/change-requests`, `/api/backup`, `/api/documents`,
> `/api/hof-entries` and the `/api/users` collection, and for every method except
> the bare collection `GET` of `/api/hofs`, `/api/years`, `/api/consent-types`,
> `/api/interests` and `/api/app-settings`. That carve-out exists because member
> screens read those five collections — the profile interest picker, the member
> consents screen, the contact form and the funding bar — while every `/:id`
> sub-path and every write is administrative.

---

## Conventions

### Success responses

A handler returns either the resource directly or a paginated envelope:

```json
{ "data": [], "total": 0, "page": 1, "limit": 20, "pages": 0 }
```

### Errors

Errors are `{ "error": "message" }` with an appropriate status. Some handlers add
a `details` field.

| Status | Meaning                                        |
| ------ | ---------------------------------------------- |
| `400`  | Validation error / bad request                 |
| `401`  | Not authenticated                              |
| `403`  | Authenticated but not permitted                |
| `404`  | Resource not found                             |
| `409`  | Conflict (duplicate unique value)              |
| `429`  | Rate limit exceeded (no `Retry-After` is sent) |
| `500`  | Unhandled server error                         |

### Dynamic parameters

Route params are async in Next.js 16 and must be awaited:

```typescript
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

In the tables below, `:id` stands for a dynamic segment and `*` for a catch-all.

### Authorization in handlers

```typescript
import { getSession, getOptionalSession, isAdmin } from "@/src/lib/api-auth";

const session = await getSession(); // throws if unauthenticated
const optional = await getOptionalSession(); // returns null instead
```

Use `getOptionalSession()` for public reads that enrich the response when a
session is present.

---

## Endpoint inventory

### Admin

| Method | Path                                | Access    | Purpose                                        |
| ------ | ----------------------------------- | --------- | ---------------------------------------------- |
| GET    | `/api/admin/logs`                   | **Admin** | List audit-log entries with filters            |
| GET    | `/api/admin/members/check-email`    | **Admin** | Check whether an email address is already used |
| GET    | `/api/admin/members/check-username` | **Admin** | Check whether a username is taken              |
| GET    | `/api/admin/roles`                  | **Admin** | List assignable roles                          |
| GET    | `/api/admin/test-results`           | **Admin** | Latest Jest test-results summary               |

### App settings

| Method | Path                | Access      | Purpose                                                                 |
| ------ | ------------------- | ----------- | ----------------------------------------------------------------------- |
| GET    | `/api/app-settings` | **Session** | Read key/value settings (funding bar, journal visibility) by `category` |
| PUT    | `/api/app-settings` | **Admin**   | Upsert a setting                                                        |
| DELETE | `/api/app-settings` | **Admin**   | Delete a setting                                                        |

### Auth

| Method    | Path                            | Access     | Purpose                                        |
| --------- | ------------------------------- | ---------- | ---------------------------------------------- |
| GET, POST | `/api/auth/*`                   | **Public** | NextAuth handler (sign-in, callbacks, session) |
| POST      | `/api/auth/register`            | **Public** | Create an account (role is forced to `USER`)   |
| POST      | `/api/auth/verify-email`        | **Public** | Consume an email-verification token            |
| POST      | `/api/auth/resend-verification` | **Public** | Re-send the verification email                 |
| POST      | `/api/auth/forgot-password`     | **Public** | Request a password-reset link                  |
| POST      | `/api/auth/reset-password`      | **Public** | Consume a reset token and set a new password   |

All public auth routes are Turnstile-protected (the login path skips Turnstile in
development only) and rate-limited — see [Rate limiting](#rate-limiting).

### Award tiers

| Method | Path                   | Access               | Purpose                    |
| ------ | ---------------------- | -------------------- | -------------------------- |
| GET    | `/api/award-tiers`     | **Public**           | List award tier bands      |
| PUT    | `/api/award-tiers/:id` | **Admin (in-route)** | Update a tier's definition |

### Backup

| Method | Path                   | Access    | Purpose                                           |
| ------ | ---------------------- | --------- | ------------------------------------------------- |
| GET    | `/api/backup`          | **Admin** | List available backup archives                    |
| POST   | `/api/backup`          | **Admin** | Create an encrypted archive (database or uploads) |
| GET    | `/api/backup/:id`      | **Admin** | Download an archive                               |
| DELETE | `/api/backup/:id`      | **Admin** | Delete an archive                                 |
| GET    | `/api/backup/password` | **Admin** | Read the configured archive password              |

> These require only a session — **not** `ADMIN`. See `IMPLEMENTATION.md` §16.6.

### Change requests

| Method           | Path                                       | Access    | Purpose                                        |
| ---------------- | ------------------------------------------ | --------- | ---------------------------------------------- |
| GET, POST        | `/api/change-requests`                     | **Admin** | List / create change requests                  |
| GET, PUT, DELETE | `/api/change-requests/:id`                 | **Admin** | Read / update / delete one                     |
| GET, POST        | `/api/change-requests/:id/attachments`     | **Admin** | List / add attachments                         |
| DELETE           | `/api/change-requests/:id/attachments/:id` | **Admin** | Delete an attachment                           |
| PUT              | `/api/change-requests/:id/vote`            | **Admin** | Cast or change a vote                          |
| GET, POST        | `/api/change-requests/sync-git`            | **Admin** | Read / sync git commits (OpenAI summarisation) |

### Consent types

| Method           | Path                                     | Access      | Purpose                            |
| ---------------- | ---------------------------------------- | ----------- | ---------------------------------- |
| GET              | `/api/consent-types`                     | **Session** | List consent types                 |
| POST             | `/api/consent-types`                     | **Admin**   | Create a consent type              |
| GET, PUT, DELETE | `/api/consent-types/:id`                 | **Admin**   | Read / update / delete one         |
| POST             | `/api/consent-types/:id/assign`          | **Admin**   | Assign the type to members         |
| GET, POST        | `/api/consent-types/:id/attachments`     | **Admin**   | List / upload template attachments |
| DELETE           | `/api/consent-types/:id/attachments/:id` | **Admin**   | Delete a template attachment       |

### Geography

| Method | Path             | Access     | Purpose                                                |
| ------ | ---------------- | ---------- | ------------------------------------------------------ |
| GET    | `/api/countries` | **Public** | List ISO 3166 countries (`{ countries, grouped }`)     |
| GET    | `/api/regions`   | **Public** | List regions for a country (`?countryCode=`, required) |

### Documents

| Method             | Path                         | Access    | Purpose                     |
| ------------------ | ---------------------------- | --------- | --------------------------- |
| GET, POST          | `/api/documents`             | **Admin** | List / upload documents     |
| GET, PATCH, DELETE | `/api/documents/:id`         | **Admin** | Read / rename / delete one  |
| GET                | `/api/documents/:id/content` | **Admin** | Stream a document's content |
| POST               | `/api/documents/:id/copy`    | **Admin** | Copy a document or folder   |
| GET                | `/api/documents/:id/stats`   | **Admin** | Storage statistics          |

### Donations

| Method | Path                      | Access     | Purpose                                         |
| ------ | ------------------------- | ---------- | ----------------------------------------------- |
| POST   | `/api/donations/checkout` | **Public** | Create a Stripe Checkout session (rate-limited) |
| POST   | `/api/donations/webhook`  | **Public** | Stripe webhook (signature-verified)             |

### Hall of Fame

| Method           | Path                                      | Access               | Purpose                                  |
| ---------------- | ----------------------------------------- | -------------------- | ---------------------------------------- |
| GET              | `/api/hofs`                               | **Session**          | List Halls of Fame                       |
| POST             | `/api/hofs`                               | **Admin**            | Create a Hall of Fame                    |
| GET, PUT, DELETE | `/api/hofs/:id`                           | **Admin**            | Read / update / delete one               |
| GET, POST        | `/api/hof-entries`                        | **Admin**            | List / create entries                    |
| GET, PUT, DELETE | `/api/hof-entries/:id`                    | **Admin**            | Read / update / delete one               |
| GET, POST        | `/api/hof-year-configs`                   | **Session**          | List / create per-year thresholds        |
| GET              | `/api/hof-year-configs/:id`               | **Session**          | Read one configuration                   |
| PUT, DELETE      | `/api/hof-year-configs/:id`               | **Admin (in-route)** | Update / delete one                      |
| POST, DELETE     | `/api/hof-year-configs/:id/meister-image` | **Admin (in-route)** | Upload / remove the Meister report image |

### HoF tables

| Method | Path                            | Access            | Purpose                    |
| ------ | ------------------------------- | ----------------- | -------------------------- |
| GET    | `/api/hof-tables`               | **Public (read)** | Public Hall of Fame tables |
| GET    | `/api/hof-tables/overall-stats` | **Public**        | Aggregate statistics       |

> `GET /api/hof-tables` returns member display names, totals, FPR and exclusion
> statistics to anonymous callers (`FEATURES.md` §9.6).

### Interests

| Method           | Path                 | Access      | Purpose                    |
| ---------------- | -------------------- | ----------- | -------------------------- |
| GET              | `/api/interests`     | **Session** | List interests             |
| POST             | `/api/interests`     | **Admin**   | Create an interest         |
| GET, PUT, DELETE | `/api/interests/:id` | **Admin**   | Read / update / delete one |

### Journal

| Method             | Path                        | Access       | Purpose                          |
| ------------------ | --------------------------- | ------------ | -------------------------------- |
| GET, POST          | `/api/journal`              | **In-route** | List / create posts              |
| GET, PUT, DELETE   | `/api/journal/:id`          | **In-route** | Read / update / delete a post    |
| PUT                | `/api/journal/:id/children` | **In-route** | Reorder or re-parent child posts |
| POST               | `/api/journal/:id/status`   | **In-route** | Change publication status        |
| GET, POST          | `/api/journal/issues`       | **In-route** | List / create issues             |
| PUT, DELETE        | `/api/journal/issues/:id`   | **In-route** | Update / delete an issue         |
| POST               | `/api/journal/photos`       | **In-route** | Upload a photo                   |
| GET, PATCH, DELETE | `/api/journal/photos/:id`   | **In-route** | Read / update / delete a photo   |
| GET, PUT           | `/api/journal/settings`     | **In-route** | Read / update journal settings   |
| GET                | `/api/journal/slug/:id`     | **Public**   | Read a published post by slug    |

### Legal

| Method | Path             | Access     | Purpose                                                                              |
| ------ | ---------------- | ---------- | ------------------------------------------------------------------------------------ |
| GET    | `/api/legal/:id` | **Public** | Privacy policy or terms of service (`:id` is `privacy-policy` or `terms-of-service`) |

### My bags

| Method           | Path               | Access      | Purpose                        |
| ---------------- | ------------------ | ----------- | ------------------------------ |
| GET              | `/api/my-bags`     | **Session** | List the signed-in user's bags |
| GET, PUT, DELETE | `/api/my-bags/:id` | **Session** | Read / update / delete one     |

### Sponsors

| Method       | Path                     | Access       | Purpose                      |
| ------------ | ------------------------ | ------------ | ---------------------------- |
| GET, POST    | `/api/sponsors`          | **In-route** | Public list / admin create   |
| PUT, DELETE  | `/api/sponsors/:id`      | **In-route** | Admin update / delete        |
| POST, DELETE | `/api/sponsors/:id/logo` | **In-route** | Admin upload / remove a logo |

### Support requests (helpdesk)

| Method      | Path                                                  | Access       | Purpose                                                     |
| ----------- | ----------------------------------------------------- | ------------ | ----------------------------------------------------------- |
| GET, POST   | `/api/support-requests`                               | **In-route** | Admin list / **public** submission (Turnstile + rate limit) |
| GET, PUT    | `/api/support-requests/:id`                           | **In-route** | Read / update a ticket                                      |
| GET, POST   | `/api/support-requests/:id/notes`                     | **In-route** | List / add notes                                            |
| PUT, DELETE | `/api/support-requests/:id/notes/:id`                 | **In-route** | Edit (within the window) / delete a note                    |
| DELETE      | `/api/support-requests/:id/notes/:id/attachments/:id` | **In-route** | Delete a note attachment                                    |
| GET         | `/api/support-requests/my-count`                      | **In-route** | Count the caller's open tickets                             |

### Operations

| Method | Path                     | Access     | Purpose                                                |
| ------ | ------------------------ | ---------- | ------------------------------------------------------ |
| GET    | `/api/health`            | **Public** | Liveness probe; `?detailed=true` adds diagnostics      |
| GET    | `/api/version`           | **Public** | Deployed version string                                |
| GET    | `/api/turnstile/sitekey` | **Public** | Public Turnstile site key                              |
| GET    | `/api/uploads/*`         | **Public** | Serve uploaded files — **no authorization, see below** |

### Users

| Method             | Path                                          | Access             | Purpose                                                        |
| ------------------ | --------------------------------------------- | ------------------ | -------------------------------------------------------------- |
| GET, POST          | `/api/users`                                  | **Admin**          | List users / create one                                        |
| GET, PATCH, DELETE | `/api/users/:id`                              | **Owner or admin** | Read / update / delete a user                                  |
| PATCH              | `/api/users/:id/password`                     | **Owner or admin** | Change a password                                              |
| GET, PUT           | `/api/users/:id/participations`               | **Owner or admin** | Read / update HoF and year participations                      |
| GET                | `/api/users/:id/hof-entries`                  | **Owner or admin** | Read a user's entries                                          |
| GET                | `/api/users/:id/hofmeister-assignments`       | **Owner or admin** | Read Meister assignments                                       |
| GET, POST          | `/api/users/:id/consents`                     | **Owner or admin** | List / record consents                                         |
| GET, PATCH, DELETE | `/api/users/:id/consents/:id`                 | **Owner or admin** | Read / update / delete one consent                             |
| GET, POST          | `/api/users/:id/consents/:id/attachments`     | **Owner or admin** | List / upload consent evidence                                 |
| DELETE             | `/api/users/:id/consents/:id/attachments/:id` | **Owner or admin** | Delete consent evidence                                        |
| POST               | `/api/users/accept-consents`                  | **Session**        | Accept the pending consent types (exempt from the owner check) |

### Webhooks

| Method | Path                  | Access     | Purpose                                               |
| ------ | --------------------- | ---------- | ----------------------------------------------------- |
| POST   | `/api/webhooks/brevo` | **Public** | Brevo delivery-status callback (source-IP restricted) |

### Years

| Method           | Path                                    | Access      | Purpose                               |
| ---------------- | --------------------------------------- | ----------- | ------------------------------------- |
| GET              | `/api/years`                            | **Session** | List years                            |
| POST             | `/api/years`                            | **Admin**   | Create a year                         |
| GET, PUT, DELETE | `/api/years/:id`                        | **Admin**   | Read / update / delete a year         |
| POST             | `/api/years/:id/validate-member-data`   | **Admin**   | Validate an uploaded member-data file |
| POST             | `/api/years/:id/import-member-data`     | **Admin**   | Import validated member data          |
| GET              | `/api/years/:id/member-data-summary`    | **Admin**   | Summarise member data for the year    |
| POST             | `/api/years/:id/delete-member-data`     | **Admin**   | Delete member data for the year       |
| POST             | `/api/years/:id/create-missing-entries` | **Admin**   | Create missing `HofEntry` rows        |

---

## Rate limiting

Rate limiting is a DB-backed fixed window (`RateLimitAttempt`), configured in
`src/lib/rateLimit.ts`. There is no general API throttle and **no `X-RateLimit-*`
response headers**.

| Limiter              | Key      | Limit | Window     | Applied to                             |
| -------------------- | -------- | ----- | ---------- | -------------------------------------- |
| `registration`       | IP       | 5     | 1 hour     | `POST /api/auth/register`              |
| `password-reset`     | email    | 5     | 1 hour     | `POST /api/auth/forgot-password`       |
| `email-verification` | email    | 10    | 1 hour     | `POST /api/auth/resend-verification`   |
| `support-request`    | IP/email | 5     | 15 minutes | `POST /api/support-requests`           |
| `note-creation`      | user     | 20    | 15 minutes | `POST /api/support-requests/:id/notes` |
| `donation-checkout`  | IP       | 10    | 15 minutes | `POST /api/donations/checkout`         |

Two gaps worth knowing: **login and reset-password are not rate-limited** (Turnstile
only), and the donation limiter reads `X-Forwarded-For` before `CF-Connecting-IP`,
unlike every other caller. Client IP resolution trusts `CF-Connecting-IP`, then
`X-Forwarded-For`, then `X-Real-IP`, so the limiter is bypassable without a proxy
that overwrites those headers.

---

## Webhooks

| Provider | Endpoint                      | Verification                                         |
| -------- | ----------------------------- | ---------------------------------------------------- |
| Stripe   | `POST /api/donations/webhook` | `stripe.webhooks.constructEvent` on the **raw** body |
| Brevo    | `POST /api/webhooks/brevo`    | Source-IP allowlist in the handler                   |

The Stripe webhook requires the raw request body — a proxy that rewrites or
re-encodes it will break signature verification.

---

## Known limitations

- **`/api/uploads/*` performs no authorization.** It validates path traversal and
  streams any file under the uploads root to any caller; filenames are UUID-based
  (obscurity, not access control). See `IMPLEMENTATION.md` §16.1.
- **Several "admin" APIs require only a session** — `backup`, `consent-types`,
  `interests`, `hofs`, `years`, `hof-entries`, `app-settings`, `documents` — because
  `middleware.ts` applies the role check to only three path families. See
  `FEATURES.md` §9.1 and `IMPLEMENTATION.md` §16.
- **`GET /api/health?detailed=true` is public** and discloses environment, database
  and directory status. Treat it as diagnostic only.

## Further reading

- [`IMPLEMENTATION.md`](../IMPLEMENTATION.md) §6.3 (authorization), §8 (API surface),
  §9 (file storage), §16 (known defects)
- [`SECURITY.md`](../SECURITY.md) — threat model, access control, accepted risks
- [`FEATURES.md`](../FEATURES.md) §2 (access model) and §9 (known gaps)
- [`INTEGRATIONS.md`](INTEGRATIONS.md) — Stripe, Brevo, Turnstile, OpenAI, GitHub
