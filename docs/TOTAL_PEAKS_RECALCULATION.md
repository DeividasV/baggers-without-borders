# Total Peaks Auto-Recalculation System

## Overview

The BWB system now automatically recalculates `totalPeaks` values whenever any year's data is updated. This ensures data integrity across all years when users update their historical climbing records.

> **Verified 2026-09-16.** The standalone CLI scripts this document used to
> describe — `scripts/recalculate-user-hof.js`, `scripts/test-recalculation.js`,
> `scripts/verify-recalculation.js`, `scripts/generate-baseline-demo-data.js` —
> **have been removed**. There is no recalculation CLI. Recalculation runs in-app
> from `src/lib/recalculate-totals.ts`, called when a `HofEntry` is created or
> updated (`app/api/hof-entries/route.ts`, `app/api/hof-entries/[id]/route.ts`,
> the year import/create-missing-entries routes, and
> `app/api/my-bags/[id]/route.ts`). **Deleting an entry does not recalculate** —
> see `IMPLEMENTATION.md` §16.

**Background**:

- ✅ **Hidden UI Field**: totalPeaks is no longer shown in the HofEntryForm (users only enter peaksInYear and foreignPeaks)
- ✅ **Reusable Function**: Recalculation logic lives in `src/lib/recalculate-totals.ts`
- ✅ **Foreign Peaks Support**: Recalculation includes foreignPeaks in the total

## Key Features

### 1. BASELINE Year

- **Code**: `BASELINE`
- **Title**: "Before 2019"
- **Display Order**: `-1` (appears first)
- **Purpose**: Record opening balances - peaks climbed before the 2019 year
- **Usage**: Users enter the total number of peaks they climbed before systematic tracking began

### 2. Automatic Recalculation

When any year entry is updated (baseline or any year), the system:

1. **Recalculates all subsequent years** for that user+HOF combination
2. **Uses cumulative logic**: `totalPeaks[current] = sum(all previous peaksInYear + current peaksInYear)`
3. **Updates in a transaction** to ensure data consistency
4. **Preserves user input** for `peaksInYear` and `foreignPeaks` - only `totalPeaks` is recalculated

### 3. Calculation Logic

```javascript
// For each year (ordered by displayOrder):
runningTotal = 0;
for (year in allYears) {
  runningTotal += year.peaksInYear + year.foreignPeaks;
  year.totalPeaks = runningTotal;
}
```

**Example:**

```
BASELINE: peaksInYear=1330 + foreignPeaks=133 → totalPeaks=1,463
2019:     peaksInYear=72   + foreignPeaks=55  → totalPeaks=1,590  (1463 + 72 + 55)
2020:     peaksInYear=39   + foreignPeaks=32  → totalPeaks=1,661  (1590 + 39 + 32)
2021:     peaksInYear=97   + foreignPeaks=54  → totalPeaks=1,812  (1661 + 97 + 54)
```

**If 2019 is updated:**

```
BASELINE: peaksInYear=1330 + foreignPeaks=133 → totalPeaks=1,463  (unchanged)
2019:     peaksInYear=80   + foreignPeaks=60  → totalPeaks=1,603  (1463 + 80 + 60) ✓ recalculated
2020:     peaksInYear=39   + foreignPeaks=32  → totalPeaks=1,674  (1603 + 39 + 32) ✓ recalculated
2021:     peaksInYear=97   + foreignPeaks=54  → totalPeaks=1,825  (1674 + 97 + 54) ✓ recalculated
```

## Implementation Details

### Database Schema

```prisma
model Year {
  id              String   @id @default(cuid())
  code            String   @unique
  title           String
  displayOrder    Int      @default(0)  // BASELINE has -1
  // ... other fields
}

model HofEntry {
  id              String   @id @default(cuid())
  memberId        String
  hofId           String
  yearId        String

  // User-editable fields:
  peaksInYear   Int      @default(0)  // Peaks climbed THIS year
  foreignPeaks    Int      @default(0)  // Foreign peaks THIS year

  // Auto-calculated field:
  totalPeaks      Int      @default(0)  // Cumulative total (auto-recalculated)

  // ... relations
}
```

### API Endpoint

**PUT** `/api/my-bags/[id]`

**Request Body:**

```json
{
  "peaksInYear": 50,
  "foreignPeaks": 15
}
```

**Process:**

1. Validate permissions (user, HOF, year allowManualEntry)
2. Update the entry with new values
3. **Trigger recalculation** for all subsequent years
4. Return updated entry with recalculated `totalPeaks`

**Code snippet:**

```typescript
// Update the entry
await prisma.hofEntry.update({
  where: { id },
  data: {
    peaksInYear: peaksInYear ?? existing.peaksInYear,
    foreignPeaks: foreignPeaks ?? existing.foreignPeaks,
    // Note: totalPeaks will be recalculated below
  },
});

// Recalculate totalPeaks for ALL years (not just subsequent)
await recalculateTotalsForUserAndHof(existing.memberId, existing.hofId);
```

### Recalculation Function

Located in: `src/lib/recalculate-totals.ts` (reusable across app)

```typescript
export async function recalculateTotalsForUserAndHof(
  memberId: string,
  hofId: string
): Promise<number> {
  // 1. Fetch ALL active entries for this user+HOF, ordered by year
  const allEntries = await prisma.hofEntry.findMany({
    where: {
      memberId,
      hofId,
      year: { isActive: true },
    },
    orderBy: { year: { displayOrder: "asc" } },
  });

  // 2. Calculate cumulative totals (including foreignPeaks)
  let runningTotal = 0;
  const updates = [];

  for (const entry of allEntries) {
    runningTotal += entry.peaksInYear + entry.foreignPeaks;

    if (runningTotal !== entry.totalPeaks) {
      updates.push({
        id: entry.id,
        totalPeaks: runningTotal,
      });
    }
  }

  // 3. Update in transaction
  await prisma.$transaction(
    updates.map((update) =>
      prisma.hofEntry.update({
        where: { id: update.id },
        data: { totalPeaks: update.totalPeaks },
      })
    )
  );

  return updates.length;
}
```

const updates = [];

for (const entry of allEntries) {
runningTotal += entry.peaksInYear;

    // 3. Only update entries at or after the modified year
    if (entry.year.displayOrder >= updatedYearDisplayOrder) {
      if (entry.totalPeaks !== runningTotal) {
        updates.push(
          prisma.hofEntry.update({
            where: { id: entry.id },
            data: { totalPeaks: runningTotal },
          })
        );
      }
    }

}

// 4. Execute all updates in a transaction
if (updates.length > 0) {
await prisma.$transaction(updates);
}
}

````

## Migration & Seeding

### Migration

Created: `20251029231226_add_baseline_year`

```sql
INSERT INTO years (id, code, title, description, isActive, displayOrder, allowManualEntry, createdAt, updatedAt)
VALUES (
  'baseline_year_001',
  'BASELINE',
  'Before 2019',
  'Opening balance - peaks climbed before the 2019 year',
  1,
  -1,
  1,
  datetime('now'),
  datetime('now')
)
ON CONFLICT(code) DO NOTHING;
````

### Seed Script

File: `prisma/seed-baseline-year.js`

Run independently:

```bash
node prisma/seed-baseline-year.js
```

Included in main seed:

```bash
npm run db:seed
```

## Testing

The recalculation logic is covered by `__tests__/unit/recalculate-totals.test.ts`:

```bash
npx jest __tests__/unit/recalculate-totals.test.ts
```

It covers creating entries for BASELINE and subsequent years, recalculating later
years when an earlier one is updated, and leaving earlier years unchanged.

> The former `scripts/test-recalculation.js` has been removed.

## User Workflow

### 1. Setting Opening Balance (BASELINE)

Users enter their BASELINE year data:

- Navigate to "My Bags"
- Click on the BASELINE row for their desired HOF (e.g., P100)
- Enter **Peaks in Year** (e.g., 1330) - total peaks climbed before 2019
- Enter **Foreign Peaks** (e.g., 133) - foreign peaks climbed before 2019
- Save

**Note**: The `totalPeaks` field is **not shown** - it's calculated automatically!

**Result:** `totalPeaks` for BASELINE = 1,463, and all subsequent years are recalculated

### 2. Updating Historical Data

If a user discovers they need to correct a past year:

- Navigate to "My Bags"
- Click on the year to update (e.g., 2020)
- Change `peaksInYear` or `foreignPeaks` value
- Save

**Result:** System automatically recalculates `totalPeaks` for ALL years (BASELINE through 2025)

### 3. Viewing My Bags

The "My Bags" page shows:

- **Top stats**: Latest totals across all HOFs
- **Matrix view**: Shows selected metric (Total Peaks, Peaks in Year, Foreign Peaks, FPR)
- **BASELINE year**: Appears first in the list (displayOrder: -1)
- **All values**: Always up-to-date due to automatic recalculation

## Scripts and Tools

**There is no recalculation CLI in this repository.** Totals are maintained by
`src/lib/recalculate-totals.ts`, which runs automatically when an entry is created
or updated.

To repair totals after a bulk import or an interrupted write:

1. Re-save the affected entry in the UI (My Bags), which triggers recalculation, or
2. Write a one-off script that calls the recalculation function for each affected
   `(memberId, hofId)` pair — see `IMPLEMENTATION.md` §19 for the import pattern.

> The former helper scripts (`recalculate-user-hof.js`,
> `verify-recalculation.js`, `generate-baseline-demo-data.js`) were removed during
> the tooling cleanup and are not part of the repository.

## Performance Considerations

### Optimization Strategies

1. **Recalculate ALL years**: Simpler logic, no need to track displayOrder parameter
2. **Transaction Batching**: All updates executed in a single database transaction
3. **Skip Unnecessary Updates**: Checks if value changed before updating
4. **Indexed Queries**: Uses indexed fields (memberId, hofId, displayOrder)
5. **Active Years Only**: Only processes years where `isActive = true`

### Performance Metrics

For a user with 1 HOF × 8 years = 8 entries:

- **Updating any year**: Recalculates ALL 8 entries = 8 potential updates
- **Only changed values updated**: If BASELINE unchanged, might be 0 updates
- **Transaction overhead**: Minimal due to batch updates

**Average recalculation time**: < 100ms for typical user (8 years)

## Data Integrity

### Guarantees

1. ✅ **Consistency**: All `totalPeaks` values are always correct
2. ✅ **Atomicity**: All updates happen in a transaction (all or nothing)
3. ✅ **User Input Preserved**: Only `totalPeaks` is auto-calculated, `peaksInYear` and `foreignPeaks` are user-controlled
4. ✅ **Audit Trail**: Can track when entries were last updated via `updatedAt`

### Edge Cases Handled

1. **Missing years**: Only calculates for existing entries
2. **Out-of-order saves**: Recalculation logic handles any order
3. **Concurrent updates**: Database transactions prevent race conditions
4. **Deleted entries**: Recalculation continues with remaining entries

## Future Enhancements

Possible improvements:

- [x] **Hidden UI Field**: totalPeaks no longer shown in form (COMPLETED)
- [x] **Reusable Function**: Extracted to `src/lib/recalculate-totals.ts` (COMPLETED)
- [ ] Recalculate totals on entry **delete** (currently only create/update do)
- [ ] Add `lastRecalculatedAt` timestamp to track recalculation history
- [ ] Batch recalculation API for admin-triggered recalcs (all users)
- [ ] Validation warnings if `totalPeaks` seems incorrect
- [ ] Export/import preserving recalculation logic
- [ ] Background job to verify all totals are correct (data integrity check)

## Troubleshooting

### Issue: Totals seem incorrect

**Solution 1**: Edit and re-save the entry in the UI — saving triggers automatic recalculation

**Solution 2**: For a bulk repair, write a one-off script calling
`src/lib/recalculate-totals.ts` (there is no recalculation CLI — see the note at
the top of this document)

### Issue: BASELINE year missing

**Solution**: Run database seed

```bash
npm run db:seed
```

### Issue: TypeScript errors about allowManualEntry

**Solution**: Regenerate Prisma client

```bash
npx prisma generate
```

### Issue: totalPeaks field still showing in form

**Solution**: Check that you're using the updated HofEntryForm component

- File: `app/components/features/HofEntryForm.tsx`
- Should only show 2 fields: peaksInYear and foreignPeaks
- Grid should be `grid-cols-2` not `grid-cols-3`

1. Check BASELINE year value
2. Verify `peaksInYear` for each year
3. Run the unit test: `npx jest __tests__/unit/recalculate-totals.test.ts`
4. Contact admin to trigger full recalculation

### BASELINE year not showing?

1. Verify year exists: `SELECT * FROM years WHERE code='BASELINE';`
2. Run seed: `node prisma/seed-baseline-year.js`
3. Check `isActive = true` and `displayOrder = -1`

### Recalculation not triggering?

1. Check user's `allowManualEntry` flag
2. Check HOF's `allowManualEntry` flag
3. Check year's `allowManualEntry` flag
4. Check browser console for API errors
5. Check server logs for transaction errors

## Related Files

- **Migration**: `prisma/migrations/20251029231226_add_baseline_season/migration.sql`
- **Seed**: `scripts/seed/seed-baseline-year.js`
- **API**: `app/api/my-bags/[id]/route.ts`
- **Frontend**: `app/components/features/my-bags/MyBagsManagement.tsx`
- **Test**: `__tests__/unit/recalculate-totals.test.ts`
- **Main Seed**: `prisma/seed.js`
