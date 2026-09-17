# Feature Reference

A complete inventory of what Baggers Without Borders does, grouped by audience, plus
the domain rules, cross-cutting systems, end-to-end processes, and failure behaviour
behind it. Use it to understand the surface area before changing anything.

- **69 pages** and **93 API route handlers** exposing **149 HTTP operations**.
- Grouped by **who uses them**: public, member, admin — then domain logic, cross-cutting systems, and processes.
- Access levels in this document are derived from `middleware.ts`, `app/(authenticated)/**/layout.tsx`, and the in-route guards. Read [§2](#2-the-access-model-read-this-first) before trusting any "admin only" label.
- Where a subsystem has a dedicated design note under `docs/`, this document summarises the behaviour and links out rather than duplicating it.

**How to read this document**

| Section                                                | Answers                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| [§1 Screen inventory](#1-screen-inventory-at-a-glance) | What exists and where                                              |
| [§2 Access model](#2-the-access-model-read-this-first) | Who can reach it                                                   |
| [§3 Public screens](#3-public-screens)                 | What each public screen does                                       |
| [§4 Member screens](#4-member-screens)                 | What each member screen does                                       |
| [§5 Admin screens](#5-admin-screens)                   | What each admin subsystem does                                     |
| [§6 Domain logic](#6-domain-logic)                     | How qualification, tiers, ranking and totals work                  |
| [§7 Cross-cutting systems](#7-cross-cutting-systems)   | Auth, consent, email, uploads, errors, states, accessibility, APIs |
| [§8 End-to-end processes](#8-end-to-end-processes)     | How the multi-step workflows fit together                          |
| [§9 Known gaps](#9-known-gaps-and-inconsistencies)     | What is broken, inconsistent, or intentionally unfinished          |

**Related documents**

- [`SETUP.md`](SETUP.md) — running, configuring, and operating the application.
- [`IMPLEMENTATION.md`](IMPLEMENTATION.md) — architecture, data model, deployment, and the authoritative known-issues list (§16).
- [`SECURITY.md`](SECURITY.md) — security policy, reporting, and accepted risks.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — development workflow, code map, and gotchas.
- Subsystem design notes under `docs/`: [`API_REFERENCE.md`](docs/API_REFERENCE.md), [`HOF_SYSTEM.md`](docs/HOF_SYSTEM.md), [`QUALIFICATION_RULES.md`](docs/QUALIFICATION_RULES.md), [`TOTAL_PEAKS_RECALCULATION.md`](docs/TOTAL_PEAKS_RECALCULATION.md), [`USER_CONSENT_MANAGEMENT.md`](docs/USER_CONSENT_MANAGEMENT.md), [`HELPDESK_SYSTEM.md`](docs/HELPDESK_SYSTEM.md), [`DOCUMENT_MANAGEMENT.md`](docs/DOCUMENT_MANAGEMENT.md), [`STRIPE_DONATIONS.md`](docs/STRIPE_DONATIONS.md), [`CHANGE_REQUEST_ATTACHMENTS.md`](docs/CHANGE_REQUEST_ATTACHMENTS.md), [`AUTOMATIC_VERSIONING.md`](docs/AUTOMATIC_VERSIONING.md), [`DATABASE_SEEDING.md`](docs/DATABASE_SEEDING.md).

---

## 1. Screen inventory at a glance

### Public (no session required)

| #   | Route                                  | Purpose                                           |
| --- | -------------------------------------- | ------------------------------------------------- |
| 1   | `/`                                    | Marketing landing page                            |
| 2   | `/login`                               | Sign in                                           |
| 3   | `/register`                            | Create an account                                 |
| 4   | `/forgot-password`                     | Request a reset link                              |
| 5   | `/reset-password`                      | Set a new password from an emailed token          |
| 6   | `/verify-email`                        | Confirm an email address from an emailed token    |
| 7   | `/resend-verification`                 | Re-send the verification email                    |
| 8   | `/donate`                              | Donation form (Stripe Checkout)                   |
| 9   | `/donate/success`                      | Post-payment confirmation                         |
| 10  | `/donate/cancelled`                    | Abandoned-payment page                            |
| 11  | `/contact`                             | Contact form (Turnstile-protected when anonymous) |
| 12  | `/hof-tables`                          | Public Hall of Fame tables                        |
| 13  | `/journal`, `/journal/[slug]`          | Public journal (see note)                         |
| 14  | `/awards`, `/awards/[slug]`            | Public awards channel (see note)                  |
| 15  | `/other`, `/other/[slug]`              | Public catch-all channel (see note)               |
| 16  | `/p-index`, `/p-index/[slug]`          | P-Index League channel (see note)                 |
| 17  | `/sitemap.xml`, `/robots.txt`, `/icon` | Generated SEO assets                              |

> **Note.** `/journal`, `/awards`, `/other` and `/p-index` are _not_ in the middleware matcher, so they render for anonymous visitors and expose only `PUBLISHED` content. They are listed here as public because that is their actual behaviour.

### Member (any authenticated account)

| #   | Route                | Purpose                                    |
| --- | -------------------- | ------------------------------------------ |
| 18  | `/home`              | Personal Hall of Fame dashboard            |
| 19  | `/profile`           | Own profile, interests, consents, password |
| 20  | `/my-bags`           | Own results as a Year × HoF matrix         |
| 21  | `/my-bags/[id]/edit` | Edit one entry's year figures              |
| 22  | `/member-hof-tables` | Hall of Fame browser (sidebar shell)       |
| 23  | `/sponsors`          | Sponsors and donors                        |
| 24  | `/support`           | Contact the helpdesk                       |
| 25  | `/consent-prompt`    | Blocking consent acceptance                |

### Admin

| #   | Route                                                          | Purpose                                     |
| --- | -------------------------------------------------------------- | ------------------------------------------- |
| 26  | `/admin/members`, `/admin/members/[id]`                        | Member management and detail                |
| 27  | `/admin/data-entry`, `/new`, `/[id]/edit`                      | Hall of Fame entry data entry               |
| 28  | `/admin/years`, `/new`, `/[id]/edit`, `/[id]/upload-data`      | Years and bulk member-data import           |
| 29  | `/admin/hofs`, `/new`, `/[id]/edit`                            | Hall of Fame records                        |
| 30  | `/admin/configuration`, `/new`, `/[id]`                        | Per HoF-year thresholds and Hofmeister      |
| 31  | `/admin/consent-types`, `/new`, `/[id]`, `/[id]/edit`          | Consent types and assignment                |
| 32  | `/admin/interests`, `/new`, `/[id]/edit`                       | Interest vocabulary                         |
| 33  | `/admin/journal`, `/new`, `/[id]/edit`, `/issues`, `/settings` | Journal administration                      |
| 34  | `/admin/documents`                                             | Document / file manager                     |
| 35  | `/admin/helpdesk`, `/admin/helpdesk/[id]`                      | Support ticket queue                        |
| 36  | `/admin/changes`, `/new`, `/[id]`, `/[id]/edit`                | Change-request system                       |
| 37  | `/admin/backups`                                               | Encrypted database/file backups             |
| 38  | `/admin/logs`                                                  | Audit log viewer                            |
| 39  | `/admin/test-results`                                          | Jest results dashboard                      |
| 40  | `/admin/roles`                                                 | Role reference                              |
| 41  | `/admin/sponsors`                                              | Sponsor management                          |
| 42  | `/admin/settings`                                              | App settings and journal editors            |
| 43  | `/journal/preview/[id]`                                        | Draft preview for journal editors (noindex) |

Navigation in the app itself: the member sidebar is **Home · Journal · HoF Tables · Awards · My Bags · My Profile · Sponsors**; the admin sidebar is **Members · Journal Editor · Configuration · Data Entry · Documents · Changes · Helpdesk · Backups · Test Results · Logs · Sponsors · Settings**.

---

## 2. The access model (read this first)

Two roles exist in the UI: `USER` and `ADMIN`. A third, `CLERK`, is referenced by the user-delete handler and by `Journal.createdBy` restrictions but cannot be assigned from the members UI.

Enforcement happens in two places, and **they do not agree with each other**.

### Layer 1 — `middleware.ts`

A NextAuth `withAuth` wrapper with an explicit matcher. The role check inside it fires for **only three path prefixes**:

```
path.startsWith("/admin") || path.startsWith("/api/admin") || path.startsWith("/api/change-requests")
```

For every other matched path, the only requirement is the `authorized` callback: `({ token }) => !!token` — **a valid session of any role**.

| Matcher prefix                                                                         | What is actually enforced                                                              |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `/admin`, `/api/admin`                                                                 | `role === "ADMIN"` (403 JSON for APIs, redirect to `/home` for pages)                  |
| `/api/change-requests`                                                                 | `role === "ADMIN"`                                                                     |
| `/api/users/[id]/*`                                                                    | Owner (`token.sub === id`) or `ADMIN`; `accept-consents` exempted                      |
| `/my-bags`, `/api/my-bags`                                                             | Any authenticated session                                                              |
| `/profile`, `/home`, `/consent-prompt`                                                 | Any authenticated session                                                              |
| `/api/backup`, `/api/documents`, `/api/hof-entries`, `/api/users`                      | `role === "ADMIN"` for every method; `/api/users/<id>/*` keeps the owner-or-admin rule |
| `/api/hofs`, `/api/years`, `/api/consent-types`, `/api/interests`, `/api/app-settings` | `role === "ADMIN"` for writes; any authenticated session for reads                     |

### API prefixes outside the matcher

The matcher is an allow-list, so every API prefix _not_ listed above is reached without any middleware check. Those routes are a mix of intentionally public endpoints and routes that guard themselves in-route:

| Prefix                                                                                                             | Reached how                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `/api/auth/*`, `/api/turnstile/*`, `/api/legal/*`, `/api/health`, `/api/version`, `/api/countries`, `/api/regions` | Public by design; some are Turnstile- and/or rate-limited                                                      |
| `/api/hof-tables/*`                                                                                                | Public read (uses `getOptionalSession()`); exposes member data — see §9, item 6                                |
| `/api/journal/*`, `/api/journal/slug/*`                                                                            | In-route session checks; writes require `ADMIN`, and published-content edits require journal-editor membership |
| `/api/sponsors/*`                                                                                                  | Public read; writes check `ADMIN` in-route                                                                     |
| `/api/hof-year-configs/*`, `/api/award-tiers/*`                                                                    | Session-only reads; writes check `ADMIN` in-route (so config notes are readable by any member)                 |
| `/api/support-requests/*`                                                                                          | Deliberately excluded so the public contact form can POST; listing is admin-checked in-route                   |
| `/api/donations/*`                                                                                                 | Public checkout + Stripe webhook (signature-verified)                                                          |
| `/api/uploads/*`, `/api/webhooks/*`                                                                                | No authorization / third-party webhooks — see §9, item 7                                                       |

### Layer 2 — in-route guards

`src/lib/api-auth.ts` exposes `getSession()`, `getCurrentUserId()`, `isAdmin()` and `getOptionalSession()`.

**`getSession()` checks only that a session exists. It never checks the role.** Handlers in the administrative families carry comments such as _"Middleware ensures user is authenticated and is ADMIN"_. Those comments were false when they were written; they are accurate now for the paths the matcher covers, because the middleware enforces the role for every family in the table above. The middleware is still the **only** thing enforcing it — none of those handlers checks the role itself — and prefixes outside the matcher are not covered at all.

What that leaves reachable without an admin role: `GET /api/hof-year-configs` (outside the matcher) and the admin-only internal notes on `GET /api/consent-types` both reach any signed-in member, and `GET /api/hof-tables` is public. See [§9](#9-known-gaps-and-inconsistencies).

### Pages that are not protected at all

`app/(authenticated)/layout.tsx` is a **client component**. It renders `children` unconditionally and only hides the sidebar when there is no session — it does not redirect. Route groups in parentheses do not appear in URLs, so `(authenticated)` is a folder name, not a guard. Consequently `/member-hof-tables`, `/awards`, `/awards/[slug]`, `/sponsors`, `/support`, `/journal`, `/other` and `/p-index` are reachable without a session.

### Consent gate

`app/(authenticated)/template.tsx` runs `checkMissingRequiredConsents(session.user.id)` for signed-in users and redirects to `/consent-prompt` when a required consent is outstanding. This applies to every screen in the `(authenticated)` group.

---

## 3. Public screens

### Landing page — `/`

Marketing entry point: hero with `public/images/hero-mountain.jpg`, calls to action, a resources list linking to `/p-index` ("P-Index League") and the public HoF tables, and login/register affordances.

### Authentication

| Screen                 | Behaviour                                                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`               | `LoginForm`. Accepts **email or username** plus password. Turnstile-protected. Unverified accounts are refused with "Please verify your email address before logging in."                     |
| `/register`            | `RegisterForm`. Turnstile-protected. Creates the account, `UserHofParticipation` and `UserYearParticipation` rows for all active HoFs/years, and a `UserConsent` row per ACTIVE consent type. |
| `/forgot-password`     | `ForgotPasswordForm`, Turnstile-protected. Always responds the same way so it cannot be used to enumerate accounts.                                                                           |
| `/reset-password`      | `ResetPasswordContent`. Consumes a single-use emailed token.                                                                                                                                  |
| `/verify-email`        | `VerifyEmailContent`. Consumes an emailed token; success and failure branches.                                                                                                                |
| `/resend-verification` | `ResendVerificationForm` + `TurnstileWidget`.                                                                                                                                                 |

**Bot and abuse protection is not uniform across these six screens.** Login, register, forgot-password, reset-password and resend-verification verify a Turnstile token; **`/verify-email` does not** — it consumes the token from the URL only. Only register, forgot-password and resend-verification are rate-limited; login and reset-password rely on Turnstile alone. See [§7.1](#71-authentication) and [§7.3](#73-rate-limiting).

### Legal documents and consent acceptance

`LegalDocumentModal` fetches `GET /api/legal/{privacy-policy|terms-of-service}` — public, served from `data/legal/*.md`, cached for 5 minutes — and renders the document in a modal. It is opened from the registration form (where both documents must be accepted), from the sidebar, and from the consent gate.

`/consent-prompt` uses `ConsentAcceptanceDialog` and posts to `POST /api/users/accept-consents`, the one `/api/users/*` endpoint exempted from the owner-or-admin middleware rule because it acts on behalf of the signed-in user. `src/lib/consent-check.ts` deliberately checks only these two legal consents, not the full `UserConsent` set.

### Donations

| Screen              | Behaviour                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/donate`           | `DonationForm`. Collects a donation and redirects to **hosted Stripe Checkout** — the server creates the session in `POST /api/donations/checkout` and returns `session.url`. No Stripe.js and no publishable key are used. |
| `/donate/success`   | Confirmation after `checkout.session.completed`.                                                                                                                                                                            |
| `/donate/cancelled` | Shown after `checkout.session.expired`.                                                                                                                                                                                     |

**Form behaviour.** The donor chooses a **donation type** — one-time or **monthly** (the default) — a **currency** (USD / EUR / GBP, defaulting to **EUR**), and an amount: either a per-type preset (monthly 5/10/15/25; one-time 10/25/50/100) or a custom value. A donor email is required; a name is optional. The server enforces **1–10,000** per donation (`src/lib/constants/donations.ts`, `src/lib/validation/donations.ts`) and creates a **dynamic Stripe Price per checkout attempt**, storing the amount in cents. Monthly donations use Stripe `mode: "subscription"`; one-time donations use `mode: "payment"`. Checkout is rate-limited per IP (**10 attempts / 15 minutes**, `429`).

**Persistence and fulfilment.** Checkout writes a `PENDING` `Donation` row (amount, currency, type, donor email/name, optional `userId`, `stripeSessionId`) and the browser leaves the site. Fulfilment is driven **only** by `POST /api/donations/webhook`, which verifies the `stripe-signature` header and handles exactly two events: `checkout.session.completed` (→ `COMPLETED`, records `stripeSubscriptionId`) and `checkout.session.expired` (→ `CANCELLED`). The success page is not authoritative.

**Limitations.** No receipt email is ever sent even though `/donate/success` promises one; `FAILED` is never written; and monthly renewals, refunds, and failed payments are not handled (no `invoice.paid`, `customer.subscription.deleted`, or payment-failure events). There is no fee-coverage or anonymous option and **no admin UI to view or reconcile donations**. See §9, item 29.

**Running costs indicator.** `/donate` also renders `RunningCostsIndicator`, which reads the `funding_*` app settings and shows the same collected/spent/monthly picture as the member funding bar ([§4](#4-member-screens)).

### Contact — `/contact`

`ContactForm` rendered for anonymous visitors, which is why Turnstile is required: `POST /api/support-requests` rejects a session-less submission with `403 "Security verification required."` if no token is supplied. Creates a `SupportRequest` and emails both a notification and an auto-confirmation.

### Public Hall of Fame tables — `/hof-tables`

A public shell around `HofTablesView` with its own Sign In / Register header. The member variant `/member-hof-tables` renders the same component inside the sidebar layout. Data comes from `GET /api/hof-tables`, which uses `getOptionalSession()` and therefore serves anonymous readers.

### Content channels

`/journal`, `/awards`, `/other` and `/p-index` are four views of the **same `Journal` table**, separated only by the `type` column:

| Route      | Journal types            | Heading |
| ---------- | ------------------------ | ------- |
| `/journal` | `journal`, `article`     | Journal |
| `/awards`  | `awards`, `achievements` | Awards  |
| `/other`   | `other`                  | Other   |
| `/p-index` | `p-index`                | P-Index |

`/p-index` is the P-Index (Prominence Index) League content channel. **It does not compute rankings** — those live in the Hall of Fame system under the `P-INDEX` HoF code. `/other` is a catch-all for uncategorised posts and has no inbound links anywhere in the app.

Each channel is a 12-per-page card grid of published, top-level records with pagination only — **no search, filter or sort**. Article pages render markdown with a per-article table style, inline photo attribution, a lightbox, and child-article lists.

---

## 4. Member screens

### `/home` — personal dashboard

Per-HoF rank, award tier and progress for a selected year, plus year-over-year history.

- Year selector; refresh.
- **Four stat cards:** Total Peaks, Foreign Peaks, Overall FPR, Qualified HoFs (`n of total`).
- **Hall of Fame Performance:** one card per HoF _in which the member has an entry that year_. Qualified members see tier badge, `#rank of totalMembers`, "Top X%" percentile, peaks with a year-on-year trend arrow, foreign peaks/FPR, a progress bar to the next tier ("N more peaks"), and `New Entrant` / `New <tier> Award` / `LCE` badges. Unqualified members get a "Working Toward Qualification" card with per-requirement Met/Not Met.
- **Historical Progress:** table of Year / Peaks Added / Total Peaks / Foreign Peaks / FPR with trend arrows; the most productive year is highlighted.
- Aggregates across HoFs use `Math.max`, not a sum.
- Empty state shows a **hardcoded** P100 requirements card (18 years old, 1,200 peaks, 20 peaks in year, 10% FPR) even though real thresholds live in `HofYearConfig`.
- Loads `GET /api/my-bags` then **one `GET /api/hof-tables` call per HoF** in parallel.
- Card links point at the **public** `/hof-tables`, so following one drops the member out of the sidebar layout.

### `/profile` — own profile

`UserOwnProfile`. View and edit your own record; you cannot view anyone else's.

- Personal Information: Given/Family/Display name, Email (**disabled** in the UI), Gender, Year of Birth, Birth Country, Residence Country, Residence Region.
- Interests (multi-select).
- **Consent History** table: Consent Type / Date Accepted / Method / Status. Read-only; a null date renders as a yellow "Pending".
- Edit mode: Change Password with a strength meter, an 18-character generator, and "Last changed".
- Backing APIs: `GET`/`PATCH /api/users/{id}`, `PATCH /api/users/{id}/password`, `GET /api/countries`, `GET /api/regions`, `GET /api/interests`.

### `/my-bags` — own results matrix

A Year × HoF matrix of the member's own entries.

- **Five metric tabs:** Total Peaks (default), Total Foreign Peaks, FPR, Peaks in Year, Foreign Peaks in Year. Tabs are desktop-only; mobile shows all metrics per HoF card.
- Cells are heat-coloured in five buckets relative to the maximum for the selected metric; zero renders blank.
- A cell is editable only when **all three** of `user.allowManualEntry`, `hof.allowManualEntry` and `year.allowManualEntry` are true; otherwise it shows a lock.
- A TOTAL row per HoF; the three headline stat cards are computed from the lowest-`displayOrder` HoF with a participating entry, which the labels do not disclose.
- Notices for disabled manual entry and for entries disabled by participation settings.
- The **`BASELINE` year** ("Before 2019", seeded by `scripts/seed/seed-baseline-year.js`) is the row used to record before-tracking **opening balances**; it is the first term in every cumulative total ([§6](#6-domain-logic)).
- Backing API: `GET /api/my-bags`.

### `/my-bags/[id]/edit`

Edits **Peaks in Year** and **Foreign in Year** for one entry, with live recalculation of Total Peaks, Total Foreign, FPR and Domestic Peaks. Validation only rejects negatives — **there is no `foreign ≤ peaks` check here**, unlike the inline editor in the HoF tables. Saving recalculates cumulative totals server-side and writes a `USER_BAG_UPDATE` audit event.

### `/member-hof-tables` — Hall of Fame browser

The largest feature area, all under `app/components/features/hof-tables/`.

- **Filters:** HoF button group (plus a P-Index link), year button group, nine badge pills (`Me`, `New Entrant`, `New Award`, `Retired`, `Deceased`, `LCE`, `Junior`, `National`, `Missing Data`), and a name search. Badge filters combine with **OR**; search and badges are applied client-side only.
- **Stats cards:** Participants, Peaks, Foreign, FPR — computed from the _filtered_ qualified list.
- **Qualified table:** Rank / Member / Total peaks / Peaks in year / FPR / Qualified, with award-tier colouring, a "You" marker, and a badge row. Rows expand to Ranking Position, Climbing Statistics (including a Large Country Exception note) and Award Progress.
- **Progress Register:** members who participated but did not qualify, with per-requirement progress detail and a summary sentence. Mobile cards here are **not expandable**.
- **Meister Report:** markdown report from the HoF Meister with an optional image and a collapse for long content.
- **Info panels:** a table guide documenting the ranking order (total peaks → higher FPR → more peaks in year → earlier first qualification year → display name reverse-alphabetical) and the full badge legend; plus the minimum-requirement rules for the selected HoF-year, LCE values, progress-register minimums, admin-only exclusion statistics, and the award tier list.
- **Admin quick actions** on an expanded row: Member Profile, Data Entry, and an inline **Edit Data** toggle that saves through `PUT /api/hof-entries/{id}`.
- No pagination or column sorting anywhere — every filtered row is rendered.

### `/sponsors` and `/support`

- `/sponsors` lists sponsors as cards with logo, name, external link and description. The page itself is not matcher-protected but `GET /api/sponsors` calls `getSession()`, which throws for anonymous callers and is caught as a **500 "Internal server error"** — an anonymous visitor sees a red error string rather than a login prompt.
- `/support` renders `ContactForm` with `isAuthenticated={true}`: name and email are read-only from the session, category is General Questions or HoF Table Data, and choosing HoF Data attaches the request to a HoF so it routes to that HoF's Meister. Because the component is hardcoded as authenticated, **no Turnstile token is sent**, so a genuinely anonymous visitor can load the page but gets `403` on submit.

### Member shell (all member screens)

Every screen in `app/(authenticated)/` renders inside `layout.tsx`, which is a **client component**: it shows the sidebar and mobile header when a session is present and renders `children` unconditionally (it is not a guard). The shell contains:

- **Sidebar** with the member nav (and an admin nav block plus a helpdesk badge slot for admins), a legal-document footer, and sign-out.
- **Funding status bar** — `FundingStatusBar` reads `GET /api/app-settings?category=funding` and renders a five-segment "collected vs spent vs projected" timeline anchored to Sep 2025, using hard-coded fallbacks (€630.36 spent / €559.08 collected / €40 per month) when settings are unset. It is visible to all members.
- **Version** — `Version` renders the deployed version from `GET /api/version`.

`app/(authenticated)/template.tsx` runs the required-consent check on every screen in the group ([§2](#2-the-access-model-read-this-first)).

---

## 5. Admin screens

Admin UI is gated twice: the middleware `/admin` prefix check and `app/(authenticated)/admin/layout.tsx`, which redirects non-admins to `/home`. The **APIs** behind these screens are not equally protected — see [§9](#9-known-gaps-and-inconsistencies).

### 5.1 Members

**`/admin/members`** — search, filter, sort, paginate and create accounts.

- Stats: Total (filtered), Active and Admins (whole table — inconsistent with Total).
- Basic search across username, display name, email, names, gender, country, region, forum nickname, role, status and notes. Advanced filters add given/family name, gender, residence and birth country (multi), birth-year range, email, forum nickname, role, status, retired, deceased, notes, and created/updated date ranges.
- Table columns: Given Name, Family Name, Email, Residence, Since, Status — all sortable. Mobile renders cards.
- Page size 20/50/100/500.
- **Create Member** generates `first.last` usernames with numeric suffixes, verifies uniqueness via debounced `check-username` / `check-email`, and shows the generated password exactly once.

**`/admin/members/[id]`** — the full member record, as stacked cards (there are no tabs).

1. **BwB Information** — username and email (inline edit with uniqueness checks), forum nickname and join date, retired year, deceased year, role, status, interests, admin-only markdown notes (≤5000), **Allow Manual Data Entry**.
2. **Personal Information** — names, display name, gender, birth year, birth/residence country and region.
3. **External Platforms** — Peakbagger ID, Hill Bagging ID, and toggles to expose links.
4. **Hall of Fame Participation** — one switch per HoF.
5. **Year Participation & Country Override** — per year: enabled, "Data Not Provided", and a country override.
6. **Password Management** — set a password, strength meter, 18-character generator.
7. **Privacy Consents** — title / date / method / required / files / notes, with per-consent edit, method (Web Form, Email, Paper Document, Other), markdown note (≤2000), and attachments (JPEG/PNG/GIF/WebP/PDF, ≤10 MB).

Saving is a three-step sequence: `PATCH /api/users/{id}`, then consents in parallel, then `PUT /api/users/{id}/participations`. A participation failure is only logged, not surfaced.

**Deletion** is a two-step gate: a confirmation listing what will be destroyed (HoF entries, participations, consents, change requests) plus a warning when the member is a HoF Meister, then a typed confirmation where the expected text is the given name, family name, or `DELETE`, matched case-insensitively. The handler refuses self-deletion, refuses `ADMIN`/`CLERK` accounts, and refuses any member holding a Hofmeister assignment.

Cascades: HoF entries, participations, consents and their attachments, interests, ticket notes and status history are **deleted**; audit logs, donations, support requests, email logs and journal authorship are **anonymised** (`SetNull`). `Journal.createdBy` is `Restrict` and is not checked by the handler, so deleting a member who created a journal fails with a generic 500.

### 5.2 Hall of Fame data entry

**`/admin/data-entry`** — list with Member / HoF / Year filters, seven sortable columns, and pagination. Stats cards sum the **current page only**. There is no delete action in the list.

**`/admin/data-entry/new`** and **`/[id]/edit`** — Member, HoF and Year (active only) plus **Peaks in Year** and **Foreign in Year**; totals, FPR and domestic peaks are derived. On edit, Member/HoF/Year are read-only and the header links to the member and the matching configuration.

Create and update recalculate cumulative totals via `recalculateTotalsForUserAndHof`. **Delete does not**, so cumulative figures can be left stale.

### 5.3 Years and the member-data import workflow

**`/admin/years`** — stats (total/active/inactive), search and status filter, drag-to-reorder (which issues one `PUT /api/years/{id}` per visible row), row click into the editor. **`/new`** and **`/[id]/edit`** use `YearForm`: code (required, min 2), title (required, min 2 — unlike HoF codes, **not** upper-cased), markdown description, display order (server assigns `max+1` on create), active toggle and manual-entry toggle.

In edit mode the page also shows **Hall of Fame Configurations** for that year, a **Member Data Summary** (`GET /api/years/{id}/member-data-summary`, no in-route auth: total HoF entries, total year participations, and per-HoF participant/entry counts with a last-updated date), a cross-HoF **Award Tiers** table, and three actions:

- **Create Zero Entries** — `POST /api/years/{id}/create-missing-entries`, single confirmation with no typed gate. Creates a zero-value `HofEntry` for every (user × active HoF) pair that lacks one, plus missing `UserYearParticipation` rows, then recalculates totals **sequentially, one pair at a time**, and is **not wrapped in a transaction**. It loads **all** users regardless of status (its dialog says "all active members") and has **no inactive-year guard**.
- **Delete Member Data** — two-step, the second requiring the operator to type `DELETE <year code>`. Runs in a transaction, deleting `HofEntry` and `UserYearParticipation` for the year; year configuration and award tiers are preserved.
- **Upload Member Data** → `/admin/years/[id]/upload-data`.

**`/admin/years/[id]/upload-data`** is the bulk import for one year, in four stages:

1. **Select JSON file** — `accept=".json"`, max 10 MB / 10,000 entries. Expected shape: `[{ year, cid, "HOF-CODE": [peaksInYear, foreignPeaksInYear] }]`. Selecting a file immediately POSTs it to `validate-member-data`.
2. **Validation Results** — six tiles: Processed, Valid, Create, Update, Modified, Errors.
3. **Preview Changes** — filter tabs (All, Created, Updated, Changed, Unchanged, Errors) with live counts, plus a search box. The table shows CID, Member Name, HOF Category, Peaks This Year, Foreign This Year and Status; changed values render as `old → new` in yellow. Paginated 20 per page.
4. **Confirm Import** — a warning dialog, then a second dialog requiring the year's **internal cuid** (not its code) before `POST /api/years/{id}/import-member-data`. The import runs in a transaction, upserts entries, creates missing participations, and recalculates totals for every affected member+HoF pair.

Validation rules worth knowing: `entry.year` must equal the year's code; members resolve by **`peakbaggerId` matching the CID**; unknown HoF codes, negative or non-numeric values, and duplicate (member, HoF) pairs are errors; a one-element value array is read as `[peaks, 0]`; an empty array is skipped silently while `summary.skipped` is hard-coded to `0`. A record missing `year` throws a `TypeError` that surfaces as a generic 500 for the whole file.

> **Note.** `validate-member-data`, `import-member-data` and `create-missing-entries` are admin-guarded in-route; `member-data-summary` and `delete-member-data` are **not** (they check for a session only).

### 5.4 HoF records

**`/admin/hofs`** — stats (total/active/inactive), search, status filter, drag-to-reorder, row click into the editor. **`/new`** and **`/[id]/edit`** use `HofForm`: code (required, min 2, auto-uppercased, unique), title (required, min 2), markdown description, display order, active toggle, manual-entry toggle, and a **Progress Register Filters** group (`progressRegisterExcludeRetired`, `progressRegisterExcludeDeceased`, `progressRegisterExcludeInactive`, all defaulting on, plus `progressRegisterInactivityYears` clamped to 1–10, default 2).

The edit page additionally renders that HoF's **Year Configurations** grid (year, inactive badge, min peaks, min FPR, linking into each configuration) and an **Award Tiers** table across years showing each tier's `minPeaks–maxPeaks` (with `∞` for an open maximum).

`GET /api/hofs` accepts `?activeOnly=true` and `?limit=` and is ordered by display order. Creating a HoF **creates a `UserHofParticipation` row for every existing user**. Deleting is refused while any `HofYearConfig` or `HofEntry` exists. The delete button in the form is `disabled` ("Deletion temporarily disabled"), so its typed-confirmation dialog is currently unreachable.

### 5.5 HoF-year configuration

**`/admin/configuration`** lists one row per Hall of Fame × year. Stats split active/inactive by whether **both** the HoF and the year are active. Search plus HoF and Year selects, all mirrored into the URL (`search`, `hofId`, `yearId`, `sortBy`, `sortOrder`) and applied client-side. Sortable columns: Hall of Fame, Year, HoF Meister, and three multi-value columns (Min Peaks, Min Foreign Peaks, Min FPR) each offering Standard and LCE sort fields. An LCE pill marks configurations with the Large Country Exception enabled. There is no pagination and no delete on the list.

**`/admin/configuration/new`** and **`/[id]`** (note: no `/edit` sub-route) use `ConfigurationForm`:

- **Hall of Fame** and **Year** selects — **disabled in edit mode**; the pair is immutable and there is no move/duplicate action.
- **HoF Meister (optional)** — searchable select over active users.
- **Display & Filtering Criteria** — each threshold has an enable switch, and validation is skipped when disabled: `minPeaks` (≥0), `minForeignPeaks` (≥0), `minFpr` (0–100), `minimumAge` (≥0).
- **Notes** — internal markdown documentation.
- **HoF Meister Report (optional)** — markdown content, image title and attribution. The image can only be uploaded in edit mode: max 5 MB, PNG/JPEG/WebP/GIF sniffed by magic bytes, re-encoded with sharp to fit within 800×600 and stored as WebP at quality 85. Replacing or deleting the image acts immediately, outside the form's save.
- **Large Country Exception (LCE)** — a master switch; when on, exposes `lceMinPeaks`, `lceMinForeignPeaks` and `lceMinFpr` (blank means "use the standard threshold") and an LCE-country selector with a searchable, per-country toggle list.
- **Award Tiers** (edit mode) — inline editing of each tier's `minPeaks`/`maxPeaks`, saving through `PUT /api/award-tiers/{id}`.

The configuration pair is unique (`@@unique([hofId, yearId])`), so a second create returns 400. Deleting is refused while any `HofEntry` exists for that HoF-year. LCE country rows are created **after** the configuration row, so a mid-operation failure can leave a configuration with no LCE countries. `GET /api/hof-year-configs` is outside the middleware matcher and requires only a session, so internal notes, thresholds and the meister report are readable by any signed-in member; writes are admin-checked in-route.

### 5.6 Consent types

**`/admin/consent-types`** — stats (total / active / inactive), search, status filter, table columns Title, Status, Date Introduced, Attachments, Users. Row click opens the view page. No pagination.

- **Form** (`ConsentTypeForm`, create/edit/view): title (required, min 3, **not unique**), date introduced (defaults today), status switch (ACTIVE/INACTIVE), description (required, min 10, markdown), and internal notes (admin-only markdown). A validation summary card lists errors.
- **Attachments:** accepted types are JPEG, PNG, GIF, WebP, PDF, plain text, Word and DOCX, each ≤10 MB; there is no count cap. Uploading is only possible after the type exists, and the create flow's sequential upload loop **ignores `response.ok`**, so a rejected file is silently dropped. In edit mode, deleting an attachment uses a native `confirm()` and acts **immediately**, without a save step.
- **Delete** is disabled while any user holds the consent; the API returns 400 and suggests deactivating instead.
- **Assign flow** (`AssignConsentDialog` → `POST /api/consent-types/{id}/assign`): choose **All Active Users** (status NEW or ACTIVE) or **Users by Country** (birth or residence country), with a "Mark as Required Consent" checkbox defaulting on. A third `"specific"` mode exists in the API but has no radio button, so it is unreachable from the UI. Assignment loops per user, skips existing records, is **not transactional**, and does not check that the consent type is ACTIVE.

### 5.7 Interests

**`/admin/interests`** — stats, search, status filter, table columns Order (drag), Name, Description, Status, Users (usage count). Row click into the editor. **`/new`** and **`/[id]/edit`** use `InterestForm`: name (required, min 2), markdown description, display order, active toggle.

Interest names are unique, and deletion is refused while any member holds the interest (409) — so the "deactivate instead" advice in the UI is the practical path. The list API shapes its response by role: admins receive all rows with usage counts, non-admins receive only active rows. `GET`/`PUT`/`DELETE /api/interests/[id]` contain **no auth code at all**, and `POST /api/interests` checks a session but not the role.

### 5.8 Journal administration

The journal is one `Journal` table rendered by four public channels ([§3](#3-public-screens)); this section covers authoring, moderation and preview.

- **`/admin/journal`** — `JournalManagement`: desktop table and mobile cards with columns Article (cover, title, subtitle, type badge), Status, Editor, Authors, Pics, Published, Updated. Filters: top-level only (default on), title/subtitle search, status, and type. Pagination 20/page; filters are mirrored into the URL. Top-level rows expand to lazily load their children.
- **`/admin/journal/new`** and **`/[id]/edit`** — `JournalEditor`: title, subtitle, slug, type, parent issue, publish date/time (editors only), child-topic picker, authors (member or free-text external), issue editor, a markdown body with a formatting toolbar, a markdown cheatsheet, inline photo insertion with left/right/centre floats, eight table styles, live preview, and photo management.
- **Slug:** generated from the title on create (`slugify` + `uniqueSlug`) but **editable** and re-slugified on update — it is not immutable.
- **Status model:** `DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED`, with `PENDING_REVIEW → DRAFT` and `ARCHIVED → DRAFT`. Illegal transitions are rejected. Publishing requires a publish date. Published and pending-review articles cannot be deleted — they must be archived first.
- **Editor role:** a separate `journal_editor_ids` app setting (managed at `/admin/settings`; written through `/api/journal/settings`, not `/api/app-settings`). Only admins in that list may edit a published article, publish, or archive. A non-editor admin is read-only on published content.
- **Preview:** `/journal/preview/[id]` renders any article — draft, pending or published — through the same `JournalArticleView` as the public page, with `mode="preview"` and `noindex`. It requires `ADMIN` **and** journal-editor membership, redirects anonymous visitors to `/login`, and calls `notFound()` for everyone else. Entry points are the editor's "Preview" link and preview-only child links.
- **Photos:** upload accepts JPEG/PNG/WebP/GIF up to 20 MB, re-encoded with sharp to WebP at 1920×1200 quality 88. The original is discarded. Reorder, caption, attribution and cover selection are managed from the article editor; cover and order changes persist immediately rather than on Save.
- **Child topics:** `PUT /api/journal/[id]/children` replaces the child set (max 200; rejects self/duplicates and cycles) but **re-sorts children by publish time** (drafts last, by `updatedAt`) rather than honouring the submitted order.
- **No scheduled publishing:** a future publish date is stored, but status flips to `PUBLISHED` immediately and the public query filters on `status` only — future-dated articles go live at once (§9, item 33).
- **`/admin/journal/issues`** groups articles into magazine-style issues. **`/admin/journal/settings`** redirects to `/admin/settings#journal-editors`.

### 5.9 Documents

**`/admin/documents`** is an **admin-only** file manager with no sharing or access-control model: folder navigation with breadcrumbs, grid and list views, a dedicated mobile view, upload with progress (single file, ≤50 MB, MIME allow-list), copy, move, rename, delete, a details modal, a markdown editor and viewer, and statistics. Non-empty folders cannot be deleted. Backed by `app/api/documents/**`, including `[id]/content`, `[id]/copy` and `[id]/stats`.

Two behaviours are worth knowing before editing:

- **Saving a markdown document replaces the file.** There is no `PUT` content endpoint, so the editor deletes the old record — unlinking the bytes — and uploads a new one under a new UUID and id. A failed re-upload loses the document (§9, item 34).
- **Rename and move are metadata-only.** `PATCH /api/documents/[id]` updates `name`/`parentId` but never touches the on-disk `path`, so physical paths and children's paths go stale.

Three sub-routes — `[id]/content`, `[id]/copy` and `[id]/stats` — contain **no authorization code** and rely on the matcher, which requires only a session (§9, item 25).

### 5.10 Helpdesk

**`/admin/helpdesk`** lists support tickets (20 per page, defaulting to `status=OPEN`); **`/admin/helpdesk/[id]`** shows one.

**Ticket fields.** Category (`GENERAL` | `HOF_DATA`; the model also allows `TECHNICAL`), optional HoF association, assignee, priority (`LOW` | `NORMAL` | `HIGH`), status, a notes thread with attachments, and a status-history timeline. Markdown in the timeline is rendered with `rehype-sanitize` applied. Member-facing submissions arrive through `/contact` and `/support`.

**Queue and filters.** The list supports search plus category and status filters (the status list includes an "All Statuses" option) and pagination. The list API additionally filters on `priority`, `assignedToId` (including `unassigned`) and `hasAttachments` — but **the UI exposes none of those three** (§9, item 31). There is no sorting.

**Notes.** Notes carry attachments and markdown content. Rules enforced by `src/lib/helpdesk-constants.ts` and the note routes:

| Rule                 | Value                                                |
| -------------------- | ---------------------------------------------------- |
| Note content         | ≤ 9,999 characters                                   |
| Attachment size      | ≤ 5 MB per file, 25 MB total                         |
| Attachment types     | JPEG/PNG/GIF/WebP, PDF, Word, Excel, plain text, CSV |
| Note authoring limit | 20 notes / 15 minutes                                |
| Edit window          | **5 minutes**, author-only                           |

After the edit window the author can neither edit nor delete their own note, but **any admin can delete any note at any age**. There is **no member-facing ticket view** and **no email to the member on reply or status change** — the helpdesk is one-way (§9, item 31).

**Statistics.** Summary cards are computed from the **current page only**, and "Assigned to You" matches on the admin's email address rather than `assignedToId`; both are misleading (§9, item 35). `GET /api/support-requests/my-count` (an assigned-ticket count) exists but has no client consumer and no sidebar badge.

### 5.11 Change requests

**`/admin/changes`** (+ `/new`, `/[id]`, `/[id]/edit`) is the internal change-request tracker. Access to `/api/change-requests` **is** role-checked by the middleware, so the whole subsystem is admin-only.

- **Fields:** title, description, type (feature, bug, enhancement, documentation, other), priority (`LOW`/`MEDIUM`/`HIGH`/`CRITICAL`), status (`PENDING`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`), impact, business value, affected areas, technical details, planned/actual time, and attachments. Git-sourced requests also carry `commitHash`, `commitDate`, `version`, `category`, `isFromGit`, and line/file counts.
- **Status transitions are unrestricted** — any status can move to any other; there is no approval workflow beyond the enum.
- **Votes are admin-only 0–5 "likes",** one per admin (upsert; 0 clears) and rendered as a 1–5 star control. The UI shows the average and highlights the most-liked open requests.
- **List:** search, status and source (`MANUAL` | `GIT`) filters, eight sort fields, and pagination, with a stats dashboard built from a `limit=99999` fetch.
- **Ticket IDs:** `BWB-YYYY-NNNN`, allocated from the `ChangeRequestTicketCounter` table and stored with a lower-cased slug for lookup. `changeRequestTickets.ts` also detects a pre-migration schema so the API can return a `503` setup error instead of a generic `500`.
- **`POST /api/change-requests/sync-git`** reads a gitignored `data/git-commits/commits.json`, dedupes by `commitHash`, and uses OpenAI (`gpt-4o-mini`) to generate a title, business value and affected areas — the only optional AI dependency. It **auto-creates each commit as a `COMPLETED` change request**, estimates planned/actual time, and streams SSE progress.

Client calls go through `src/lib/changeRequestClient.ts` (timeout, retry for safe reads, friendly error mapping) and every screen is wrapped in `ChangeRequestErrorBoundary`.

### 5.12 Backups

**`/admin/backups`** creates, lists, downloads and deletes password-protected ZIP archives of the SQLite database or the uploads tree.

- Encryption is AES-256 via `archiver-zip-encrypted`, keyed by `BACKUP_PASSWORD` (falling back to the literal `default-password-change-me`).
- Progress is simulated client-side; a `beforeunload` guard warns while a backup runs.
- The password modal documents the manual restore procedure.
- **There is no restore endpoint, no pruning of old archives, and no scheduler** — creating a backup is a manual, request-triggered action (§9, item 15).
- The list API recognises only `.zip` files named with a `manual-`/`auto-`/`deploy-`/`db-`/`files-` prefix. The plain `.db` files written by `scripts/deployment/deploy.sh` are therefore **invisible in the UI and rejected for download or delete** (§9, item 36).

### 5.13 Audit logs and test results

- **`/admin/logs`** — read-only audit viewer. Stats: total events, failed events, unique users, and the top five countries. Filters: event type, user (including "Anonymous (Unauthenticated)"), status, country, and a date range. Columns: Timestamp, User (linked to the member), Event (colour-coded by AUTH/ADMIN/USER category), Status, Country (with a Tor marker for `T1`); rows expand to the full IP hash, user agent, resource type and id, error information, and the raw `actionDetails` JSON. Sorting on five columns; pagination is **fixed at 100 per page**. A dismissible notice explains that IPs are SHA-256 hashed and states the retention policy.
- **`/admin/test-results`** — Jest dashboard. Summary cards for suites and individual tests, a pass/fail banner, total duration, "last run" from the file's mtime, a refresh button, a file-name search, and status toggles. Each suite expands to individual tests with durations and failure messages (absolute paths stripped). It reads `data/test-results/test-results.json`, which is produced by `npm run test:results` and is gitignored. There is no pagination — the whole file is parsed and returned in one response.

**Notable limitations.** The event-type filter is a hard-coded 28-item subset of the 49-value `EventType` enum and is single-select although the API accepts multiple; the Tor marker cannot fire because `T1` maps to `XX` in `src/lib/geoip.ts`; and the stats cards override the active filters (the failed count forces `FAILURE`, the unique-user count forces a non-null user). On the test-results side, the summary cards and pass/fail banner ignore the active filters, and a suite that errors at runtime can still render green (§9, item 41).

### 5.14 Roles, sponsors and settings

**`/admin/roles`** is a **read-only** catalogue with no CRUD and no user-assignment UI. It has no sidebar entry and is reachable only by direct URL. The role list it renders is **hard-coded** in `app/api/admin/roles/route.ts` — three roles (`USER`, `CLERK`, `ADMIN`) with permission strings. There is no `Role` model; `User.role` is a plain string defaulting to `USER`.

Roles are actually assigned on `/admin/members/[id]` through the Role select, which offers only **USER** and **ADMIN**. `CLERK` exists in the hard-coded catalogue and is referenced by the user-delete handler, but **no code path can assign it**.

> This page is very likely broken in practice: it fetches `${NEXT_PUBLIC_API_URL || "http://localhost:3100"}/api/admin/roles` **server-side without forwarding cookies**, but the app runs on port 1345 and that variable is not set by default — so it should render its "No roles found" empty state.

**`/admin/sponsors`** manages sponsors: a table with logo thumbnail, name/slug, description and website link, plus an Add/Edit modal (name required, description, website URL — the browser validates the URL) and per-row logo upload or removal. The slug is generated from the name, but the API also accepts a **client-supplied `slug`** on create; it is immutable after creation, and duplicate slugs return 409 (§9, item 37). Logo upload caps at 5 MB, validates by magic bytes (PNG/JPEG/WebP/GIF), and re-encodes with sharp to fit within 800×600 as WebP quality 85. **Deleting a sponsor has no confirmation dialog at all** — the button acts immediately — and neither does removing a logo. There is no search, sorting or pagination.

**`/admin/settings`** renders three inline-edit cards plus a journal editors section:

| Card                    | Keys                                                                              | Notes                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Hall of Fame & Support  | `default_year_id`, `default_hof_id`, `support_clerk_email`, `support_admin_email` | Selects for the defaults; email inputs for the support addresses                                                 |
| Funding & Running Costs | `funding_total_spent`, `funding_total_collected`, `funding_monthly_est`           | Drives the member funding bar ([§4](#4-member-screens)) and the donate-page indicator; defaults shown when unset |
| All Settings (Debug)    | —                                                                                 | Read-only dump of every `AppSetting` row                                                                         |
| Journal Editors         | `journal_editor_ids`                                                              | Chips of current editors plus a searchable add; writes the whole array as JSON                                   |

Validation is HTML-only (`type="email"`, `min`, `step`). Saving one row in a group PUTs the whole group, and a partial failure reports "Failed to save some settings". There is **no key allow-list** on the write endpoint, so arbitrary new keys can be created and will appear in the debug table (§9, item 24). `GET` additionally supports `?key=` and `?category=`. Writes (`PUT`, `DELETE`) require `ADMIN` in the middleware; **reads stay open to any session**, because the funding bar and the contact form read settings (§9, item 38).

> **Known bug:** `SettingsView`'s `fetchData()` returns early once it has initialised, so the post-save refresh and the Cancel / "reset to original value" buttons in the Hall of Fame & Support card do nothing. Only the funding save resets the flag.

---

## 6. Domain logic

### Hall of Fame and qualification

A member qualifies for a HoF in a year when they meet **every enabled requirement** in that `HofYearConfig`:

| Requirement                | Field             | Notes                                |
| -------------------------- | ----------------- | ------------------------------------ |
| Minimum total peaks        | `minPeaks`        | against cumulative `totalPeaks`      |
| Minimum foreign peaks      | `minForeignPeaks` | against cumulative `foreignPeaks`    |
| Minimum foreign-peak ratio | `minFpr`          | 0–100, `foreignPeaks / totalPeaks`   |
| Minimum age                | `minimumAge`      | derived from the member's birth year |

Each requirement has an enable switch; a disabled requirement is ignored entirely, including its validation. A member whose participation is disabled for either the HoF or the year is omitted from the tables. **Retired and deceased members are not excluded from qualification** — they can still qualify and appear carrying a `Retired`/`Deceased` badge; those exclusions apply only to the Progress Register (below). Rules in full: [`docs/QUALIFICATION_RULES.md`](docs/QUALIFICATION_RULES.md).

### Large Country Exception (LCE)

When LCE is enabled for a HoF-year, members resident in any country on that configuration's LCE list are evaluated against `lceMinPeaks`, `lceMinForeignPeaks` and `lceMinFpr` instead of the standard thresholds. A blank LCE value falls back to the standard threshold, so LCE can relax any subset of the rules. LCE country rows (`CountryLceConfig`) are attached to the configuration. See [`docs/QUALIFICATION_RULES.md`](docs/QUALIFICATION_RULES.md).

### Award tiers

Six tiers — Bronze, Silver, Gold, Emerald, Sapphire, Diamond — matched by `minPeaks`/`maxPeaks` per HoF-year; the top tier has an open maximum. Tiers are seeded (528 rows across 88 HoF-year configs) and drive table colouring and the "N more peaks to reach the next tier" copy. See [`docs/HOF_SYSTEM.md`](docs/HOF_SYSTEM.md).

### Ranking

Members are ranked by total peaks, then higher FPR, then more peaks in the year, then earlier first-qualification year, then display name **reverse**-alphabetically. Equal totals share a rank. The same order is documented in the HoF tables' in-app info panel.

### Cumulative totals and the BASELINE year

`totalPeaks` and `foreignPeaks` are **cumulative**: each year's figure is the sum of that year and all earlier active years, ordered by `Year.displayOrder`. Only `peaksInYear` and `foreignPeaksInYear` are ever entered by hand.

`recalculateTotalsForUserAndHof` recomputes the cumulative figures whenever an entry is created, updated, or edited inline or through My Bags. **Deleting an entry does not trigger it** (§9, item 9), and bulk imports must call it explicitly ([§8.4](#84-member-data-import-for-a-year)).

A special seeded year, **`BASELINE`** ("Before 2019", `displayOrder: -1`, created by `scripts/seed/seed-baseline-year.js`), lets a member record the peaks they climbed before systematic tracking began as an **opening balance**. Because recalculation walks `displayOrder`, BASELINE is simply the first term in every member's cumulative sum. See [`docs/TOTAL_PEAKS_RECALCULATION.md`](docs/TOTAL_PEAKS_RECALCULATION.md).

### Progress Register exclusions

Members who participated but did not qualify appear in the Progress Register. Each HoF can exclude retired, deceased, and long-inactive members (all default on), where "long-inactive" means no participation for `progressRegisterInactivityYears` years (clamped to 1–10, default 2). See [`docs/QUALIFICATION_RULES.md`](docs/QUALIFICATION_RULES.md).

### Member badges

The HoF tables and dashboard surface derived badges — `Me`, `New Entrant`, `New Award`, `Retired`, `Deceased`, `LCE`, `Junior`, `National`, and `Missing Data` — computed from participation, tier history, retirement/death years, LCE membership, and data completeness.

---

## 7. Cross-cutting systems

### 7.1 Authentication

NextAuth 4 with a credentials provider (email **or** username), JWT sessions, and bcrypt hashing. The JWT carries `id` and `role`, copied into the session by the `jwt`/`session` callbacks. Login is refused until `emailVerified` is set.

- **Tokens.** Verification tokens live **24 hours** and reset tokens **1 hour**; both are 32 random bytes stored hashed and are single-use (`src/lib/tokens.ts`).
- **Turnstile.** Login, register, forgot-password, reset-password and resend-verification verify a Cloudflare Turnstile token. The check **fails open**: on a Turnstile outage or timeout the request is allowed so an outage cannot lock everyone out (`shouldBlockRequest` / `failedOpen` in `src/lib/turnstile.ts`).
- **No server-side revocation.** Changing a role or signing out takes effect only when the JWT is next refreshed; there is no session store to revoke against.
- **bcrypt cost is inconsistent** — 12 at creation, 10 in the password-change route (§9, item 4).

### 7.2 Consent management

`ConsentType` defines a template; `UserConsent` records a member's acceptance with a date, method, required flag, note and optional evidence attachments. Registration creates a `UserConsent` row for every ACTIVE consent type. An outstanding required consent redirects the user to `/consent-prompt` from any authenticated screen via `app/(authenticated)/template.tsx`.

The gate is **client-rendered and fails open**: `ConsentRedirect` performs the redirect in a `useEffect`, and `checkMissingRequiredConsents` returns an empty list if its query throws, so a consent-check error lets the user through. The automated check covers only the two legal documents, not the full required-consent set ([§3](#3-public-screens)). See [`docs/USER_CONSENT_MANAGEMENT.md`](docs/USER_CONSENT_MANAGEMENT.md).

### 7.3 Rate limiting

Database-backed fixed window using `RateLimitAttempt`, keyed on client IP or email plus a limiter name. The client IP is read from `CF-Connecting-IP`, then `X-Forwarded-For`, then `X-Real-IP` — **so the application must sit behind a proxy that overwrites those headers**, or the limiter can be bypassed by spoofing them. `npm run db:cleanup-rate-limits` prunes the table.

| Limiter              | Key      | Limit | Window     | Used by                                 |
| -------------------- | -------- | ----- | ---------- | --------------------------------------- |
| `registration`       | IP       | 5     | 1 hour     | `POST /api/auth/register`               |
| `password-reset`     | email    | 5     | 1 hour     | `POST /api/auth/forgot-password`        |
| `email-verification` | email    | 10    | 1 hour     | `POST /api/auth/resend-verification`    |
| `support-request`    | IP/email | 5     | 15 minutes | `POST /api/support-requests`            |
| `note-creation`      | user     | 20    | 15 minutes | `POST /api/support-requests/[id]/notes` |
| `donation-checkout`  | IP       | 10    | 15 minutes | `POST /api/donations/checkout`          |

Two caveats: **login and reset-password are not rate-limited** (Turnstile only), and the donation checkout reads `X-Forwarded-For` **before** `CF-Connecting-IP`, unlike every other caller. No client component handles a `429` — there is no countdown or limiter-specific copy ([§7.10](#710-error-handling-and-failure-ux)).

### 7.4 Audit logging

`logEvent` records the event type and category, status, optional user, a **SHA-256 hash of the IP** (never the raw address), the country derived from Cloudflare headers, a parsed user agent, the affected resource, a JSON detail blob, and a computed retention date. Writes are fire-and-forget. Retention is 90 days for `AUTH` and 730 days for everything else, but **cleanup is manual** — `npm run db:cleanup-logs` — and no scheduler is configured in the Dockerfile, compose file or deploy script.

### 7.5 Email and notifications (Brevo)

Transactional email goes through the Brevo HTTP API via `sendEmail` (`src/lib/email.ts`), which writes an `EmailLog` row before sending.

**Delivery lifecycle.** `EmailLog.status` moves `PENDING` → `SENT` (with `brevoMessageId`) or `FAILED`; `POST /api/webhooks/brevo` then advances it to `DELIVERED`, `BOUNCED` or `FAILED` from Brevo's delivery events. The webhook authenticates by checking the caller IP against a hard-coded list of Brevo ranges — **a spoofable `X-Forwarded-For` prefix check, not a signature**. Logs carry a 90-day `retentionDate`, but nothing reads it: only audit logs have a cleanup script, and there is no admin UI for email logs.

**What sends email**

| Trigger                   | Recipients                  | Purpose                          |
| ------------------------- | --------------------------- | -------------------------------- |
| Registration              | new member                  | verification link                |
| Resend verification       | member                      | verification link                |
| Forgot password           | member                      | reset link                       |
| Support request submitted | support address + requester | notification + auto-confirmation |

**What does not** (§9, item 30): helpdesk replies and status changes, donations (no receipt), change requests, journal publication, and consent assignments. `getAdminCreatedUserEmail` is defined but never called, and `getEmailStats` has no caller. In development, `DEV_EMAIL_RECIPIENT` silently reroutes every message; with no `BREVO_API_KEY`, registration and password reset still succeed but no mail is sent.

### 7.6 File storage and uploads

All user uploads live under one root resolved by `getUploadsBaseDir()` — `UPLOADS_DIR` in production (it **throws** if unset, deliberately, so nothing falls back to `public/`), `<repo>/uploads` in development. Subdirectories: `documents/`, `user-consents/`, `change-requests/`, `consent-types/`, `meister-reports/`, `notes/`, `support-requests/`, `journal/`, `sponsors/`. Filenames are UUID/cuid-based; the original name is stored in the database and never used as a path. Files are served through `GET /api/uploads/[...path]`, which validates against traversal but **performs no authorization** (§9, item 7).

**Per-subsystem limits**

| Subsystem                  | Size cap               | Accepted types                                           | Count cap      |
| -------------------------- | ---------------------- | -------------------------------------------------------- | -------------- |
| Documents                  | 50 MB                  | MIME allow-list                                          | one per upload |
| Journal photos             | 20 MB                  | JPEG/PNG/WebP/GIF → WebP 1920×1200 q88                   | —              |
| Consent-type attachments   | 10 MB each             | JPEG/PNG/GIF/WebP, PDF, TXT, Word, DOCX                  | none           |
| Member consent evidence    | 10 MB each             | JPEG/PNG/GIF/WebP, PDF                                   | —              |
| Change-request attachments | 10 MB each             | image/PDF/document MIME allow-list                       | —              |
| Helpdesk note attachments  | 5 MB each, 25 MB total | JPEG/PNG/GIF/WebP, PDF, Word, Excel, TXT, CSV            | —              |
| Sponsor logo               | 5 MB                   | PNG/JPEG/WebP/GIF, magic-byte sniffed → WebP 800×600 q85 | one            |
| Meister report image       | 5 MB                   | PNG/JPEG/WebP/GIF, magic-byte sniffed → WebP 800×600 q85 | one            |
| **Public support form**    | **none**               | **none** — only `size > 0` is checked                    | **none**       |

The last row is the outlier: `POST /api/support-requests` accepts unbounded attachments from anonymous callers and stores them under a path served by the unauthenticated uploads route (§9, item 26). Upload paths for Meister reports and consent-type attachments also drift between the storage root and the linked `/uploads/...` URL (§9, item 19).

### 7.7 Images

`sharp` handles server-side image work: journal photos are re-encoded to WebP; icons and the placeholder image are generated by `npm run icons:generate` and `scripts/dev/generate-placeholder-image.js`.

### 7.8 Backups

`getBackupDir()` is the single source of truth for the backup location — `BACKUP_DIR`, else `/app/backups` in production, else `<repo>/backups`. Archives are AES-256 ZIPs created by the admin UI or by `scripts/deployment/deploy.sh` (which writes plain `.db` files before deploying).

### 7.9 Operational endpoints

| Endpoint                              | Purpose                                                         | Access |
| ------------------------------------- | --------------------------------------------------------------- | ------ |
| `GET /api/health`                     | Liveness and diagnostics                                        | Public |
| `GET /api/version`                    | Deployed version string                                         | Public |
| `GET /api/turnstile/sitekey`          | Turnstile site key                                              | Public |
| `GET /api/legal/[documentType]`       | Serves `data/legal/privacy-policy.md` and `terms-of-service.md` | Public |
| `app/sitemap.ts`, `public/robots.txt` | SEO                                                             | Public |

### 7.10 Error handling and failure UX

**Page-level boundaries.** Two React error boundaries exist — `app/error.tsx` (public shell) and `app/(authenticated)/error.tsx` (member/admin shell) — plus a `not-found.tsx` in each. Each offers "Try Again" (`reset()`) and a link home. There is **no `global-error.tsx`**, so a failure in the root layout or providers has no boundary, and there are **no `loading.tsx` files** anywhere, so no route gets a streaming or skeleton state.

Boundary diagnostics are minimal: both log with `console.error` (the "reporting service" comment is aspirational) and show the message and Next.js `digest` only when `NODE_ENV === "development"`. Server-render errors never reach the audit log.

**Failure patterns**

- **Scoped boundaries.** Render failures are contained per feature where it matters: `DonationErrorBoundary` wraps `/donate`, and every change-request screen is wrapped in `ChangeRequestErrorBoundary`.
- **Timeout and retry.** `src/lib/fetchWithTimeout.ts` enforces an abort timeout; `src/lib/changeRequestClient.ts` adds retry for safe reads on 408/429/5xx and maps failures to friendly copy. Only five components use them, so most of the ~150 client `fetch` calls have no timeout.
- **Degrade in place.** The intended pattern is that secondary failures — stats, attachments — show an inline message while the rest of the screen stays usable.
- **Swallowed failures.** Many components wrap `fetch` in `try/catch` but only `console.error`, and several check `if (response.ok)` with no `else`, so a failed load is indistinguishable from an empty result. Example: `MyBagsManagement` renders the empty state when `/api/my-bags` fails.
- **Anonymous 500s.** `getSession()` **throws** when there is no session (`src/lib/api-auth.ts`). Handlers that call it on a matcher-covered route catch the throw and return `500 Internal server error`. `/sponsors` is the visible example, but the pattern affects dozens of route files — use `getOptionalSession()` for any route an anonymous caller can reach.
- **Exposed exceptions.** A few handlers return raw `error.message` to the client (register, change-requests, backup, sync-git); there is no correlation ID outside development.
- **429.** Six limiters return `429`, but no client component handles it — there is no countdown or limiter-specific copy.
- **Session expiry.** No client code inspects `response.status === 401`; an expired JWT surfaces as a generic inline error or a silent empty state rather than a re-login prompt.

**API error shape.** There is no shared error helper. Handlers return `{ error: string }`, occasionally with `details`. Status semantics are inconsistent: some routes return `403` with the message `"Unauthorized"`, others `401`. See [§7.13](#713-api-conventions).

### 7.11 Loading, empty and success states

- **Loading.** No route-level `loading.tsx` and no skeletons. `LoadingSpinner` covers roughly a dozen components; other screens render plain text. The authenticated shell renders `children` before the session resolves, so the sidebar appears after content.
- **Empty.** `EmptyState` is the shared component, used for filtered ("No tickets match your current filters") and genuinely empty lists — but because failed fetches often fall through to the same UI, empty and error are not always distinguishable.
- **Success.** There is **no toast or notification system**. Inline banners and status text are the norm; destructive or completed actions sometimes use native `window.alert()` (about 60 call sites) and `window.confirm()` (4 call sites).
- **Admin guard.** `app/(authenticated)/admin/layout.tsx` redirects non-admins with `router.push("/home")` and then returns `null`, producing a brief blank screen rather than a permission message.

### 7.12 Accessibility and UI conventions

A Tailwind 4 dark theme with a shared component library under `app/components/ui` (buttons, inputs, selects, modals, tables, pagination, date pickers, country/region selectors, markdown viewer). Accessibility is lint-enforced through `jsx-a11y` with a ratcheted budget of 69 known warnings — lower it, never raise it. Automated a11y suites live under `__tests__/a11y/` and responsive suites under `__tests__/responsive/`.

Field-level error wiring exists in `ui/Input.tsx`, `ui/Textarea.tsx`, and the BwB information section; elsewhere error text is often a bare `<p className="text-red-400">` with no `role="alert"` or `aria-describedby`. A validation-summary card pattern exists on only two forms (consent types and the member profile), and it is neither announced to assistive technology nor focused on submit.

### 7.13 API conventions

- **Route modules.** 93 `route.ts` files expose 149 HTTP operations (62 GET, 39 POST, 24 DELETE, 19 PUT, 5 PATCH).
- **Auth helpers.** `getSession()` (throws without a session), `getOptionalSession()` (returns `null`), `getCurrentUserId()` and `isAdmin()` in `src/lib/api-auth.ts`; `isJournalEditor()` in `src/lib/journal-auth.ts`.
- **Success shape.** The resource directly, or `{ data, total, page, limit, pages }` for paginated lists.
- **Error shape.** `{ error: string }`, optionally `details`. `401` vs `403` is not used consistently.
- **Auth coverage.** The middleware matcher covers admin, user, my-bags, and a set of authenticated-only prefixes; everything else is public by design or relies on in-route checks ([§2](#2-the-access-model-read-this-first)). The coverage test (`__tests__/security/api-route-auth-coverage.test.ts`) enforces that each route is matcher-covered, listed public, or contains _some_ guard — but it counts `getSession()` as a guard and never checks the role (§9, item 2).
- **Dynamic params** use `params: Promise<{ id: string }>` and must be awaited (Next.js async params).
- **Pagination** is `?page`/`?limit`; not every list paginates — audit logs are fixed at 100 per page, and several admin lists are fully client-side.

---

## 8. End-to-end processes

These are the multi-step workflows that cross screens, described as the member or operator experiences them, with the side effects that are easy to miss.

### 8.1 Registration → verification → first login

1. `/register` validates the form, verifies Turnstile, and rate-limits by IP.
2. `POST /api/auth/register` creates the `User`, a `UserHofParticipation` row for every active HoF, a `UserYearParticipation` row for every active year, and a `UserConsent` row for every ACTIVE consent type. It sends a verification email with a **24-hour** token.
3. Login is refused until `emailVerified` is set — "Please verify your email address before logging in."
4. The member verifies at `/verify-email?token=…` and signs in.
5. `app/(authenticated)/template.tsx` checks required consents on every screen and diverts to `/consent-prompt` if any are outstanding.

### 8.2 Password reset

`/forgot-password` always returns the same response (so it cannot enumerate accounts), emails a single-use token valid for **1 hour**, and `/reset-password` consumes it. Both steps are Turnstile-protected; only forgot-password is rate-limited.

### 8.3 Donations

`/donate` → `POST /api/donations/checkout` (writes a `PENDING` row, creates a Stripe session) → hosted Checkout → `/donate/success` or `/donate/cancelled`. Fulfilment happens **only** in `POST /api/donations/webhook` on `checkout.session.completed`; the success page is not authoritative. See [§3](#3-public-screens) and §9, item 29.

### 8.4 Member data import for a year

1. `/admin/years/[id]/upload-data` accepts a JSON file (≤10 MB, ≤10,000 entries) shaped `[{ year, cid, "HOF-CODE": [peaksInYear, foreignPeaksInYear] }]`.
2. Selecting the file immediately POSTs it to `validate-member-data`, which returns six counts: Processed, Valid, Create, Update, Modified, Errors.
3. The operator reviews the diff (changed values render `old → new`) by filter tab and search, 20 rows per page.
4. Confirming requires typing the year's **internal cuid** (not its code); `POST /api/years/[id]/import-member-data` then runs in a transaction — upserting entries, creating missing participations, and recalculating totals for every affected (member, HoF) pair.

Members resolve by **`peakbaggerId` matching `cid`**. Unknown HoF codes, negative or non-numeric values, and duplicate (member, HoF) pairs are errors; a one-element array is read as `[peaks, 0]`; an empty array is skipped silently while `summary.skipped` is hard-coded to `0`. A record with a missing `year` throws and fails the whole file.

### 8.5 Creating and deleting a year's member data

- **Create Zero Entries** (`POST /api/years/{id}/create-missing-entries`) creates a zero row for every (user × active HoF) pair lacking one, plus missing participations, then recalculates totals sequentially. It is **not transactional**, loads **all** users regardless of status, and has no inactive-year guard.
- **Delete Member Data** (`POST /api/years/{id}/delete-member-data`) is a two-step gate whose second step requires `DELETE <year code>`. It runs in a transaction and preserves configuration and award tiers.

### 8.6 Journal publishing

`DRAFT → PENDING_REVIEW → PUBLISHED → ARCHIVED`, with `PENDING_REVIEW → DRAFT` and `ARCHIVED → DRAFT`. Publishing requires a publish date. Published and pending-review articles cannot be deleted — archive first. Only admins listed in the `journal_editor_ids` setting may edit published content, publish, or archive; other admins are read-only on published articles. Editors can preview any article, published or not, at `/journal/preview/[id]`. There is no scheduled publishing ([§5.8](#58-journal-administration)).

### 8.7 Helpdesk ticket

A member submits through `/contact` (anonymous, Turnstile-gated) or `/support` (signed in), optionally attaching files. The ticket lands in `/admin/helpdesk` with a category, priority and optional HoF; HoF-data tickets are routed to that HoF's Meister and the support addresses are emailed. An auto-confirmation goes to the requester. Admins then work the ticket with status changes and a threaded notes timeline (markdown, sanitised, 5-minute author edit window). **The member cannot see the ticket again and is never emailed a reply or status change** — the flow is one-way ([§5.10](#510-helpdesk)).

### 8.8 Consent assignment

`AssignConsentDialog` assigns a consent type to **All Active Users** (status NEW or ACTIVE) or **Users by Country** (birth or residence), optionally marking it required. Assignment loops per user, skips existing records, and is **not transactional**; it does not check that the consent type is ACTIVE.

### 8.9 Backups and restore

`/admin/backups` creates AES-256 encrypted ZIPs of the SQLite database or the uploads tree, lists them, and allows download and delete. Progress is simulated client-side with a `beforeunload` guard. **There is no restore endpoint** — the password modal documents the manual procedure — and `scripts/deployment/deploy.sh` writes plain `.db` files around a deploy. Archives are never pruned automatically.

### 8.10 Member deletion

Two gates: a confirmation listing the HoF entries, participations, consents and change requests that will be destroyed (plus a warning when the member is a HoF Meister), then a typed confirmation matching the given name, family name, or `DELETE` (case-insensitive). Self-deletion and `ADMIN`/`CLERK` accounts are refused, as is any member holding a Hofmeister assignment. Cascades are described in [§5.1](#51-members).

### 8.11 Audit-log retention

`logEvent` stamps every row with a retention date (90 days for `AUTH`, 730 days otherwise), but nothing enforces it: `npm run db:cleanup-logs` is manual and no scheduler exists in the Dockerfile, compose file, or deploy script. The same is true of rate-limit rows (`npm run db:cleanup-rate-limits`) and email logs (which have no cleanup script at all).

---

## 9. Known gaps and inconsistencies

These are behaviours whoever continues the project should know about. They are documented rather than fixed here.

1. **Administrative API authorization is enforced in the middleware, and only there.** Every matched API family is role-checked: `/api/backup`, `/api/documents`, `/api/hof-entries` and the `/api/users` collection require `ADMIN` for every method, and writes to `/api/hofs`, `/api/years`, `/api/consent-types`, `/api/interests` and `/api/app-settings` require it too, while reads of those five stay open to any session because member screens depend on them (the profile interest picker, the member consents screen, the contact form and the funding bar). The former hole — `POST /api/users` accepting a `role` field so a member could mint an `ADMIN`, `/api/backup` exposing archives and the archive password, and unguarded `/api/documents` reads — is closed. What remains is that most handlers still carry no role check of their own, so the middleware is a single point of failure and item 2 still applies.
2. **The security coverage test gives false confidence.** `__tests__/security/api-route-auth-coverage.test.ts` asserts each route is matcher-covered, listed as public with a reason, or contains _some_ guard call — and `getSession()` counts as a guard. It never verifies the **role**. The middleware's role rule is pinned separately by `__tests__/unit/routeAuthz.test.ts`, but that only guards the rule; a handler that needs a role check of its own remains invisible to both tests.
3. **Plaintext password logging.** `app/api/users/[id]/password/route.ts` writes the received password to the server console.
4. **bcrypt cost is inconsistent** — 10 in the password-change route, 12 at user creation.
5. **`app/(authenticated)` is not a guard.** `/member-hof-tables`, `/awards`, `/sponsors`, `/support`, `/journal` and friends render without a session.
6. **`GET /api/hof-tables` is public** and returns member display names, totals, FPR, retirement/death years and exclusion statistics to anonymous callers.
7. **Uploads are served without authorization.** `/api/uploads/[...path]` streams any file under the uploads root to anyone who knows the path; UUID filenames are obscurity, not access control. Called out in `SECURITY.md` and `IMPLEMENTATION.md` §16.1.
8. **User deletion can fail with a generic 500** when the member created a journal (`Journal.createdBy` is `Restrict` and unchecked).
9. **Deleting a HoF entry does not recalculate cumulative totals**, unlike create and update.
10. **Data-entry stats are page-scoped**, and member dropdowns cap at `limit=1000`.
11. **Journal markdown is not sanitised** — `MarkdownViewer` uses `react-markdown` + `remark-gfm` with no `rehype-sanitize` and no `rehype-raw`. Raw HTML is escaped rather than rendered, so it is not an XSS vector, but sanitisation is not applied.
12. **`/p-index` does not compute rankings**, despite the name; the league standings live in the HoF tables.
13. **`/other` and `/p-index` posts always render as "Issues"** because they are always top-level, which also suppresses their photo gallery.
14. **Backup defaults are weak** — a literal fallback password, no key derivation, a raw file copy rather than a SQLite online backup, whole-file reads on download, and no pruning of app-created archives.
15. **No scheduler** for audit-log retention or backups.
16. **Stale references:** `backups/README.md` mentions `/admin/backup` and a `scripts/auto-backup.js` that does not exist; `/home` links to the public `/hof-tables` instead of the member route. (`useUserManagement.ts` uses `/admin/users`, but that is not stale: `next.config.js` permanently redirects `/admin/users/:path*` to `/admin/members/:path*`.)
17. **Dead code:** `YearStatsInlineEditor` is exported but never used; `home/page.tsx` contains an unused `AchievementsSection`, `ProgressBar` and `currentYearData`; `HofTablesView.activeTab` has no UI; the data-entry list has an unreachable delete modal.
18. **Role/status drift:** `RoleSelect` offers only USER and ADMIN while other code references `CLERK`; `StatusSelect` omits `DECEASED`, which the API accepts.
19. **Upload path drift.** Meister-report images are written under `UPLOADS_DIR`/`<cwd>/uploads` but stored and linked as `/uploads/meister-reports/<id>.webp`, a static-public path — so unless `UPLOADS_DIR` points inside `public/`, the stored URL does not resolve. Consent-type attachments are written to `<uploadsBase>/consent-types/...` but linked at `/uploads/...` and **deleted** from `<cwd>/public/uploads/...`, so downloads can 404 and deletions leave orphaned files (unlink failures are swallowed).
20. **Navigation gaps.** `/admin/hofs` and `/admin/years` have no sidebar entry (reachable only from `/admin/configuration`); `/admin/interests`, `/admin/consent-types` and `/admin/roles` have no in-app link at all.
21. **Dormant or inconsistent confirmation gates.** The Delete buttons on the Year, HoF and Configuration forms are permanently `disabled` while their typed-confirmation dialogs remain in the code. The member-data import asks the operator to type the year's internal cuid, whereas deleting member data asks for `DELETE <year code>` — and deleting a sponsor has no confirmation at all.
22. **Non-transactional multi-step writes.** Creating zero entries (entries → participations → totals recalculation) is not wrapped in a transaction, nor is LCE country creation after a configuration row, nor the sponsor logo unlink-before-delete. A mid-run failure leaves partial state.
23. **`/admin/settings` edit controls are partly inert** — the post-save refresh and the Cancel/reset buttons in the Hall of Fame & Support card are no-ops because of an early return in `fetchData()`.
24. **App settings writes have no key allow-list.** An admin can create arbitrary keys, which then appear in the debug table. The role is checked by the middleware, but the endpoint accepts any key name.
25. **Three document routes carry no in-route authorization.** `GET /api/documents/[id]/content`, `GET /api/documents/[id]/stats` and `POST /api/documents/[id]/copy` contain **no authorization code**; they rely solely on the middleware, which since the boundary fix requires `ADMIN` for every `/api/documents` method. The access control is therefore correct but lives in one place — adding a new `/api/documents` route silently inherits it, and a read that should be member-visible would need a deliberate carve-out.
26. **The public support form accepts unbounded, unvalidated uploads.** `POST /api/support-requests` is reachable without a session — Turnstile-gated for anonymous callers, but a signed-in member needs no CAPTCHA — and its only file check is `size > 0`: no MIME allow-list, no per-file cap, no count cap. Files land under `$UPLOADS_DIR/support-requests/` and are then retrievable through the unauthenticated `/api/uploads/[...path]`. On a host with limited disk that is a straightforward exhaustion vector. The helpdesk **notes** endpoint already enforces sensible limits (5 MB per file, 25 MB total, MIME and extension allow-lists) that this public path does not.
27. **Attachment deletion orphans files in two subsystems.** Helpdesk note attachments and change-request attachments are written under `$UPLOADS_DIR/...`, but their delete handlers resolve the file as `path.join(process.cwd(), "public", attachment.path)`. The unlink misses, the error is swallowed and the database row is removed — so every deletion leaks a file on disk.
28. **Document copy is broken at the storage layer.** `POST /api/documents/[id]/copy` writes the new bytes to the documents root regardless of the destination chosen, yet stores the **original** `path` on the new row. The copy's database path therefore points at the original file, so deleting either record unlinks a file the other still references. Folder copy is stubbed (`// TODO: Recursively copy all contents`) and produces an empty folder row.
29. **Donations are write-only and unreconciled.** No receipt email is sent even though `/donate/success` promises one; `FAILED` is never written; monthly subscriptions are created but renewals, refunds, and failed payments are not handled; and there is **no admin UI** to view or reconcile donations. The checkout limiter also reads `X-Forwarded-For` before `CF-Connecting-IP`, unlike every other limiter ([§7.3](#73-rate-limiting)).
30. **Email delivery tracking is invisible and unpruned.** `EmailLog` records `PENDING`/`SENT`/`FAILED` and the Brevo webhook adds `DELIVERED`/`BOUNCED`, but nothing surfaces it in the admin UI, the 90-day `retentionDate` is never read, and there is no cleanup script. `getEmailStats` and `getAdminCreatedUserEmail` are unused. No email is sent for helpdesk replies, donations, change requests, journal publication, or consent assignments.
31. **The helpdesk is one-way and its assignment fields have no UI.** Members cannot view their own tickets (`GET /api/support-requests` and `/[id]` require `ADMIN`) and are never emailed a reply. Priority and assignee exist on the model and API but `TicketDetail` exposes only a status control, and the queue UI omits the API's `priority`, `assignedToId` and `hasAttachments` filters. There is no sorting.
32. **Helpdesk note rules are inconsistent.** The 5-minute edit window is author-only, but **any admin can delete any note at any age** — contradicting the comment on the delete handler — and after the window the author cannot delete their own note either.
33. **Journal has no scheduled publishing.** A future publish date is stored but status flips to `PUBLISHED` immediately, and the public query filters on `status` only, so future-dated articles go live at once.
34. **Saving a markdown document replaces the file.** With no `PUT` content endpoint, the editor deletes the record (unlinking the bytes) and re-uploads under a new id, so a failed re-upload loses the document. Separately, rename and move update only `name`/`parentId` and never the on-disk `path`.
35. **Helpdesk statistics are misleading.** Summary cards are computed from the current page only, and "Assigned to You" matches on the admin's email address rather than `assignedToId`.
36. **The backup UI cannot see deploy artifacts.** It recognises only `.zip` archives with a `manual-`/`auto-`/`deploy-`/`db-`/`files-` prefix, so the plain `.db` files written by `deploy.sh` are invisible in the UI and rejected for download or delete.
37. **Sponsors accept a client-supplied slug.** `POST /api/sponsors` honours a `slug` supplied by the client instead of always deriving it from the name, so the "generated from the name" description in [§5.14](#514-roles-sponsors-and-settings) is not guaranteed.
38. **`DELETE /api/app-settings?key=` is role-checked only by the middleware.** The middleware now requires `ADMIN` for writes to `/api/app-settings`, so the destructive case in item 1 is closed. The handler itself still contains no auth code, and its comment claims the middleware guarantees `ADMIN` — true now, but it is the only thing standing between a signed-in member and `journal_editor_ids`.
39. **Internal admin notes leak to signed-in members.** `GET /api/consent-types` returns consent types including their admin-only internal notes to any signed-in member; the notes are marked admin-only in the UI but not filtered by role in the API. `GET /api/hof-year-configs` is likewise session-only and exposes configuration thresholds, internal notes and the Meister report to any signed-in member ([§5.5](#55-hof-year-configuration)).
40. **Dead endpoints and code.** `/api/hof-tables/overall-stats` and `/api/support-requests/my-count` have no client consumers, and `app/api/hof-matrix/` is an empty directory. Also unused: `getEmailStats`, `getAdminCreatedUserEmail`, `YearStatsInlineEditor`, an unreachable data-entry delete modal, and `HofTablesView.activeTab`.
41. **Log and test-result filters under-report.** The audit-log event filter is a hard-coded 28-item subset of the 49-value `EventType` enum and is single-select although the API accepts multiple; the Tor marker cannot fire because `T1` maps to `XX`; the stats cards override the active filters; and the test-results summary cards and pass/fail banner ignore the active filters, so a suite that errors at runtime can still render green.
