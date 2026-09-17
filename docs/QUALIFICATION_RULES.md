# Hall of Fame Qualification Rules

## Overview

This document explains how members qualify for Hall of Fame (HOF) tables. The qualification system is implemented in `/app/api/hof-tables/route.ts`.

## System Architecture

### How It Works

1. **Load Member Data**: Fetch all members who have HOF entries for the selected Year and HOF
2. **Calculate Statistics**: Compute total peaks, foreign peaks, and Foreign Peaks Ratio (FPR)
3. **Apply Qualification Rules**: Check each member against 4 qualification rules (in order)
4. **Filter by Status**: Only include ACTIVE and DECEASED members
5. **Filter by Participation**: Respect HOF and Year participation settings
6. **Return Results**: Return qualified members with stats and achievement badges

## Qualification Rules

Members must pass **ALL** rules to qualify for a HOF table. Rules are checked in this order:

### Rule 1: Minimum Age Requirement

**Location**: `meetsMinimumAgeRequirement()` function

**Purpose**: Ensures members are at least a specified age in the selected year

**Configuration**: `HofYearConfig.minimumAge` (default: 0 = no requirement)

**Logic**:

- If `minimumAge` is 0, all members pass (no age requirement)
- If `minimumAge` > 0:
  - Member **MUST** have a birth year to qualify
  - Member's age = `selectedYear - birthYear`
  - Member must be at least `minimumAge` years old

**Examples**:

- Config: `minimumAge = 18`, Year: `2025`, Birth Year: `2000`
  - Age = 2025 - 2000 = 25
  - Result: ✅ PASS (25 >= 18)
- Config: `minimumAge = 18`, Year: `2025`, Birth Year: `2010`
  - Age = 2025 - 2010 = 15
  - Result: ❌ FAIL (15 < 18)
- Config: `minimumAge = 18`, Year: `2025`, Birth Year: `null`
  - Result: ❌ FAIL (no birth year when requirement exists)

### Rule 2: Minimum Total Peaks Requirement

**Location**: `meetsMinimumPeaksRequirement()` function

**Purpose**: Ensures members have climbed at least a specified number of peaks

**Configuration**: `HofYearConfig.minPeaks` (default: 0 = no requirement)

**Logic**:

- If `minPeaks` is 0, all members pass (no peaks requirement)
- Member's `totalPeaks` must be >= `minPeaks`

**Examples**:

- Config: `minPeaks = 1200`, Total Peaks: `1500`
  - Result: ✅ PASS (1500 >= 1200)
- Config: `minPeaks = 1200`, Total Peaks: `900`
  - Result: ❌ FAIL (900 < 1200)

### Rule 3: Minimum Foreign Peaks Requirement

**Location**: `meetsMinimumForeignPeaksRequirement()` function

**Purpose**: Ensures members have climbed peaks outside their home country

**Configuration**: `HofYearConfig.minForeignPeaks` (default: 0 = no requirement)

**Logic**:

- If `minForeignPeaks` is 0, all members pass (no foreign peaks requirement)
- Member's `foreignPeaks` must be >= `minForeignPeaks`

**Examples**:

- Config: `minForeignPeaks = 20`, Foreign Peaks: `45`
  - Result: ✅ PASS (45 >= 20)
- Config: `minForeignPeaks = 20`, Foreign Peaks: `15`
  - Result: ❌ FAIL (15 < 20)

### Rule 4: Minimum Foreign Peaks Ratio (FPR) Requirement

**Location**: `meetsMinimumFprRequirement()` function

**Purpose**: Ensures members have a minimum percentage of foreign peaks

**Configuration**:

- `HofYearConfig.minFpr` (default: 0 = no requirement)
- `HofYearConfig.lceEnabled` (enable Large Country Exception)
- `HofYearConfig.lceMinFpr` (lower threshold for LCE countries)

**Formula**: `FPR = (foreignPeaks / totalPeaks) × 100`

**Logic**:

- If `minFpr` is 0, all members pass (no FPR requirement)
- Standard threshold: Member's FPR must be >= `minFpr`
- **Large Country Exception (LCE)**: Special lower threshold for members from large countries
  - Only applies if `lceEnabled` is true
  - Member must be from an LCE-eligible country
  - Member's FPR must be:
    - Below standard `minFpr`, AND
    - Greater than or equal to `lceMinFpr`
  - If LCE applies, member gets LCE badge in UI

**Country Determination** (priority order):

1. Year participation country override (`UserYearParticipation.countryId`)
2. Residence country (`User.residenceCountryId`)
3. Birth country (`User.birthCountryId`)

**Examples**:

_Example 1: Standard FPR (no LCE)_

- Config: `minFpr = 10%`
- Stats: Total Peaks: `1000`, Foreign Peaks: `150`
- FPR = (150 / 1000) × 100 = 15%
- Result: ✅ PASS (15% >= 10%)

_Example 2: Failed Standard FPR_

- Config: `minFpr = 10%`
- Stats: Total Peaks: `1000`, Foreign Peaks: `80`
- FPR = (80 / 1000) × 100 = 8%
- Result: ❌ FAIL (8% < 10%)

_Example 3: LCE Applied_

- Config: `minFpr = 10%`, `lceMinFpr = 5%`, `lceEnabled = true`
- Member from LCE country (e.g., USA, China)
- Stats: Total Peaks: `1000`, Foreign Peaks: `70`
- FPR = (70 / 1000) × 100 = 7%
- Result: ✅ PASS with LCE (7% >= 5%, displays LCE badge)

_Example 4: LCE Not Applied (Already Meets Standard)_

- Config: `minFpr = 10%`, `lceMinFpr = 5%`, `lceEnabled = true`
- Member from LCE country
- Stats: Total Peaks: `1000`, Foreign Peaks: `150`
- FPR = (150 / 1000) × 100 = 15%
- Result: ✅ PASS without LCE (15% >= 10%, no LCE badge)

## Additional Filters

After qualification rules, additional filters are applied:

### Member Status Filter

**Only includes**:

- `ACTIVE` members
- `DECEASED` members

**Excludes**:

- `NEW` members (not yet approved)
- `INACTIVE` members (suspended/removed)
- `ARCHIVED` members (deleted)

### Participation Filters

**HOF Participation** (`UserHofParticipation`):

- If `enabled = false`, member is excluded from that specific HOF

**Year Participation** (`UserYearParticipation`):

- If `enabled = false`, member is excluded from that specific year
- If `dataNotProvided = true`, member is included but marked with "No Data" badge

## Member Badges

Badges are displayed to indicate special statuses:

| Badge                | Meaning                              | Logic                                          |
| -------------------- | ------------------------------------ | ---------------------------------------------- |
| **You**              | Current logged-in user               | `member.id === session.user.id`                |
| **New Entrant**      | First year meeting minimum peaks     | First year where `totalPeaks >= minPeaks`      |
| **New Award**        | First time achieving this award tier | First year achieving this tier level           |
| **LCE**              | Large Country Exception applied      | FPR below standard but meets LCE threshold     |
| **Retired in XXXX**  | Retired from peak-bagging            | `member.retiredYear` is set                    |
| **Deceased in XXXX** | Member has passed away               | `member.deceasedYear` is set                   |
| **No Data in XXXX**  | No data submitted this year          | `UserYearParticipation.dataNotProvided = true` |

## Configuration Reference

### Database Tables

- `HofYearConfig`: Stores qualification criteria per HOF/Year combination
- `CountryLceConfig`: Specifies which countries are eligible for LCE
- `UserHofParticipation`: Member's participation flag per HOF
- `UserYearParticipation`: Member's participation flag per Year
- `AwardTier`: Award levels based on total peaks

### Example Configuration (P100-2025)

```typescript
{
  minPeaks: 1200,           // Must have at least 1200 total peaks
  minForeignPeaks: 20,      // Must have at least 20 foreign peaks
  minFpr: 10,               // Must have at least 10% FPR
  minimumAge: 18,           // Must be at least 18 years old
  lceEnabled: true,         // Large Country Exception enabled
  lceMinFpr: 0              // LCE countries can have 0% FPR minimum
}
```

## Code Organization

### File Structure

```
app/api/hof-tables/route.ts
├── Type Definitions
│   ├── MemberStats
│   ├── HofYearConfigType
│   └── YearParticipationType
├── Qualification Rule Functions (pure functions)
│   ├── meetsMinimumAgeRequirement()
│   ├── meetsMinimumPeaksRequirement()
│   ├── meetsMinimumForeignPeaksRequirement()
│   └── meetsMinimumFprRequirement()
└── GET Endpoint
    ├── Load data (years, HOFs, members, entries, etc.)
    ├── Calculate member statistics
    ├── Apply qualification rules
    ├── Filter by status and participation
    └── Return results
```

### Function Characteristics

All qualification rule functions are:

- **Pure**: No side effects (except FPR which sets LCE display flags)
- **Stateless**: Don't modify external state
- **Self-documenting**: Clear names indicating what they check
- **Well-typed**: TypeScript types for all parameters
- **Thoroughly documented**: JSDoc comments with examples

## Progress Register Exclusion Rules

**New in v0.656.0**

Members who don't qualify for the main HOF table appear in the Progress Register, showing their progress toward qualification. However, certain member categories can be excluded from the Progress Register based on HOF-specific settings.

### Configuration Fields

Each Hall of Fame can configure these exclusion filters independently:

| Field                             | Type    | Default | Description                                        |
| --------------------------------- | ------- | ------- | -------------------------------------------------- |
| `progressRegisterExcludeRetired`  | Boolean | `true`  | Exclude members with a `retiredYear` set           |
| `progressRegisterExcludeDeceased` | Boolean | `true`  | Exclude members with a `deceasedYear` set          |
| `progressRegisterExcludeInactive` | Boolean | `true`  | Exclude members with no recent activity            |
| `progressRegisterInactivityYears` | Integer | `2`     | Years of inactivity before exclusion (range: 1-10) |

### Exclusion Logic

**Order of checks** (optimized for performance):

1. **Retired Check** (fast): If `progressRegisterExcludeRetired` is enabled and member has `retiredYear` set → exclude
2. **Deceased Check** (fast): If `progressRegisterExcludeDeceased` is enabled and member has `deceasedYear` set → exclude
3. **Inactivity Check** (slower): If `progressRegisterExcludeInactive` is enabled:
   - Find all HOF entries for this member in this specific HOF
   - If no entries exist → exclude (never participated)
   - Otherwise, find the most recent year with entries
   - If `mostRecentYear < (currentYear - inactivityYears)` → exclude

**Example**: Progress Register for 2025 with 2-year inactivity threshold

- Member A: Last entry in 2024 → **Included** (within 2 years)
- Member B: Last entry in 2023 → **Included** (exactly 2 years ago)
- Member C: Last entry in 2022 → **Excluded** (more than 2 years ago)
- Member D: No entries ever → **Excluded** (no participation)

### Business Rules

1. **Per-HOF Configuration**: Each HOF can have different settings. A member excluded from P100 Progress Register might still appear in P300 Progress Register.

2. **Activity is HOF-Specific**: Inactivity checks only look at entries within the specific HOF. A member active in P100 but inactive in P300 will only be excluded from P300's Progress Register.

3. **Qualified Members Exempt**: These filters **only** apply to Progress Register. Qualified members always appear in the main HOF table regardless of retirement, deceased status, or inactivity.

4. **Minimum Progress Register Requirement**: Members must have at least 2 total peaks AND 2 foreign peaks to appear in Progress Register, regardless of exclusion settings.

5. **Default Behavior**: By default, all three filters are enabled with a 2-year inactivity threshold. This reduces clutter while preserving recent active climbers' progress.

### Admin UI

Admins can configure these settings per HOF at `/admin/hofs/[id]/edit` in the "Progress Register Filters" section with toggle switches and a number input for inactivity years.

The legend on `/hof-tables` displays active exclusions for transparency, e.g.:

> "The following members are excluded from the Progress Register for this HOF: retired members, deceased members, and inactive members (no activity in last 2 years in this HOF)."

## Testing

The predicates in `src/lib/hofQualificationRules.ts` are covered by:

- `__tests__/unit/hofQualificationRules.test.ts` — unit tests per predicate
- `__tests__/e2e/flows/hof-qualification.e2e.test.ts` — end-to-end qualification flow

```bash
npx jest __tests__/unit/hofQualificationRules.test.ts
npx jest --config=jest.e2e.config.js __tests__/e2e/flows/hof-qualification.e2e.test.ts
```

> The standalone script `scripts/test/verify-qualification-rules.js` has been
> removed. There is no CLI that reports qualification pass/fail statistics against
> live data; use the test suites above, or query the tables in Prisma Studio.

## Modification Guide

### Adding a New Qualification Rule

1. **Define the rule function**:

   ```typescript
   function meetsNewRequirement(stats: MemberStats, config: { newField: number }): boolean {
     if (config.newField === 0) {
       return true; // No requirement
     }
     return stats.someValue >= config.newField;
   }
   ```

2. **Add database field**:
   - Update `prisma/schema.prisma`
   - Create migration
   - Regenerate Prisma client

3. **Apply rule in filter**:

   ```typescript
   if (!meetsNewRequirement(stats, hofYearConfig)) {
     return false;
   }
   ```

4. **Update UI** to display the new criterion in `HofInfoPanels.tsx`

5. **Update tests** in `verify-qualification-rules.js`

### Modifying Existing Rules

1. Locate the specific rule function (e.g., `meetsMinimumAgeRequirement`)
2. Update the logic within the function
3. Run tests to verify behavior: `node scripts/test/verify-qualification-rules.js`
4. Update documentation if logic changes

### Best Practices

- Keep rule functions pure and stateless
- Add comprehensive JSDoc comments with examples
- Test thoroughly with various edge cases
- Document any side effects clearly
- Use descriptive variable names
- Add type definitions for complex objects
- Include real-world examples in comments

## Version History

| Date       | Change                                                 | Reason                                   |
| ---------- | ------------------------------------------------------ | ---------------------------------------- |
| 2025-11-06 | Refactored qualification rules into separate functions | Improve code clarity and maintainability |
| 2025-11-06 | Added comprehensive documentation and type definitions | Make code understandable years from now  |
| 2025-11-05 | Added minimum age requirement                          | New qualification criterion needed       |

---

**Last Updated**: November 6, 2025  
**Related Docs**:

- [HOF System](./HOF_SYSTEM.md) § System Overview (formerly HOF_SYSTEM_REVIEW.md)
- [HOF System](./HOF_SYSTEM.md) § Configuration Guide (formerly HOF_CONFIG_QUICK_REFERENCE.md)
