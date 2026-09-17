# Documentation Index

Where to find what. The **canonical handover set** is at the repository root; the
rest of `docs/` holds subsystem references and historical material.

If you only read five documents, read these, in order:
[`README.md`](../README.md) → [`SETUP.md`](../SETUP.md) →
[`IMPLEMENTATION.md`](../IMPLEMENTATION.md) → [`FEATURES.md`](../FEATURES.md) →
[`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## Canonical handover set (repository root)

| Document                                        | Read it for                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| [`HANDOVER.md`](../HANDOVER.md)                 | The handover statement of 17 September 2026 — a historical record          |
| [`README.md`](../README.md)                     | Orientation, requirements, quick start                                     |
| [`SETUP.md`](../SETUP.md)                       | Install, configure, run, deploy, operate                                   |
| [`FEATURES.md`](../FEATURES.md)                 | Every screen and capability, UX and error handling, **41 known gaps (§9)** |
| [`IMPLEMENTATION.md`](../IMPLEMENTATION.md)     | Architecture, data model, API surface, **known defects (§16)**             |
| [`SECURITY.md`](../SECURITY.md)                 | Security model, threat boundaries, accepted risks, reporting               |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md)         | Code map, workflow, adding routes/pages, testing, pull requests            |
| [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md)   | Expected behaviour in project spaces                                       |
| [`NOTICE`](../NOTICE) / [`LICENSE`](../LICENSE) | AGPL-3.0-only licensing, naming and independence, third-party attributions |

**Quick lookup:** [QUICK_START.md](QUICK_START.md) for the fastest local setup,
[QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands, paths and concepts on one page.

---

## Start by role

| I am…                   | Start with                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **New to the project**  | [README](../README.md) → [SETUP](../SETUP.md) → [QUICK_START](QUICK_START.md)                                                   |
| **A developer**         | [CONTRIBUTING](../CONTRIBUTING.md) → [IMPLEMENTATION](../IMPLEMENTATION.md)                                                     |
| **A DevOps / operator** | [SETUP](../SETUP.md) §6 → [DEPLOYMENT](DEPLOYMENT.md) → [INTEGRATIONS](INTEGRATIONS.md) → [TROUBLESHOOTING](TROUBLESHOOTING.md) |
| **Debugging something** | [TROUBLESHOOTING](TROUBLESHOOTING.md) → [SETUP](../SETUP.md) §8 → `IMPLEMENTATION.md` §16                                       |
| **An admin / operator** | [HOF_SYSTEM](HOF_SYSTEM.md) → [USER_CONSENT_MANAGEMENT](USER_CONSENT_MANAGEMENT.md) → [HELPDESK_SYSTEM](HELPDESK_SYSTEM.md)     |
| **Auditing security**   | [SECURITY](../SECURITY.md) → [IMPLEMENTATION](../IMPLEMENTATION.md) §16 → [FEATURES](../FEATURES.md) §9                         |

---

## Operations

| Document                                           | Contents                                                                        |
| -------------------------------------------------- | ------------------------------------------------------------------------------- |
| [`SETUP.md`](../SETUP.md)                          | The operational guide: install, configuration, deployment, scheduled jobs       |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md)           | Symptom-by-symptom diagnosis, including known-defect triage                     |
| [INTEGRATIONS.md](INTEGRATIONS.md)                 | Connecting Stripe, Brevo, Turnstile, OpenAI and GitHub, with verification steps |
| [DEPLOYMENT.md](DEPLOYMENT.md)                     | Production deployment detail (Docker, nginx, rollback)                          |
| [DATABASE_SEEDING.md](DATABASE_SEEDING.md)         | Seeding and reference data                                                      |
| [AUTOMATIC_VERSIONING.md](AUTOMATIC_VERSIONING.md) | Commit-driven semantic versioning                                               |
| [API_REFERENCE.md](API_REFERENCE.md)               | Per-endpoint request/response reference                                         |

---

## Domain: Hall of Fame and P-Index

| Document                                                     | Contents                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| [HOF_SYSTEM.md](HOF_SYSTEM.md)                               | Consolidated Hall of Fame concepts and admin guide                  |
| [QUALIFICATION_RULES.md](QUALIFICATION_RULES.md)             | Qualification predicates, LCE and Progress Register exclusion rules |
| [TOTAL_PEAKS_RECALCULATION.md](TOTAL_PEAKS_RECALCULATION.md) | Cumulative totals and the BASELINE year                             |

---

## Features and subsystems

| Area            | Document                                                       |
| --------------- | -------------------------------------------------------------- |
| Journal         | [JOURNAL_SYSTEM.md](JOURNAL_SYSTEM.md)                         |
| Consent         | [USER_CONSENT_MANAGEMENT.md](USER_CONSENT_MANAGEMENT.md)       |
| Helpdesk        | [HELPDESK_SYSTEM.md](HELPDESK_SYSTEM.md)                       |
| Documents       | [DOCUMENT_MANAGEMENT.md](DOCUMENT_MANAGEMENT.md)               |
| Change requests | [CHANGE_REQUEST_ATTACHMENTS.md](CHANGE_REQUEST_ATTACHMENTS.md) |
| Donations       | [STRIPE_DONATIONS.md](STRIPE_DONATIONS.md)                     |
| Bot protection  | [TURNSTILE_QUICK_REFERENCE.md](TURNSTILE_QUICK_REFERENCE.md)   |
| Geography       | [COUNTRY_REGION_SELECTORS.md](COUNTRY_REGION_SELECTORS.md)     |
| Icons           | [ICONS_GUIDE.md](ICONS_GUIDE.md)                               |
| Components      | [COMPONENT_REFERENCE.md](COMPONENT_REFERENCE.md)               |

---

## Engineering practice

| Topic        | Document                                                                       |
| ------------ | ------------------------------------------------------------------------------ |
| Testing      | [TESTING.md](TESTING.md) (see also `CONTRIBUTING.md` §7 for the current state) |
| Writing copy | [COPY_GUIDELINES.md](COPY_GUIDELINES.md)                                       |

---

## Agents and tooling

> The AI-agent workflow surface (`docs/agents-and-skills/`) and
> `.github/copilot-instructions.md` are internal working material and are not
> published in the release tree. Note that comments claiming the middleware
> "ensures ADMIN" must not be trusted — see `SECURITY.md`.

---

## Superseded material

Superseded and point-in-time documents — replaced implementations, one-off
completion reports, dated hand-maintained mirrors of the schema, and the removed
data-import pipeline — are retained in the original development repository but are
**not part of the released tree**. `scripts/publish/public-exclude.txt` lists them,
naming the canonical document that supersedes each one; anything genuinely
unique was folded into that canonical document before it was dropped.

---

## Internal (not published)

`docs/internal/` holds historical status reports, audits, migration summaries and
legacy notes. It is excluded from the public repository build by
`scripts/publish/public-exclude.txt` and is **not** part of the released tree.

---

## Contributing to documentation

1. Put a new document in the section above that fits it, and link it from this index.
2. Prefer updating a canonical document over adding a parallel one.
3. Cross-link related documents, and use relative links so they work on disk.
4. When behaviour changes, update the affected docs **in the same commit** —
   stale documentation is treated as a defect in this repository.
5. When a document is superseded, fold anything still useful into the canonical
   document, delete it from this index, and add it to
   `scripts/publish/public-exclude.txt` so it stops shipping.
