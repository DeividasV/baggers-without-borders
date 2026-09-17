# BWB Quick Start

This is the shortest reliable path to a working local environment.

## Prerequisites

- Node.js 24.x
- npm 10.x or 11.x
- Git

The repository enforces Node 24. Prefer the project wrapper scripts instead of arbitrary local aliases.

## Fast Setup

```bash
npm ci --legacy-peer-deps
cp .env.example .env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The app runs on `http://localhost:1345`.

## Preferred Daily Workflow

### Core Commands

```bash
# Development
npm run dev
npm run lint
npm run type-check
npm run build

# Formatting and staged validation
npm run format
npm run format:check
npm run lint:staged

# Tests
npm test
npm run test:unit
npm run test:api
npm run test:integration
npm run test:coverage

# Database
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Commit Workflow

- Use `npm run commit` when you want the interactive commit helper.
- Plain `git commit` is also supported, but commit hooks now enforce staged file validation and conventional commit message structure.
- The canonical project rules live in the root docs (`README.md`, `SETUP.md`, `IMPLEMENTATION.md`, `FEATURES.md`, `SECURITY.md`). Those documents are the source of truth: comments claiming "middleware ensures ADMIN" must not be trusted.

## Key References

- `README.md` for project overview
- `CONTRIBUTING.md` for contribution workflow
- `docs/TESTING.md` for test suite details
- `docs/INDEX.md` for the full documentation index
