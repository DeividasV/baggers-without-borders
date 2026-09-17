# Database Seeding Guide

This guide explains how to populate the database with countries and regions data.

## Overview

The project includes:

- **249 countries** across 6 continents (from `prisma/countries/*.json`)
- **163 region files** with thousands of administrative subdivisions (from `prisma/regions/*.json`)

## Development Environment

### Initial Setup

1. **Ensure database schema is current:**

   ```bash
   npx prisma migrate dev
   ```

2. **Seed the database:**

   ```bash
   npm run db:seed
   ```

   This will import:
   - ✅ All 249 countries with metadata
   - ✅ All regions from 163 region files
   - ✅ The synthetic demo users (`demo-admin`, `demo-user`, `demo-member`)

3. **Verify the import:**

   ```bash
   npx prisma studio
   ```

   Open Prisma Studio and check:
   - `Country` table should have 249 records
   - `Region` table should have thousands of records
   - Each region should link to its country

### Re-seeding

The seed scripts are **idempotent** (safe to run multiple times):

```bash
npm run db:seed
```

This will:

- Update existing countries/regions if data changed
- Add new countries/regions if added
- **Not create duplicates** (uses `upsert` operations)

## Production Environment

### After Migration

When deploying to production or after schema changes:

1. **Deploy schema changes:**

   ```bash
   npx prisma migrate deploy
   ```

2. **Seed the reference data (countries and regions):**

   ```bash
   npm run db:seed
   ```

   The seed is idempotent (every step upserts), so it is safe to re-run against an
   existing database. It also creates the three demo users unless
   `NODE_ENV=production`. See `IMPLEMENTATION.md` §11.4 and §19 for exactly what it
   creates and what is deliberately left out.

### Manual Production Import

`npm run db:seed` is idempotent — every step upserts — so it is the supported way
to bring an existing database up to date, production included. It reads the
committed `prisma/countries/*.json` and `prisma/regions/<CC>.json`, so nothing is
downloaded.

```bash
# 1. Back up first — in Docker the database is /app/data/bwb.db
#    (DATABASE_URL sets the path; see docker-compose.prod.yml)
cp /app/data/bwb.db /app/data/bwb.db.backup

# 2. Generate Prisma client (needed if the schema changed)
npx prisma generate

# 3. Apply migrations, then seed
npx prisma migrate deploy
npm run db:seed

# 4. Verify
npx prisma studio
```

## Seed Scripts

### Main Seed Script (`prisma/seed.js`)

Seeds all reference data in dependency order:

1. Countries and regions
2. Consent types
3. Interests
4. Halls of Fame
5. Years (including the baseline year)
6. HoF-year configurations
7. Award tiers
8. Demo users (`demo-admin`, `demo-user`, `demo-member`)

Every step upserts, so `npm run db:seed` is idempotent. `IMPLEMENTATION.md` §19
lists what each group produces and which are required.

Usage:

```bash
npm run db:seed
```

### Seeding geography only

There is no standalone geography script. `prisma/seed.js` owns the country and
region import, and it also creates the other reference data and the demo users.
To refresh geography, re-run `npm run db:seed` — every step upserts, so it is
idempotent and will not duplicate rows.

The data itself is committed: `prisma/countries/*.json` (one file per continent)
and `prisma/regions/<CC>.json` (one per country). Nothing is downloaded at seed
time, so seeding works without network access.

## Data Structure

### Countries

- **Source:** `prisma/countries/{continent}.json`
- **Format:** ISO 3166-1 (alpha-2, alpha-3, numeric codes)
- **Fields:** code, code3, name, nativeName, numericCode, capital, continent, currency, languages, hasRegions

### Regions

- **Source:** `prisma/regions/{COUNTRY_CODE}.json`
- **Format:** ISO 3166-2 (subdivision codes)
- **Fields:** code, name, nativeName, type, countryCode
- **Unique:** Combination of `countryId` + `code`

## Verification Queries

### Check Country Count

```sql
SELECT COUNT(*) FROM Country;
-- Expected: 249
```

### Check Region Count

```sql
SELECT COUNT(*) FROM Region;
-- Expected: Thousands (varies by data)
```

### Check Countries with Regions

```sql
SELECT
  c.code,
  c.name,
  COUNT(r.id) as region_count
FROM Country c
LEFT JOIN Region r ON r.countryId = c.id
WHERE c.hasRegions = true
GROUP BY c.id
ORDER BY region_count DESC;
-- Expected: 163 countries with regions
```

### Check for Missing Region Files

```sql
SELECT code, name
FROM Country
WHERE hasRegions = true
  AND id NOT IN (SELECT DISTINCT countryId FROM Region);
-- Expected: Empty (all countries with hasRegions should have regions)
```

## Troubleshooting

### "Table does not exist" Error

```bash
# Run migrations first
npx prisma migrate dev
# Then seed
npm run db:seed
```

### Duplicate Key Errors

This shouldn't happen (upsert prevents it), but if it does:

```bash
# Reset database (DEVELOPMENT ONLY!)
npx prisma migrate reset
# This will drop all data and re-run migrations + seed
```

### Import Takes Too Long

The import is sequential by design for reliability. For faster imports:

1. Use the standalone script (skips users)
2. Consider batch operations (requires code changes)

### Verify Data Integrity

```bash
# Open Prisma Studio
npx prisma studio

# Check:
# 1. Countries table has 249 records
# 2. Regions table has many records
# 3. Each region's countryId links to valid country
# 4. No null values in required fields
```

## Production Rollback

If you need to undo the import:

```bash
# Restore from backup (Docker path; substitute your own DATABASE_URL target)
cp /app/data/bwb.db.backup /app/data/bwb.db

# Or manually delete (if needed)
# DELETE FROM Region;
# DELETE FROM Country;
```

## Updating Geographic Data

When you add/update country or region files:

1. **Development:**

   ```bash
   npm run db:seed
   ```

   (Upsert will update existing records)

2. **Production:**
   ```bash
   npm run db:seed
   ```

## CI/CD Integration

Add to your deployment pipeline:

```yaml
# After database migrations
- name: Seed reference data
  run: |
    npx prisma generate
    npm run db:seed
```

## Summary

| Environment | Command           | Demo users                    | Notes               |
| ----------- | ----------------- | ----------------------------- | ------------------- |
| Development | `npm run db:seed` | ✅ Yes                        | Idempotent upserts  |
| Production  | `npm run db:seed` | ❌ No (`NODE_ENV=production`) | Take a backup first |

## Next Steps

1. Run seed in development to test: `npm run db:seed`
2. Verify in Prisma Studio: `npx prisma studio`
3. Add to production deployment process
4. Document any custom regions you add
