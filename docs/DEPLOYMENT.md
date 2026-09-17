# Deployment Guide

**BWB (Baggers Without Borders) - Production Deployment Documentation**

---

## Quick Deploy

```bash
# One command deployment (Docker): builds the image, ships it, applies Prisma
# migrations, recreates the stack and polls /api/health
npm run deploy

# Apply migrations only (needed when the schema changed without a full deploy)
ssh root@example.com
cd /srv/bwb && docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy
docker logs bwb-climbing --tail 50
```

**Production URL:** https://bwb.example.com

---

## Prerequisites

### Access Requirements

- [x] SSH access to `root@example.com`
- [x] SSH key configured (no password)
- [x] VPN connection (if required)

### Server Environment

- [x] Node.js >= 24.x
- [x] npm >= 10.x
- [x] Docker + Docker Compose
- [x] Nginx reverse proxy
- [x] SQLite database at `/srv/bwb/data/bwb.db` (mounted at `/app/data/bwb.db` in the container)

### Local Environment

- [x] Code committed to git
- [x] `.env` file configured
- [x] Tests passing (`npm test`)
- [x] Build successful (`npm run build`)

---

## Deployment Process

### Step 1: Pre-Deployment Checks

Run locally before deploying:

```bash
# Ensure tests pass
npm run test:api
npm run test:unit

# Ensure build succeeds
npm run build

# Ensure lint passes
npm run lint

# Type check
npm run type-check

# Commit all changes
git add .
git commit -m "feat: deployment ready"
```

### Step 2: Deploy Code

```bash
npm run deploy
```

`npm run deploy` runs `scripts/deployment/deploy.sh`, which performs the whole
Docker release:

**What this script does:**

1. Runs the critical test suites (`test:unit`, `test:api`, `test:contracts`,
   `test:e2e`, `test:integration`) and aborts if any fail
2. Builds the Docker image locally (`docker build -t bwb-climbing:…`) and saves it
   to a tar
3. Transfers the image to the server with rsync and loads it (`docker load`)
4. Syncs `docker-compose.prod.yml`, `data/test-results/` and `data/git-commits/`
5. Creates the server `.env` if missing, and ensures `/srv/bwb/{data,uploads,backups}`
   exist and are owned by UID/GID 1001
6. Takes a pre-deployment backup of `/srv/bwb/data/bwb.db`
7. Applies Prisma migrations in a one-off container:
   `docker run --rm … npx prisma migrate deploy --schema prisma/schema.prisma`
8. Recreates the stack with `docker compose -f docker-compose.prod.yml up -d`
9. Polls `http://localhost:1345/api/health` inside the container (up to 30 seconds)
   and exits non-zero if it never becomes healthy
10. Prunes old images, verifies the nginx configuration, and deletes backups older
    than 30 days (keeping the 10 most recent)

**Expected output (abridged):**

```
  BWB Climbing App Production Deployment
  Target: example.com
  Method: Local Build + Image Transfer
[INFO] Running critical test suite...
[SUCCESS] All critical tests passed ✓
[SUCCESS] Local Docker is running
[SUCCESS] Docker image built successfully
[SUCCESS] Image transferred
[SUCCESS] Image loaded on server
[SUCCESS] Volume directories ready
[SUCCESS] Migrations applied
[SUCCESS] Container started
[SUCCESS] Container is healthy
[SUCCESS] Deployment complete!
  ✓ Deployment Successful!
```

**⚠️ Important:** This step _does_ apply Prisma migrations (after taking a
pre-deployment database backup). Existing rows are preserved; the production
database is `/srv/bwb/data/bwb.db` on the host.

### Step 3: Database Migration (If Schema Changed)

**Only needed when the Prisma schema changed without a full deploy** — Step 2
already applies migrations.

For the Docker deployment, run migrations inside the running container:

```bash
ssh root@example.com
cd /srv/bwb
docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate deploy
```

For a non-Docker (PM2) install, run the same Prisma command from the app
directory:

```bash
ssh root@example.com
cd /srv/bwb/app
npx prisma migrate deploy
```

**What this command does:**

1. ✅ Connects to the production SQLite database (`/srv/bwb/data/bwb.db`, mounted at
   `/app/data/bwb.db` in the container)
2. ✅ Applies every migration in `prisma/migrations/` that has not run yet
3. ✅ Records applied migrations in `_prisma_migrations`; already-applied migrations
   are skipped, so it is safe to re-run

**Expected output (abridged):**

```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "bwb.db" at "file:/app/data/bwb.db"

N migrations found in prisma/migrations

Applying migration `…`

The following migration(s) have been applied:
...
All migrations have been successfully applied.
```

**⚠️ Data Safety:** `prisma migrate deploy` only applies committed migrations; it
does not reset the database, seed data, or delete existing rows.

### Step 4: Verify Deployment

Check application status:

```bash
# On server
docker ps --filter 'name=bwb-climbing'
docker logs bwb-climbing --tail 50

# From local machine
curl -I https://bwb.example.com
```

**Verification checklist:**

- [ ] Website loads at https://bwb.example.com
- [ ] Login works with existing credentials
- [ ] Container is running and healthy (`docker ps` shows `(healthy)`)
- [ ] No errors in `docker logs bwb-climbing`
- [ ] All existing data intact (users, entries, etc.)
- [ ] New features working as expected

---

## Data Import (Optional)

There is **no importer** for the original member dataset — that one-off pipeline
has been removed, and `package.json` defines no JSON- or CSV-import scripts.

To populate an instance, see `IMPLEMENTATION.md` §19 ("Populating development data"
and "Populating real member data"):

- **Reference data** (countries, regions, consent types, Halls of Fame) —
  `npm run db:seed`; it is idempotent and safe to re-run.
- **Real member data** — write your own importer; §19 lists the tables, password
  hashing, participation and cumulative-totals steps you must reproduce.

---

## Rollback Procedure

If deployment fails or causes issues:

### 1. Restore Code

The Docker image is built from your local checkout, so roll back by re-deploying
the previous revision (`deploy.sh` does not create code tarballs):

```bash
# From local machine
git checkout <previous-sha>

# Rebuild and ship the image (deploy.sh backs up the live database first)
npm run deploy
```

### 2. Restore Database (if migrated)

```bash
# On server
# Stop the container
docker stop bwb-climbing

# Backup current (broken) database
cp /srv/bwb/data/bwb.db /srv/bwb/data/bwb-broken.db

# Restore from backup (deploy.sh writes deploy-backup-*.db here)
cp /srv/bwb/backups/deploy-backup-TIMESTAMP.db /srv/bwb/data/bwb.db

# Start the container
docker start bwb-climbing
```

### 3. Verify Rollback

```bash
docker logs bwb-climbing --tail 50
curl -I https://bwb.example.com
```

---

## Server Management

### PM2 Commands

> These apply to the legacy non-Docker (PM2) install only. For the Docker
> deployment use `docker logs`, `docker restart`, `docker stop` / `docker start`,
> and `docker compose -f docker-compose.prod.yml`.

```bash
# View status
pm2 status

# View logs
pm2 logs bwb-climbing
pm2 logs bwb-climbing --lines 100
pm2 logs bwb-climbing --err  # errors only

# Restart app
pm2 restart bwb-climbing

# Stop app
pm2 stop bwb-climbing

# Start app
pm2 start bwb-climbing

# Reload (zero-downtime)
pm2 reload bwb-climbing

# View detailed info
pm2 show bwb-climbing

# Monitor in real-time
pm2 monit
```

### Database Commands

The maintenance scripts (`db:studio`, `db:export-members`, `db:reset-password`,
`db:cleanup-logs`) are **not shipped inside the Docker image** — `scripts/admin/`
and `scripts/data/` are excluded from it. Run them from a checkout, pointed at the
mounted database:

```bash
# From a local checkout, against the production database
DATABASE_URL="file:/srv/bwb/data/bwb.db" npm run db:studio
DATABASE_URL="file:/srv/bwb/data/bwb.db" npm run db:export-members
DATABASE_URL="file:/srv/bwb/data/bwb.db" npm run db:reset-password -- username 'new-password'

# Prune audit logs / rate-limit rows
DATABASE_URL="file:/srv/bwb/data/bwb.db" npm run db:cleanup-logs
```

### Nginx Commands

```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# View logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Environment Variables

### Required `.env` on Server

```bash
# Database
DATABASE_URL="file:/app/data/bwb.db"

# NextAuth
NEXTAUTH_SECRET="production-secret-here"
NEXTAUTH_URL="https://bwb.example.com"

# Email (Brevo)
BREVO_API_KEY="your-production-api-key"
BREVO_SENDER_EMAIL="noreply@bwb.example.com"

# Turnstile (Cloudflare CAPTCHA)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="production-site-key"
TURNSTILE_SECRET_KEY="production-secret-key"

# Node Environment
NODE_ENV="production"
```

**⚠️ Security:** Never commit `.env` to git. Store secrets in password manager.

---

## Monitoring & Logs

### Application Logs

```bash
# Real-time logs
docker logs -f bwb-climbing

# Last 100 lines
docker logs bwb-climbing --tail 100

# Save logs to file
docker logs bwb-climbing --tail 1000 > app-logs.txt
```

> The legacy non-Docker (PM2) install logs with `pm2 logs bwb-climbing`.

### System Logs

```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Database Monitoring

```bash
# Check database size
ls -lh /srv/bwb/data/bwb.db

# Check database integrity
sqlite3 /srv/bwb/data/bwb.db "PRAGMA integrity_check;"

# View database stats
sqlite3 /srv/bwb/data/bwb.db ".dbinfo"
```

---

## Troubleshooting

### Issue: Deployment script fails

**Symptoms:** rsync errors, permission denied

**Solution:**

```bash
# Check SSH access
ssh root@example.com 'echo "Connected"'

# Check SSH key
ssh-add -l

# Re-run deployment
npm run deploy
```

### Issue: Build fails

**Symptoms:** the Docker image build fails during `npm run deploy`

**Solution:**

```bash
# Reproduce the build locally
npm ci --legacy-peer-deps
npm run build

# Confirm the Node major (24.x is required)
node --version

# Clear the Next.js build cache and retry
rm -rf .next
npm run deploy
```

### Issue: App shows "Database locked"

**Symptoms:** `SQLITE_BUSY` errors in `docker logs bwb-climbing`

**Solution:**

```bash
cd /srv/bwb

# Stop the app so no writer holds the database
docker compose -f docker-compose.prod.yml stop

# Wait a few seconds
sleep 5

# Start it again
docker compose -f docker-compose.prod.yml start
```

SQLite allows only one writer. Do not run multiple app replicas against the same
database file.

### Issue: Migrations fail

**Symptoms:** Prisma migration errors during deploy

**Solution:**

```bash
cd /srv/bwb

# Check current migration status inside the container
docker compose -f docker-compose.prod.yml exec bwb-climbing npx prisma migrate status

# If a migration is recorded as failed but is known to be applied
docker compose -f docker-compose.prod.yml exec bwb-climbing \
  npx prisma migrate resolve --applied "migration-name"
```

> **Never run `prisma migrate reset` against production** — it drops and recreates
> the database. `prisma migrate deploy` applies pending migrations only.

### Issue: Can't access website

**Symptoms:** 502 Bad Gateway, connection refused

**Check list:**

1. Is the container running? `docker ps`
2. Is Nginx running? `systemctl status nginx`
3. Is port 1345 listening? `netstat -tlnp | grep 1345`
4. Check Nginx logs: `tail -f /var/log/nginx/error.log`
5. Check app logs: `docker logs bwb-climbing --tail 50`

**Solution:**

```bash
cd /srv/bwb
docker compose -f docker-compose.prod.yml restart
systemctl restart nginx
```

---

## Deployment Checklist

Use this checklist for every deployment:

### Pre-Deployment

- [ ] All tests passing locally
- [ ] Build successful locally
- [ ] Code committed and pushed to git
- [ ] Release notes prepared
- [ ] Backup verification (ensure backups working)

### During Deployment

- [ ] Run `npm run deploy`
- [ ] Verify deployment output (no errors, container healthy)
- [ ] Confirm migrations were applied (`deploy.sh` does this automatically)
- [ ] Check container status (`docker ps`)
- [ ] Check logs for errors (`docker logs bwb-climbing`)

### Post-Deployment

- [ ] Website loads
- [ ] Login works
- [ ] Critical features tested
- [ ] Database backup created
- [ ] No errors in logs
- [ ] Performance acceptable

### Rollback (If Needed)

- [ ] Restore from backup
- [ ] Restore database (if needed)
- [ ] Verify rollback successful
- [ ] Document issues encountered

---

## Continuous Deployment (Future)

### GitHub Actions (Planned)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "24"
      - run: npm ci --legacy-peer-deps
      - run: npm test
      - run: npm run build
      - name: Deploy
        run: npm run deploy
        env:
          SSH_KEY: ${{ secrets.SSH_KEY }}
```

---

## Related Documentation

- [Contributing Guide](../CONTRIBUTING.md) - Code map, workflow and local setup
- [Testing Guide](TESTING.md) - Running tests before deployment
- [Environment Variables](../.env.example) - Environment variables
- [Database Guide](DATABASE_SEEDING.md) - Database operations

---

## Support

**Issues during deployment?**

1. Check container logs: `docker logs bwb-climbing`
2. Check Nginx logs: `tail -f /var/log/nginx/error.log`
3. Review this guide's troubleshooting section
4. Contact system administrator

**Server Details:**

- Host: `example.com`
- App Directory: `/srv/bwb` (compose file and `.env`; database in `/srv/bwb/data`)
- Backup Directory: `/srv/bwb/backups`
- Nginx Config: `/etc/nginx/sites-available/bwb`
