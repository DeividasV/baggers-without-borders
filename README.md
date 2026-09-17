# Baggers Without Borders (BWB)

Baggers Without Borders is an international community of **peak-baggers** — people
who hike and climb to the summits of hills and mountains, at home and abroad,
often by **topographic prominence**. This repository is an independent, unofficial
platform for that community: it keeps member records, computes and publishes the
annual **Hall of Fame** tables and awards, hosts the journal and P-Index League,
runs the member helpdesk, records consent, and supports donations towards hosting
and development.

It is a server-rendered web application: **Next.js 16** (App Router), **React 19**,
**TypeScript**, **Prisma 7 on a single SQLite file**, **NextAuth 4**, and
**Tailwind 4**. It runs as one Node process with no external services required
beyond the optional integrations described in `SETUP.md`.

> **In one line.** This is record-keeping and calculation software for climbing
> results. It is **not** a guide, a challenge, or an encouragement to take part in
> any physical activity. Climbing, hiking and mountaineering are dangerous and you
> act entirely at your own risk. It is provided **"as is"**, with no warranty and
> no liability for errors in its data or calculations, or for any outcome.
> Full text: [Safety, accuracy and liability disclaimer](#safety-accuracy-and-liability-disclaimer)
> and the [terms of service](data/legal/terms-of-service.md) template §3, §4 and §11.

> **Naming and independence.** "Baggers Without Borders" and "BWB" are the names of
> the community this software serves, not names belonging to its author. Those
> names, and the community's logos and visual identity, belong to the Baggers
> Without Borders organisation, and this is an independent, unofficial project:
> it is not affiliated with, authorised by, or endorsed by that organisation.
> Full text: [Naming, trade marks and independence](#naming-trade-marks-and-independence).

> **Handover release.** This project is published so that somebody else can carry
> it on. It installs, builds and runs, but it is **not ready for real users yet**:
> read [Taking this on](#taking-this-on) and [`SECURITY.md`](SECURITY.md) before
> putting it online.

---

## What problem this solves

Before this application, the community's tables were compiled and maintained by
hand: spreadsheets, email threads, and a great deal of volunteer time. That does
not scale, and it makes errors hard to find and correct. BWB replaces it with a
single auditable pipeline:

- **Lifetime totals are computed, not typed.** Members enter only what they climbed
  in a given year; cumulative totals and ratios are derived consistently, year
  after year.
- **Qualification is a rule, not an opinion.** Every Hall of Fame has explicit
  thresholds per year, and the tables show exactly which requirement a member has
  or has not met.
- **Corrections have a route.** Members can flag bad data, and the helpdesk and
  change-request systems track it through to a fix.
- **Data arrives in bulk when it has to.** A whole year of member results can be
  validated and imported from one file, with a preview of every change before it
  is applied.
- **Consent is evidenced.** Required consents and their supporting documents are
  recorded per member, not implied.
- **Funding can be shown openly.** The application can display donations and running
  costs to members, so it is clear what the money pays for.
- **Nothing happens invisibly.** Administrative actions are written to an audit
  log.

## Peak-bagging concepts in one minute

You do not need to be a peak-bagger to work on this code, but these terms appear
throughout the data model and UI.

| Term                            | Meaning                                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Peak-bagging / hill-bagging** | Deliberately climbing lists of summits, rather than a single objective.                                                                                                                              |
| **Topographic prominence**      | The height of a summit above the lowest contour that encircles it and no higher summit. BWB focuses on prominence-based lists.                                                                       |
| **Hall of Fame (HoF)**          | A competition category defined by a lifetime total of peaks. Seeded codes are `P30`, `P100`, `P300`, `P500`, `P600`, `P1000`, `P1500`, `P2000`, plus the `P-TOP50`, `P-TOP100` and `P-INDEX` tables. |
| **Total peaks**                 | A member's cumulative count of qualifying summits across all active years.                                                                                                                           |
| **Foreign peaks**               | Qualifying summits outside the member's home country.                                                                                                                                                |
| **FPR**                         | Foreign Peak Ratio — foreign peaks ÷ total peaks, expressed as a percentage.                                                                                                                         |
| **Qualification**               | Meeting _every_ enabled threshold for a HoF-year: minimum total peaks, minimum foreign peaks, minimum FPR, minimum age.                                                                              |
| **LCE**                         | Large Country Exception. More lenient thresholds for members resident in countries whose geography makes "foreign" peaks unusually hard to reach.                                                    |
| **Cumulative totals**           | `totalPeaks` and `foreignPeaks` are running sums by year order. The seeded **BASELINE** year carries peaks climbed before systematic tracking began (pre-2019).                                      |
| **Award tiers**                 | Six bands per HoF-year — Bronze, Silver, Gold, Emerald, Sapphire, Diamond — based on total peaks.                                                                                                    |
| **Progress Register**           | Members who took part but did not qualify, shown with per-requirement progress rather than omitted.                                                                                                  |
| **Meister**                     | The volunteer who curates a Hall of Fame and writes its annual report.                                                                                                                               |
| **P-Index League**              | A BWB ranking concept; the standings live in the Hall of Fame tables under the `P-INDEX` code.                                                                                                       |
| **Badges**                      | Derived markers such as New Entrant, New Award, LCE, Junior, National, Retired, Deceased and Missing Data.                                                                                           |

The **community** is deliberately broad: it includes mountaineers, people who walk
their home hills regularly or occasionally, and the researchers and list-writers
who document the world's uplands.

## What the application does

- **Member records** — profiles, demographics, external platform IDs, interests,
  participation per Hall of Fame and per year, and privacy consents.
- **Hall of Fame data** — per-year entries, cumulative totals, per-year thresholds,
  award tiers, and bulk import of a year's results from a validated file.
- **Tables and reports** — public and member-facing HoF tables with qualification,
  ranking, the Progress Register, Meister reports, and a public P-Index channel.
- **Journal and content** — a full editorial workflow with drafts, review,
  publishing, issues, photos, authors and four public channels.
- **Helpdesk** — member support submissions, routed to the relevant Meister,
  worked through a threaded timeline with attachments.
- **Change requests** — an internal tracker with ticket IDs, voting, attachments
  and optional git-commit sync.
- **Documents and files** — an admin file manager, plus uploads for consents,
  journal photos, sponsor logos and ticket attachments.
- **Commerce and funding** — sponsor management and Stripe-based donations, with a
  public funding bar that can show collected against running costs.
- **Operations** — audit logs, encrypted backups, a test-results dashboard, and a
  health endpoint.

## How it is built

- **Rendering.** Next.js App Router with React Server Components by default and
  client components where interaction requires them. Routing is filesystem-based;
  there is no route registry.
- **Data.** One SQLite file through Prisma, single-writer by nature. Schema changes
  ship as committed migrations; production applies them with `prisma migrate deploy`.
  Reference data (countries, regions, Halls of Fame, years, tiers) is seeded.
- **Authorization.** `middleware.ts` gates a fixed list of path prefixes; routes
  guard themselves in-route. The distinction between _authentication_ and
  _authorization_ matters here and is documented in `SECURITY.md`.
- **Accounts.** NextAuth credentials (email or username), bcrypt-hashed passwords,
  mandatory email verification, Turnstile bot protection, database-backed rate
  limiting, and an audit log that hashes client IP addresses.
- **Files.** Uploads live outside `public/` and are served through an API route;
  images are validated by magic bytes and re-encoded. Backups are encrypted
  archives.
- **Quality.** TypeScript in strict mode, an ESLint flat config with accessibility
  rules under a ratcheting warning budget, Jest suites across unit, API, contract,
  end-to-end, integration, component, accessibility and security layers, a
  credential scanner that runs on every commit, and Conventional Commits driving
  automatic semantic versioning.
- **Delivery.** A multi-stage Docker image, deployed by `scripts/deployment/deploy.sh`,
  behind a reverse proxy that terminates TLS and sets client IP headers. PM2 is a
  supported alternative.
- **Honesty about limits.** Known gaps are documented rather than hidden — see the
  known-gaps sections of `FEATURES.md`, `IMPLEMENTATION.md` and `SECURITY.md`.

## Getting started

Requires **Node.js 24** (`>=24 <25`) and npm 10+. There is no database server.

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
# Set NEXTAUTH_SECRET (openssl rand -base64 32), NEXTAUTH_URL, DATABASE_URL,
# and Cloudflare's Turnstile test keys (below).

npm run db:generate     # generate the Prisma client
npm run db:migrate      # create the SQLite file and apply migrations
npm run db:seed         # reference data + synthetic demo accounts

npm run dev             # http://localhost:1345
```

Two things that surprise people on a fresh clone:

- **Turnstile test keys are required locally.** Only the login form skips CAPTCHA
  in development; registration and password reset always verify. Add
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` and
  `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`.
- **The demo password is printed once**, for `demo-admin`, `demo-user` and
  `demo-member`. Set `DEMO_USER_PASSWORD` to choose your own. Demo accounts are
  skipped when `NODE_ENV=production`.

Common commands:

| Command                                                   | Purpose                                        |
| --------------------------------------------------------- | ---------------------------------------------- |
| `npm run dev` / `npm run build` + `npm start`             | Development and production servers (port 1345) |
| `npm run type-check`, `npm run lint`, `npm run check:all` | Static checks                                  |
| `npm test`, `npm run test:a11y`, `npm run test:coverage`  | Test suites                                    |
| `npm run db:migrate`, `db:seed`, `db:studio`              | Database work                                  |
| `npm run security:secrets`, `npm run sbom`                | Credential scan, software bill of materials    |
| `npm run deploy`                                          | Deploy the Docker image to a server            |

## Taking this on

This repository is a **handover release**. The project is published in full so that anyone can continue it. It is not being handed to any particular person or group, it is not actively maintained, and no instance of it is running today.

**It is not ready for real users.** Before anyone signs up for real:

- Fix the known defects listed in [`SECURITY.md`](SECURITY.md). They include the gaps described in its _Authorization_ section and the uploads route, which performs no authorization. Then work through its hardening checklist.
- Work through the pre-deployment checklist in §6.1 of [`SETUP.md`](SETUP.md).
- Review the remaining known defects in §16 of [`IMPLEMENTATION.md`](IMPLEMENTATION.md) and the gaps in §9 of [`FEATURES.md`](FEATURES.md).

**The test suite is partially red, and that is documented.** At the time of this release, 74 of 4,312 automated tests fail. The author's review traced these failures to assertions left behind by later design changes, not to broken behaviour. §7 of [`CONTRIBUTING.md`](CONTRIBUTING.md) gives the breakdown and suggests where to start. Run the suite in your own copy before relying on these figures.

**In this release:** the whole source, the database schema and its migrations, reference data and synthetic demo accounts, the written guides, deployment configuration, the automated tests and code checks, and the licence with its additional terms.

**Not in this release:** any member data; any account, credential or service key; any hosting or domain; and any right to the Baggers Without Borders name (see [Naming, trade marks and independence](#naming-trade-marks-and-independence)). Credentials used by the original deployment have been revoked. Create your own for every service.

**To continue the project, fork it and work in your own copy.** The author is not reviewing or merging changes to this repository and cannot promise to be available, so plan on working from the guides. If several people want to continue the project, they are encouraged to get in touch with each other and work together.

**Running your own version.** You operate your own independent instance, and you are responsible for its data, its content and any terms you present to your users. Give your version its own name unless the Baggers Without Borders organisation has given you permission to use its name, and make clear to your users that you run it independently.

**Licence obligations in brief.** If you share the project, or run a changed version as a website or online service, you must offer its source code under AGPL-3.0-only (section 13 covers network use). You must also keep the `LICENSE` and `NOTICE` files and all attribution notices, and mark your changes. [`NOTICE`](NOTICE) sets out the additional terms. [`SETUP.md`](SETUP.md) covers setting up your own copy.

**Found personal data or a working credential?** Do not use or share it. Report it privately using GitHub's "Report a vulnerability" button on the repository's Security tab, and do not include the data or credential itself in your report.

**Why it is open source.** So that the project stops depending on one person: anyone willing to carry it on can pick it up. That is also why the licence is the AGPL rather than a permissive one. Anyone who shares a version, or runs a changed version as a service, has to offer its source, so improvements that are shared or put online stay available to the community and to everyone who comes after.

## Documentation

Start with `SETUP.md`; the rest go deeper.

| Document                                   | Read it for                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`HANDOVER.md`](HANDOVER.md)               | **The handover statement** of 17 September 2026 — a historical record of why the project was released, what it includes and what still needs work |
| [`SETUP.md`](SETUP.md)                     | **Start here.** Install, configure, optional integrations, deployment, operations, troubleshooting                                                |
| [`FEATURES.md`](FEATURES.md)               | Every screen and capability, grouped by audience, with UX, error handling and known gaps                                                          |
| [`IMPLEMENTATION.md`](IMPLEMENTATION.md)   | Architecture, data model, API surface, external integrations, deployment and known defects                                                        |
| [`SECURITY.md`](SECURITY.md)               | Threat boundaries, the authorization model, accepted risks, and how to report a vulnerability                                                     |
| [`CONTRIBUTING.md`](CONTRIBUTING.md)       | Code map, development workflow, adding routes and pages, testing and pull requests                                                                |
| [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | The behaviour expected in project spaces                                                                                                          |
| [`NOTICE`](NOTICE)                         | Licensing, additional terms, and third-party attributions                                                                                         |
| [`LICENSE`](LICENSE)                       | GNU AGPL-3.0-only, in full                                                                                                                        |
| [`.env.example`](.env.example)             | Every supported environment variable, documented inline                                                                                           |

## Acknowledgements

This platform exists because people gave their time and their money to it, and
that deserves to be said plainly.

**Thank you to the members of Baggers Without Borders** — those who recorded and
submitted their climbing histories, answered questions, and patiently corrected
the record when something was wrong. A lifetime table is only as good as the
people who fill it in.

**Thank you to the Hall of Fame Meisters and table maintainers**, who compile,
check and explain the results season after season, and who write the reports the
community reads. Their work is the reason these numbers mean anything.

**Thank you to the donors and sponsors**, whose contributions covered hosting,
development and the running costs of the platform while it operated. It is not
running today; publishing the project in full is how the author hopes that support
can still come to something.

**Thank you to the testers, translators, list-writers and researchers** who
improve the data and the documentation without appearing in any table.

The project was designed and built by **Deividas Valaitis**, and is published for
someone else to carry on. Formal copyright and attribution notices are recorded in
[`NOTICE`](NOTICE).

If you spot an error or want to improve it, fork the project and continue in your
own copy — [Taking this on](#taking-this-on) explains why, and
[`CONTRIBUTING.md`](CONTRIBUTING.md) covers the workflow.

## Safety, accuracy and liability disclaimer

**This software is a record-keeping and calculation tool. It is not a guide to
any physical activity, and it is not safety advice.**

It stores climbing records that members submit and computes totals, ratios,
rankings and Hall of Fame qualification from them. It has nothing to do with the
physical activity it records: nothing in it tells you where, whether, when or how
to climb or hike, assesses your ability or the conditions, or recommends any
route, peak or objective. The author does not encourage, invite or expect anyone
to take part in climbing, hiking, mountaineering or any other physical activity,
and using this software is not a reason to do so. Anyone who takes part does so
independently of this software and at their own risk.

**The data and the results may be wrong.** Input is largely member-submitted,
administrators enter and import records by hand, and the figures shown are derived
from that input by software. Neither the input nor the output is checked against
any official or independent source, so totals, ratios, rankings, qualification
results, award tiers and published tables may contain errors, omissions or
inaccuracies — present now or introduced later. Treat this software as a
convenience, not as a record of authority: verify anything you intend to rely on,
and where it disagrees with your own records or an official source, assume the
software is wrong. No result, ranking, award or qualification it shows creates any
entitlement.

**It is provided "as is", without warranty of any kind.** The author gives no
assurance that the software, its data or its calculations are free of errors,
whether existing now or appearing later, and no assurance that any defect will be
fixed. To the fullest extent permitted by law, the author accepts no
responsibility or liability for any error, omission or inaccuracy, or for any
decision, action, loss, expectation or other outcome connected with using this
software. Any instance you deploy should state the same thing in its own terms of
service — the template in
[`data/legal/terms-of-service.md`](data/legal/terms-of-service.md) §3, §4 and §11
does — and the licence reinforces it: AGPL-3.0 §15 (no warranty) and §16 (no
liability, expressly including "data being rendered inaccurate").

If you deploy this software you operate your own instance, and you are
responsible for its data, its content and any terms you present to your users.

## Naming, trade marks and independence

"Baggers Without Borders" and "BWB" are the names of the community this software
serves. Those names, together with the community's logos and visual identity,
belong to the Baggers Without Borders organisation, **not** to the author of this
software. They appear in this repository only to say what the software is for and
who it serves — the way any independent tool names the community it was written
for.

This software is an **independent, unofficial project**. It was written by
**Deividas Valaitis**, an individual acting in a voluntary and
non-commercial capacity. It is not affiliated with, authorised by, sponsored by, or
endorsed by the Baggers Without Borders organisation or any of its officers, and it
is not an official platform, product or publication of that organisation. Nothing
in this repository, and nothing in a deployed instance of it, is a statement by or
on behalf of the organisation. If you deploy it, you are the operator of your own
independent instance, not the organisation.

The author claims **no trademark or trade-name rights** in "Baggers Without
Borders", "BWB", or any associated logo or visual identity, and grants none. The
name reservation in [`NOTICE`](NOTICE) §7(e) records the organisation's names; it
is not the author's claim. The names the author does use for their own work —
"Solutionocean" and "solutionocean.com" — are unregistered trade names asserted as
such.

## Licence

Copyright (C) 2025–2026 **Deividas Valaitis**.

Licensed under the **GNU Affero General Public License, version 3 only**
(`AGPL-3.0-only`). See [`LICENSE`](LICENSE).

Because this is a network application, AGPL section 13 applies: if you run a
modified version and let others interact with it over a network, you must offer
them the corresponding source.

Additional terms under AGPL section 7 (attribution, origin non-misrepresentation
and trademark reservation) and all third-party attributions — including the
CC BY-SA 2.5 hero photograph, which is **not** covered by the AGPL — are recorded
in [`NOTICE`](NOTICE).
