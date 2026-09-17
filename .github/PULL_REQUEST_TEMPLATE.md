# Pull request

> **This repository is a handover release and does not accept pull requests** — see
> `CONTRIBUTING.md` §10. Pull requests to this repository are not reviewed. If you are working in a fork,
> treat the checklist below as a reasonable bar for changes in your own copy.

## Summary

<!-- What does this change and why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor (no behaviour change)
- [ ] Documentation
- [ ] Build / tooling / CI
- [ ] Database migration

## Checklist

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes (no new warnings)
- [ ] `npm test` passes
- [ ] `npm run security:secrets` passes
- [ ] No real member data, email addresses, or credentials are added anywhere
      (code, tests, fixtures, docs, commit messages)
- [ ] New API routes are either matched by `middleware.ts` or guarded in-route
      (`__tests__/security/api-route-auth-coverage.test.ts` enforces this)
- [ ] Documentation updated if behaviour or setup changed

## Database changes

<!-- If this includes a migration, describe it and note whether it is additive
     and reversible. Delete this section if not applicable. -->

## Testing performed

<!-- How did you verify this? Which suites or manual steps? -->

## Screenshots

<!-- For UI changes, before/after. Delete if not applicable. -->
