# Hall of Fame (HOF) System

**BWB (Baggers Without Borders) - Complete HOF Documentation**

> 📅 **Last Updated:** September 16, 2026 (verified against source)

---

## Quick Reference

**HOF System Components:**

- **Halls of Fame** - Peak categories (P100, P300, P500, etc.)
- **Years** - Annual tracking periods
- **Entries** - Member achievements per HOF per year
- **Configurations** - Filtering & qualification rules
- **Tiers** - Gold/Silver/Bronze awards

**Admin Pages:**

- `/admin/hofs` - Manage Halls of Fame
- `/admin/years` - Manage years
- `/admin/configuration` - Configure HOF/Year combinations
- `/admin/data-entry` - View/edit entries

**Public Pages:**

- `/hof-tables` - View HOF leaderboards and member achievements

---

## System Overview

### What is a Hall of Fame?

A Hall of Fame (HOF) represents a **category of peaks** based on prominence:

| HOF Code | Title                | Min Prominence | Description                  |
| -------- | -------------------- | -------------- | ---------------------------- |
| P100     | P100 Hall of Fame    | 100m           | Peaks with 100m+ prominence  |
| P300     | P300 Hall of Fame    | 300m           | Peaks with 300m+ prominence  |
| P500     | P500 Hall of Fame    | 500m           | Peaks with 500m+ prominence  |
| P600     | P600 Hall of Fame    | 600m           | Peaks with 600m+ prominence  |
| P1000    | P1000 Hall of Fame   | 1000m          | Peaks with 1000m+ prominence |
| P1500    | P1500 Hall of Fame   | 1500m          | Peaks with 1500m+ prominence |
| P2000    | P2000 Hall of Fame   | 2000m          | Peaks with 2000m+ prominence |
| P-INDEX  | P-Index Hall of Fame | Special        | Prominence index scoring     |
| POLY     | Poly Hall of Fame    | Climb-based    | Total climbs tracked         |

### Data Flow

```
Members → Climb Peaks → HOF Entries → Filtering → Tiers → Display
   ↓
Countries ────────────────────────────────────────────────────┘
   ↓
Regions
   ↓
LCE Status (Large Country Exception)
```

---

## HOF Entries

### What is an Entry?

An **HOF Entry** tracks a member's achievement in a specific HOF for a specific year:

```typescript
{
  member: "John Smith",
  hof: "P100",
  year: "2025",
  peaksInYear: 45,          // Total peaks climbed that year (domestic + foreign)
  foreignPeaksInYear: 20,   // Of those, climbed outside the home country
  totalPeaks: 150,          // Cumulative total across all active years
  foreignPeaks: 70,         // Cumulative foreign total
  fpr: 46.7,                // Foreign Peak Ratio (%) = foreignPeaks / totalPeaks × 100
  tier: "Gold"              // Award tier
}
```

### Cumulative Totals

HOF entries track **cumulative totals** across years:

**Example:**

- **2023:** 60 peaks total → Entry shows 60
- **2024:** Climbed 45 more peaks → Entry shows 105 (60 + 45)
- **2025:** Climbed 30 more peaks → Entry shows 135 (105 + 30)

**Recalculation:** When an entry is updated, all subsequent years are automatically recalculated to maintain cumulative accuracy.

### Foreign Peak Ratio (FPR)

**Definition:** Share of a member's cumulative peaks climbed outside their home country.

**Formula:**

```
FPR = (foreignPeaks / totalPeaks) × 100
```

**Example:**

- totalPeaks: 150 (cumulative, all countries)
- foreignPeaks: 70 (cumulative, outside the home country)
- **FPR = (70 / 150) × 100 = 46.7%**

Domestic peaks are not stored as a column — they are `totalPeaks − foreignPeaks`
(80 in this example).

**Purpose:** Measures international climbing activity.

---

## HOF Configurations

### What is a Configuration?

A **HOF Configuration** defines the **filtering rules** for a specific HOF in a specific year.

### Configuration Fields

| Field                                                                  | Type     | Description                                                              |
| ---------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| **Hall of Fame**                                                       | Select   | Which HoF (P100, P300, …)                                                |
| **Year**                                                               | Select   | Which year                                                               |
| **minPeaks**                                                           | Number   | Minimum total peaks; applied only when `minPeaksEnabled` is set          |
| **minForeignPeaks**                                                    | Number   | Minimum foreign peaks; applied only when `minForeignPeaksEnabled` is set |
| **minFpr**                                                             | Number   | Minimum FPR %; applied only when `minFprEnabled` is set                  |
| **minimumAge**                                                         | Number   | Minimum age; applied only when `minimumAgeEnabled` is set                |
| **lceEnabled**, **lceMinFpr**, **lceMinPeaks**, **lceMinForeignPeaks** | —        | Large Country Exception overrides (see the LCE section)                  |
| **hofmeisterId**                                                       | Select   | Optional assigned Hofmeister                                             |
| **notes**, **meisterReportContent**                                    | Markdown | Admin notes and the Hofmeister report                                    |

Each rule carries its own `*Enabled` flag — a threshold is ignored while its flag
is off, even when a value is stored. `HofYearConfig` in `prisma/schema.prisma` is
the source of truth.

### How Filtering Works

When viewing HOF tables, members are filtered by:

```typescript
// Pseudo-code
members = members.filter((member) => {
  if (config.minPeaks > 0 && member.totalPeaks < config.minPeaks) {
    return false; // Excluded
  }
  if (config.minFpr > 0 && member.fpr < config.minFpr) {
    return false; // Excluded
  }
  return true; // Included
});
```

### Example Configuration

**P100 - 2025:**

- **minPeaks:** 2
- **minFpr:** 10%

**Result:** Only members with 2+ peaks AND 10%+ FPR appear in the table.

**Effect:**

- 116 total entries
- 62 qualify (53.4%)
- 54 filtered out (46.6%) - mostly high-volume domestic climbers

### Managing Configurations

#### Create Configuration

1. Navigate to `/admin/configuration`
2. Click "Create Configuration"
3. Select HOF and Year
4. Set filtering criteria:
   - Min Peaks (e.g., 50)
   - Min FPR (e.g., 15%)
5. Add notes (optional)
6. Click "Create"

#### Edit Configuration

1. Navigate to `/admin/configuration`
2. Find configuration
3. Click edit icon (pencil)
4. Modify values
5. Click "Save"

#### Delete Configuration

1. Navigate to `/admin/configuration`
2. Click delete icon (trash)
3. Confirm deletion

**Note:** Deleting a configuration removes filtering (shows all members).

---

## Award Tiers

### Tier System

Members are assigned tiers based on their peak count relative to other qualifiers:

| Tier       | Badge Color | Qualification         |
| ---------- | ----------- | --------------------- |
| **Gold**   | Gold        | Top performers        |
| **Silver** | Silver      | Mid-level performers  |
| **Bronze** | Bronze      | Qualifying performers |
| **None**   | Gray        | Below threshold       |

### Tier Assignment Logic

```typescript
// src/lib/hofTierUtils.ts — tiers are rows, matched on the member's total
export const getMemberTier = (totalPeaks: number, tiers: AwardTier[]): AwardTier | null => {
  // Highest tier first
  const sortedTiers = [...tiers].sort((a, b) => b.minPeaks - a.minPeaks);

  for (const tier of sortedTiers) {
    if (totalPeaks >= tier.minPeaks && (tier.maxPeaks === null || totalPeaks <= tier.maxPeaks)) {
      return tier;
    }
  }
  return null;
};
```

### Tie-Breaking Rules

Members are ranked by total peaks. When members have identical peak counts, the following tie-breaking rules are applied in sequence:

1. **Higher FPR percentage** (Foreign Peak Ratio - more international climbing)
2. **More peaks climbed in the current year** (new peaks added this year)
3. **Earlier first qualification year** (year first met minimum HOF requirements)
4. **Display name in reverse alphabetical order** (Z ranks higher than A, respects diacritics)

All comparisons handle null values by sorting them last.

### Configuring Tiers

Tiers are rows, not limits. Each `HofYearConfig` owns an ordered set of
`AwardTier` records, and a member's tier is whichever record's peak range
contains their total:

| Field          | Meaning                                    |
| -------------- | ------------------------------------------ |
| `name`         | Tier label, e.g. `Diamond`                 |
| `minPeaks`     | Inclusive lower bound on total peaks       |
| `maxPeaks`     | Inclusive upper bound; `null` is unbounded |
| `displayOrder` | Presentation order                         |

`scripts/seed/seed-award-tiers.js` fills this from per-HoF templates, so a config
is seeded with a complete ladder (for example `Diamond` at `minPeaks: 35`,
`maxPeaks: null`). The ladder is data — changing it needs no code change.

---

## LCE (Large Country Exception) System

### What is LCE?

The **Large Country Exception** relaxes the foreign-peak requirements for members
resident in countries whose size makes climbing abroad disproportionately hard.
It does **not** classify individual peaks — every entry records only total peaks
and foreign peaks.

When a configuration has LCE enabled and a member's residence country is on that
configuration's LCE list, the member is assessed against the LCE thresholds
instead of the standard ones.

### Configuration

LCE is configured per HoF-year. In `/admin/configuration`:

1. Open the HoF-year configuration
2. Enable the Large Country Exception section
3. Set the LCE minimum FPR / peaks / foreign peaks
4. Add the residence countries the exception applies to
5. Save

**Data model:** `HofYearConfig.lceEnabled`, `lceMinFpr`, `lceMinPeaks`,
`lceMinForeignPeaks`, plus one `CountryLceConfig` row per applicable country
(`hofYearConfigId` + `countryId`, unique together).

**Rule interaction:** when LCE applies, the LCE FPR threshold replaces the standard
one — the standard threshold is not also required. See
[`QUALIFICATION_RULES.md`](QUALIFICATION_RULES.md) for the full rules.

---

## HOF Tables Public View

### Accessing HOF Tables

**URL:** `/hof-tables`

**Features:**

- View all HOFs and years
- Filter by HOF and year
- Sort by peaks, FPR, tier
- Expand member details
- See active filtering criteria

### UI Components

#### HOF Selector

Dropdown to select which HOF/Year to view

#### Filter Indicator

Yellow banner showing active filters:

```
⚠️ Active Filtering Criteria
Only showing members who meet:
• Minimum 2 total peaks
• Minimum 10% Foreign Peak Ratio
```

#### Member Table

Sortable table with columns:

- Rank
- Member name
- Total peaks
- Foreign peaks (and derived domestic peaks)
- FPR %
- Tier badge

#### Expanded Details

Click row to expand:

- Peak breakdown by category
- Country-specific totals
- Historical progression
- Tier qualification info

---

## Database Schema

### Tables

#### `hofs` (Halls of Fame)

```sql
CREATE TABLE hofs (
  id              TEXT PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  isActive        BOOLEAN DEFAULT true,
  displayOrder    INTEGER DEFAULT 0,
  allowManualEntry BOOLEAN DEFAULT false,
  progressRegisterExcludeRetired  BOOLEAN DEFAULT true,
  progressRegisterExcludeDeceased BOOLEAN DEFAULT true,
  progressRegisterExcludeInactive BOOLEAN DEFAULT true,
  progressRegisterInactivityYears INTEGER DEFAULT 2,
  createdAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `years`

```sql
CREATE TABLE years (
  id         TEXT PRIMARY KEY,
  code       TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL,
  description TEXT,
  isActive   BOOLEAN DEFAULT true,
  displayOrder INTEGER DEFAULT 0,
  allowManualEntry BOOLEAN DEFAULT false,
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `hof_entries`

```sql
CREATE TABLE hof_entries (
  id                TEXT PRIMARY KEY,
  memberId          TEXT NOT NULL,
  hofId             TEXT NOT NULL,
  yearId            TEXT NOT NULL,
  totalPeaks        INTEGER DEFAULT 0,
  peaksInYear       INTEGER DEFAULT 0,
  foreignPeaks      INTEGER DEFAULT 0,
  foreignPeaksInYear INTEGER DEFAULT 0,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memberId) REFERENCES users(id),
  FOREIGN KEY (hofId) REFERENCES hofs(id),
  FOREIGN KEY (yearId) REFERENCES years(id),
  UNIQUE(memberId, hofId, yearId)
);
```

#### `hof_year_configs`

```sql
CREATE TABLE hof_year_configs (
  id            TEXT PRIMARY KEY,
  hofId         TEXT NOT NULL,
  yearId        TEXT NOT NULL,
  hofmeisterId  TEXT,
  minPeaks      INTEGER DEFAULT 0,
  minPeaksEnabled BOOLEAN DEFAULT false,
  minForeignPeaks INTEGER DEFAULT 0,
  minForeignPeaksEnabled BOOLEAN DEFAULT false,
  minFpr        REAL DEFAULT 0,
  minFprEnabled BOOLEAN DEFAULT false,
  minimumAge    INTEGER,
  minimumAgeEnabled BOOLEAN DEFAULT false,
  lceEnabled    BOOLEAN DEFAULT false,
  lceMinFpr     REAL,
  lceMinPeaks   INTEGER,
  lceMinForeignPeaks INTEGER,
  notes         TEXT,
  createdAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hofId) REFERENCES hofs(id),
  FOREIGN KEY (yearId) REFERENCES years(id),
  UNIQUE(hofId, yearId)
);
```

---

## API Endpoints

### HOF Management

#### `GET /api/hofs`

List all Halls of Fame

**Response:**

```json
[
  {
    "id": "hof1",
    "code": "P100",
    "title": "P100 Hall of Fame",
    "displayOrder": 0,
    "isActive": true
  }
]
```

The response is a bare array — there is no `data`/`total` envelope.

#### `POST /api/hofs`

Create new HOF (Admin only)

#### `PUT /api/hofs/[id]`

Update HOF (Admin only)

#### `DELETE /api/hofs/[id]`

Delete HOF (Admin only)

### HOF Entries

#### `GET /api/hof-entries`

List HOF entries with filters

**Query params:**

- `memberId` - Filter by member
- `hofId` - Filter by HOF
- `yearId` - Filter by year
- `page`, `limit` - Pagination

#### `POST /api/hof-entries`

Create new entry (triggers recalculation)

#### `PUT /api/hof-entries/[id]`

Update entry (triggers recalculation)

### HOF Tables

#### `GET /api/hof-tables`

Get filtered, tiered HOF table for display

**Query params:**

- `hofId` (required) - Which HOF
- `yearId` (required) - Which year

**Response:**

```json
{
  "members": [
    {
      "memberId": "user1",
      "name": "John Smith",
      "totalPeaks": 150,
      "foreignPeaks": 70,
      "fpr": 46.7,
      "tier": "Gold",
      "rank": 1
    }
  ],
  "stats": {
    "totalMembers": 62,
    "goldCount": 10,
    "silverCount": 20,
    "bronzeCount": 30
  },
  "config": {
    "minPeaks": 2,
    "minFpr": 10
  }
}
```

---

## Common Tasks

### Add a New HOF

1. Go to `/admin/hofs`
2. Click "Create Hall of Fame"
3. Enter:
   - Code (e.g., "P750")
   - Title (e.g., "P750 Hall of Fame")
   - Min Prominence (e.g., 750)
   - Display Order (e.g., 4)
4. Click "Create"

### Add a New Year

1. Go to `/admin/years`
2. Click "Create Year"
3. Enter:
   - Code (e.g., "2026")
   - Start Date (e.g., "2026-01-01")
   - End Date (e.g., "2026-12-31")
4. Click "Create"

### Configure Year Requirements

1. Go to `/admin/configuration`
2. Click "Create Configuration"
3. Select HOF and Year
4. Set requirements:
   - Min Peaks: 50
   - Min FPR: 15%
5. Click "Create"

### Import Member Entries

No importer for real member data ships with the repository — that pipeline was
one-off and has been removed. For synthetic development data, use the shipped
seed scripts:

```bash
npm run db:seed-hof-entries   # synthetic HOF entries for existing users
npm run db:studio             # inspect the result
```

To import real data you must write your own importer; see
[IMPLEMENTATION.md §19](../IMPLEMENTATION.md#19-appendix--seeding-and-populating-data)
("no importers ship; write your own") for the required steps: users,
year/HOF participations, entries, then a cumulative recalculation pass.

### Recalculate Totals

When entry data changes through the API, cumulative totals are recalculated
automatically. The logic lives in `src/lib/recalculate-totals.ts`, but a bulk
insert does **not** trigger it: an importer must call
`recalculateTotalsForUserAndHof()` for each affected member/HOF pair (see
[IMPLEMENTATION.md §19](../IMPLEMENTATION.md#19-appendix--seeding-and-populating-data)).

---

## Testing

### Unit Tests

**File:** `__tests__/unit/hofTierUtils.test.ts`

Tests tier assignment logic:

- Tier thresholds
- Tie-breaking rules
- Sorting order

```bash
npm run test:unit -- --testPathPatterns=hofTierUtils
```

### API Tests

**File:** `__tests__/api/hof-entries.api.test.ts`

Tests HOF entry CRUD and recalculation:

- Entry creation
- Total recalculation
- Multi-year workflows

```bash
npm run test:api -- --testPathPatterns=hof-entries
```

### Integration Tests

**File:** `__tests__/integration/hof-entries.integration.test.ts`

Tests complete workflows:

- Configuration → Entry → Filtering → Tiers

```bash
npm run test:integration
```

---

## Troubleshooting

### Issue: Members not appearing in HOF table

**Check:**

1. Do they have an entry? (Check `hof_entries` table)
2. Does entry meet filtering criteria? (Check `hof_year_configs`)
3. Is HOF/Year active? (Check `hofs.isActive` and `years.isActive`)

### Issue: Incorrect cumulative totals

**Solution:**
Cumulative totals are recalculated automatically when an entry is written
through the API. For data written outside the API (e.g. a bulk import), call
`recalculateTotalsForUserAndHof()` from `src/lib/recalculate-totals.ts` for each
affected member/HOF pair — see
[IMPLEMENTATION.md §19](../IMPLEMENTATION.md#19-appendix--seeding-and-populating-data).

### Issue: FPR calculation seems wrong

**Check:**

1. Member's home country is set
2. Peaks have country assignments
3. LCE mappings are configured
4. Formula: `FPR = (foreignPeaks / totalPeaks) × 100` — computed per entry in
   `app/api/hof-tables/route.ts`, then compared with the threshold. There are no
   `continental` or `exotic` fields in the schema.

### Issue: Tiers not assigned correctly

**Check:**

1. The configuration's `AwardTier` rows (`minPeaks`/`maxPeaks` ranges)
2. Member sorting (by totalPeaks descending)
3. Tie-breaking rules applied

---

## Bulk Data Upload

### Overview

Admins can bulk upload member HOF entry data from JSON files via the Year Configuration page. This feature allows efficient import of large datasets while maintaining data integrity.

**Access:** `/admin/years/[id]/upload-data` (or click "Upload Member Data" button on year edit page)

### JSON Format Specification

```json
[
  {
    "year": 2025,
    "cid": 10303,
    "P-TOP50": [1, 1],
    "P-TOP100": [2, 1],
    "P2000": [2, 1],
    "P1500": [3, 1],
    "P1000": [9, 1],
    "P600": [18, 1],
    "P500": [21, 1],
    "P300": [32, 1],
    "P100": [48, 3],
    "P30": [50, 3]
  }
]
```

**Field Descriptions:**

- `year` (number) - Must match the target year's `code` field (e.g., 2025)
- `cid` (number) - Member's Peakbagger ID (maps to `User.peakbaggerId`)
- `"HOF-CODE"` (array) - Two values: `[peaksInYear, foreignPeaksInYear]`
  - `peaksInYear` - Domestic peaks climbed this year (non-negative integer or null)
  - `foreignPeaksInYear` - Foreign peaks climbed this year (non-negative integer or null)
  - Use `[null, null]` to skip a HOF category for a member

**Valid HOF Codes:** P30, P100, P300, P500, P600, P1000, P1500, P2000, P-TOP50, P-TOP100, P-INDEX, POLY

### Validation Rules

The system validates uploaded files and rejects:

1. **File Size/Entry Limits:** Max 10MB file size, max 10,000 entries per upload
2. **Year Mismatch:** JSON `year` field must match target year's code
3. **Invalid CID:** Member with specified `cid` (Peakbagger ID) must exist
4. **Invalid HOF Code:** HOF category code must exist in database
5. **Duplicate Entries:** Same member+HOF+year combination cannot appear multiple times in one file
6. **Invalid Values:** Peak counts must be non-negative integers (or null to skip)
7. **Format Errors:** Each HOF entry must be exactly 2 values: `[peaksInYear, foreignPeaksInYear]`

### Upload Workflow

1. **Select File** - Upload JSON file (auto-validates on selection)
2. **Preview Results** - Review validation summary with filter tabs:
   - **All** - All entries (valid and errors)
   - **Created** - New entries to be created
   - **Updated** - Existing entries to be updated
   - **Errors** - Invalid entries with error messages
3. **Confirm Import** - Double confirmation required:
   - Warning dialog showing impact
   - Type year code to confirm final import
4. **Import Execution** - All operations wrapped in transaction with automatic rollback on errors

### Data Processing

**Entry Creation/Update:**

- System uses **upsert pattern** (create if new, update if exists)
- Only `peaksInYear` and `foreignPeaksInYear` are set from JSON
- Cumulative fields (`totalPeaks`, `foreignPeaks`) are set to 0 initially
- **No deletions** - entries are only created or updated, never deleted

**Automatic Recalculation:**

After import, the system:

1. Batches all unique (memberId, hofId) pairs from imported entries
2. Calls `recalculateTotalsForUserAndHof()` once per unique pair
3. Recalculates cumulative totals for all years (BASELINE through current)
4. Updates only changed entries for efficiency

**UserYearParticipation Auto-Creation:**

If a member doesn't have a `UserYearParticipation` record for the target year, the system automatically creates one with:

- `enabled: true`
- `dataNotProvided: false`
- `countryId: null` (uses member's default country)

### Transaction Behavior

**All changes are wrapped in a single database transaction:**

- If any error occurs during import, **all changes are rolled back**
- No partial imports - it's all-or-nothing
- Guarantees data consistency and integrity
- Safe to retry after fixing validation errors

### Example Use Case

**Scenario:** Import 2025 data for 200 members across 10 HOF categories (2,000 entries)

**Process:**

1. Upload JSON file with 2,000 entries
2. Validation identifies:
   - 1,800 valid entries (1,200 creates, 600 updates)
   - 200 errors (invalid CIDs, year mismatches)
3. Fix errors in source data and re-upload
4. Confirm import with double confirmation
5. System imports 1,800 entries and recalculates 200 unique member+HOF pairs
6. All cumulative totals automatically updated

### Audit Logging

All bulk imports are logged with:

- Event type: `ADMIN_YEAR_UPDATE`
- Action: `bulk_import_member_data`
- Details: Entries imported, created, updated, and member+HOF pairs recalculated
- Success/failure status
- User who performed the import

### Performance Considerations

**Optimizations:**

- Batched recalculation deduplicates member+HOF pairs
- Single transaction minimizes database locks
- Parallel recalculation promises for multiple pairs
- Only updates entries with changed values

**Estimated Times:**

- 100 entries: ~5 seconds
- 1,000 entries: ~30 seconds
- 10,000 entries: ~5 minutes

### Limits

- **File Size:** 10MB maximum
- **Entries:** 10,000 maximum per upload
- **Duplicates:** Rejected if same member+HOF+year appears multiple times in file
- **Authorization:** Admin role required

---

## Related Documentation

- [Testing Guide](TESTING.md) - HOF unit and integration tests
- [API Reference](API_REFERENCE.md) - HOF endpoint details
- [Database Guide](DATABASE_SEEDING.md) - HOF data seeding
- [Component Reference](COMPONENT_REFERENCE.md) - HOF UI components
- [Total Peaks Recalculation](TOTAL_PEAKS_RECALCULATION.md) - Cumulative total calculation logic

---

## Summary

The HOF system provides comprehensive tracking of member achievements across different prominence categories and years. Key features:

- ✅ Flexible filtering (min peaks, min FPR)
- ✅ Automatic tier assignment (Gold/Silver/Bronze)
- ✅ Cumulative total tracking
- ✅ LCE geographic classification
- ✅ Admin configuration UI
- ✅ Public leaderboard display
- ✅ Bulk data upload with validation and preview
- ✅ Transaction-safe imports with automatic rollback

Use the admin interface to manage HOFs, years, and configurations. The system automatically handles recalculation, filtering, and tier assignment.
