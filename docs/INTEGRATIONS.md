# Integrations Guide

How to connect the external services this application can use, how to verify each
one actually works, and what silently degrades when one is missing.

Every integration is **optional**: the application boots and runs without any of
them. What differs is which features work and how loudly they fail.

| Service                                       | Powers                                              | Without it                                                             | Required in production? |
| --------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| [Stripe](#stripe)                             | Donations via hosted Checkout                       | `/donate` cannot create a session; no donations are recorded           | No                      |
| [Brevo](#brevo)                               | Verification, password reset, support notifications | Nobody can verify an email, so **new accounts can never log in**       | Effectively yes         |
| [Cloudflare Turnstile](#cloudflare-turnstile) | Bot protection on auth and contact forms            | Forms still work but have no CAPTCHA (registration keeps a rate limit) | Strongly recommended    |
| [OpenAI](#openai)                             | AI summaries for git-synced change requests         | `sync-git` is disabled and returns an error                            | No                      |
| [GitHub](#github)                             | Commit deep links and the AGPL source link          | Commit hashes render as plain text; no source link                     | Recommended (AGPL)      |

A [Cloudflare](#cloudflare-specifics) proxy is a separate concern: it is not an
account you configure in the app, but rate limiting and audit-log country
attribution depend on its headers.

Architecture and failure modes for each service are in
[`IMPLEMENTATION.md`](../IMPLEMENTATION.md) §10; the data each service receives is
listed in [`SECURITY.md`](../SECURITY.md#third-party-services-and-data-flows).

---

## How configuration is loaded

Two consumers read the same four files with **different precedence**, because
Next.js and the Prisma CLI resolve overrides differently:

| Consumer                    | Precedence (highest first)                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| Next.js (the app)           | `process.env` → `.env.<env>.local` → `.env.local` → `.env.<env>` → `.env`     |
| Prisma CLI and Node scripts | `process.env` → **`.env`** → `.env.local` → `.env.<env>` → `.env.<env>.local` |

Practical rules:

- **Local development:** put values in `.env.local` (Next.js prefers it).
- **Docker / PM2:** put values in `.env` — `docker-compose.prod.yml` declares
  `env_file: .env`, and `deploy.sh` creates that file on the server.
- Do not define the same key in both files with different values.
- `NEXT_PUBLIC_*` values are **baked into the client bundle at build time**.
  Changing one requires a rebuild, not a restart.
- Values already present in the process environment always win.

---

## Stripe

Powers the donation flow at `/donate`: one-time and monthly donations through
**hosted** Stripe Checkout. The browser is redirected to Stripe; no Stripe.js and
no publishable key are loaded.

### 1. Get the keys

1. Create a Stripe account and stay in **test mode** until the flow is verified.
2. Copy the **secret key** from <https://dashboard.stripe.com/test/apikeys>.

   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

### 2. Register the webhook

Donations are recorded **only** when Stripe calls back. Without the webhook,
checkouts write a `PENDING` row that never completes.

1. Create an endpoint at `https://your-domain/api/donations/webhook`.
2. Subscribe to exactly two events:
   - `checkout.session.completed`
   - `checkout.session.expired`
3. Copy the **signing secret** into `STRIPE_WEBHOOK_SECRET`.

### 3. Local development

```bash
stripe listen --forward-to localhost:1345/api/donations/webhook
```

The CLI prints a `whsec_…` value; use that for local `STRIPE_WEBHOOK_SECRET`.

### 4. Verify

- Select a real deploy target if possible: the health check is not enough.
- Make a test donation and confirm a `Donation` row moves `PENDING` → `COMPLETED`
  (`npm run db:studio`).
- In the Stripe dashboard, the webhook delivery should show `200`.

### Failure modes

| Symptom                           | Cause                                                                       |
| --------------------------------- | --------------------------------------------------------------------------- |
| Row stays `PENDING`               | Webhook never delivered, or the endpoint URL/secret is wrong                |
| Signature verification fails      | A proxy parsed or re-encoded the body — verification needs the **raw** body |
| Donation completed but no receipt | Known defect: no receipt email is sent                                      |

> **Your proxy must not rewrite the body of `/api/donations/webhook`.** Signature
> verification runs on the unparsed body. See [`SETUP.md`](../SETUP.md) §6.5.

### Known limitations

No receipt email, no monthly-renewal/refund/failed-payment handling, `FAILED` is
never written, and there is no admin UI to view or reconcile donations
(`FEATURES.md` §9).

Deep dive: [`docs/STRIPE_DONATIONS.md`](STRIPE_DONATIONS.md).

---

## Brevo

Powers all outbound transactional email: address verification, resend
verification, password reset, support-request notifications and requester
auto-confirmations.

> **This is the integration that fails most quietly.** With no API key,
> registration still succeeds — but no verification mail is sent, so the account
> can never log in. If new users report "verify your email" loops, check this
> first.

### 1. Get the keys

1. Create a Brevo account and **verify a sender address**.
2. Create an API key at <https://app.brevo.com/settings/keys/api>.

   ```env
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_EMAIL=no-reply@your-domain
   BREVO_SENDER_NAME="Your Project"
   APP_URL=http://localhost:1345      # or https://your-domain
   ```

### 2. Development routing

```env
DEV_EMAIL_RECIPIENT=you@example.com
```

Every message is rerouted to that address while `NODE_ENV=development`, so you
never mail real users from a development instance.

### 3. Delivery-status webhook (optional)

`POST /api/webhooks/brevo` updates `EmailLog` rows with Brevo's delivery events
(`delivered`, `hard_bounce`, `soft_bounce`, `blocked`). Point a Brevo webhook at
`https://your-domain/api/webhooks/brevo`.

The endpoint authorises callers by matching the source IP against a hard-coded
list of Brevo ranges read from `X-Forwarded-For`. That header is client-controlled
unless a trusted proxy overwrites it, so treat this check as weak (see
[`SECURITY.md`](../SECURITY.md)).

### 4. Verify

1. Set `DEV_EMAIL_RECIPIENT` and trigger **Forgot password** from `/forgot-password`.
2. Check the destination inbox.
3. Check the database: `npm run db:studio` → `EmailLog` — the row should be `SENT`
   with a `brevoMessageId` (then `DELIVERED` once the webhook fires).

There is **no admin UI** for email logs, and the 90-day `retentionDate` on those
rows is never enforced — no cleanup script exists.

### Failure modes

| Symptom                                 | Cause                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| No mail at all                          | `BREVO_API_KEY` unset; sender not verified in Brevo                                                                                              |
| Mail sent but not received              | `DEV_EMAIL_RECIPIENT` still set, or the message bounced                                                                                          |
| Verification link expired               | Links are valid for 24 hours; reset links for 1 hour                                                                                             |
| Nobody gets replies to helpdesk tickets | Known gap: no email is sent on helpdesk replies or status changes, nor for donations, change requests, journal publication or consent assignment |

---

## Cloudflare Turnstile

Bot protection on login, registration, forgot-password, reset-password,
resend-verification and the anonymous contact form.

### 1. Create a widget

<https://dash.cloudflare.com/?to=/:account/turnstile>

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

### 2. Local development — use the test keys

The development skip is **login-only**. Registration, password reset,
resend-verification and the contact form always verify, so without a secret they
fail with "CAPTCHA verification failed". Use Cloudflare's public always-pass pair:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Other Cloudflare test values: `2x0000000000000000000000000000000AA` always
fails, `3x0000000000000000000000000000000AA` returns a duplicate-token error.

### 3. Verify

Submit the registration form with the test keys — no CAPTCHA error should appear.
In production, a widget that never solves usually means a site-key/domain
mismatch in the Cloudflare dashboard.

### Failure mode: fails open

Timeouts and non-2xx responses from Cloudflare **allow** the request
(`failedOpen`). Only an explicit `success: false` blocks. This is deliberate —
availability over strictness — and means a Cloudflare outage removes bot
protection entirely. See [`SECURITY.md`](../SECURITY.md#known-accepted-risks).

Deep dive: [`docs/TURNSTILE_QUICK_REFERENCE.md`](TURNSTILE_QUICK_REFERENCE.md).

---

## OpenAI

Used by exactly one route: `POST /api/change-requests/sync-git`, which turns
batched git commit messages into business-readable change-request summaries.

```env
OPENAI_API_KEY=sk-...
```

- **Without it:** the route is disabled and returns a clear error. Nothing else
  is affected.
- **Input:** it reads the gitignored `data/git-commits/commits.json` and sends
  **commit messages and hashes** to OpenAI. Do not sync a repository whose commit
  messages contain member data or credentials.
- **Side effect:** the route **auto-creates each commit as a `COMPLETED` change
  request**, deduplicated by `commitHash`, and streams SSE progress. It is not a
  read-only summariser.
- **Model:** `gpt-4o-mini` is hard-coded.

---

## GitHub

Renders commit deep links in the change-request UI and the "Source code" link in
the public footer.

```env
GITHUB_REPO=your-org/your-repo
NEXT_PUBLIC_GITHUB_REPO=your-org/your-repo
```

- Use `owner/name` format.
- `NEXT_PUBLIC_GITHUB_REPO` is baked in at build time — rebuild after changing it.
- **Without it:** commit hashes render as plain text and no source link is shown.
- **AGPL-3.0 section 13 requires the source offer.** Any deployment that lets
  users interact with the program over a network should set
  `NEXT_PUBLIC_GITHUB_REPO` so the footer can offer the Corresponding Source. See
  [`NOTICE`](../NOTICE).

---

## Cloudflare specifics

If the app sits behind Cloudflare (not just Turnstile), it reads:

| Header                          | Used for                                         |
| ------------------------------- | ------------------------------------------------ |
| `CF-Connecting-IP`              | rate-limit keying and audit-log client IP        |
| `CF-IPCountry`                  | audit-log country attribution                    |
| `CF-Ray`                        | audit context                                    |
| `X-Forwarded-For` / `X-Real-IP` | fallbacks when the Cloudflare headers are absent |

**These are trusted unconditionally.** A deployment where the proxy does not
overwrite them can spoof its own rate limiting and audit trail. See
[`SETUP.md`](../SETUP.md) §6.5.

---

## Rotating credentials

If any of these values may have been exposed (for example, they appeared in a
committed file or a shared log), rotate them and redeploy:

| Credential              | Where to rotate         | Effect                                                     |
| ----------------------- | ----------------------- | ---------------------------------------------------------- |
| `NEXTAUTH_SECRET`       | Generate a new one      | **Logs every user out**                                    |
| `STRIPE_SECRET_KEY`     | Stripe dashboard        | Existing sessions still run; new checkouts use the new key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook settings | Update both sides or webhooks fail verification            |
| `TURNSTILE_SECRET_KEY`  | Cloudflare              | Must match the site key                                    |
| `BREVO_API_KEY`         | Brevo                   | Email stops until updated                                  |
| `OPENAI_API_KEY`        | OpenAI                  | `sync-git` disabled until updated                          |
| `BACKUP_PASSWORD`       | This file               | **Existing archives stay encrypted with the old password** |

`npm run security:secrets` scans for credential patterns and cross-references your
local `.env` values against the tracked tree. Run it before pushing.
