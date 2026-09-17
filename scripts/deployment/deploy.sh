#!/bin/bash
# =============================================================================
# BWB Climbing App Production Deployment Script (Docker)
# =============================================================================
# Builds Docker image locally and transfers to server.
# Usage: ./scripts/deployment/deploy.sh
# =============================================================================

set -e  # Exit on any error

# Configuration
REMOTE_USER="root"
REMOTE_HOST="example.com"
REMOTE_PATH="/srv/bwb"
SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"
DOMAIN="example.com"
APP_NAME="bwb-climbing"
PORT=1345
IMAGE_TAR="/tmp/${APP_NAME}-image.tar"
LOCK_FILE="/tmp/${APP_NAME}-deploy.lock"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Cleanup function
cleanup() {
    if [ -f "${LOCK_FILE}" ]; then
        rm -f "${LOCK_FILE}"
        log_info "Deployment lock released"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Banner
echo -e "${BLUE}"
echo "=============================================="
echo "  BWB Climbing App Production Deployment"
echo "  Target: ${DOMAIN}"
echo "  Method: Local Build + Image Transfer"
echo "=============================================="
echo -e "${NC}"

# Deployment Lock Check
log_info "Checking for concurrent deployments..."
if [ -f "${LOCK_FILE}" ]; then
    LOCK_PID=$(cat "${LOCK_FILE}")
    if ps -p "${LOCK_PID}" > /dev/null 2>&1; then
        log_error "Another deployment is already in progress (PID: ${LOCK_PID})"
        log_error "If you're sure no deployment is running, remove: ${LOCK_FILE}"
        exit 1
    else
        log_warning "Stale lock file found (PID ${LOCK_PID} not running), removing..."
        rm -f "${LOCK_FILE}"
    fi
fi

# Create lock file
echo $$ > "${LOCK_FILE}"
log_success "Deployment lock acquired (PID: $$)"

# Step 0: Run Critical Tests (blocks deployment)
log_info "Running critical test suite (unit, API, contracts, e2e, integration)..."
if npm run test:unit && npm run test:api && npm run test:contracts && npm run test:e2e && npm run test:integration; then
    log_success "All critical tests passed ✓"
else
    log_error "Critical tests failed. Deployment aborted for safety."
    log_info "Fix the failing tests and try again."
    exit 1
fi

# Step 1: Generate Test Results JSON for Production (includes all tests for visibility)
log_info "Generating complete test results JSON for production admin panel..."
# Run test:results which generates JSON output for ALL tests (including component tests)
# Non-critical test failures are acceptable here - we want visibility into all test status
if npm run test:results; then
    log_success "Test results generated successfully"
    # Copy from data/test-results/ to root for deployment
    if [ -f "data/test-results/test-results.json" ]; then
        cp data/test-results/test-results.json test-results.json
        log_success "Test results copied to root for deployment"
    fi
else
    log_warning "Some non-critical tests failed, but deployment will continue"
    log_info "All critical tests passed - deployment is safe"
    # Copy even if some tests failed - we want to see what failed in the admin panel
    if [ -f "data/test-results/test-results.json" ]; then
        cp data/test-results/test-results.json test-results.json
        log_success "Test results copied despite non-critical failures for visibility"
    fi
fi

# Check if Docker is running locally
log_info "Checking local Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running locally. Please start Docker."
    exit 1
fi
log_success "Local Docker is running"

# Check if we can connect to server
log_info "Checking connection to ${REMOTE_HOST}..."
if ssh -q -o BatchMode=yes -o ConnectTimeout=5 ${SSH_TARGET} exit; then
    log_success "Connection successful"
else
    log_error "Cannot connect to ${SSH_TARGET}. Check SSH keys and connectivity."
    exit 1
fi

# Step 1: Detect if this is first Docker deployment (migration from PM2)
log_info "Checking deployment mode..."
IS_FIRST_DOCKER_DEPLOY="false"
CONTAINER_EXISTS=$(ssh ${SSH_TARGET} "docker ps -a --format '{{.Names}}' | grep -q '^${APP_NAME}$' && echo 'yes' || echo 'no'")
PM2_EXISTS=$(ssh ${SSH_TARGET} "pm2 list 2>/dev/null | grep -q '${APP_NAME}' && echo 'yes' || echo 'no'")

if [ "$CONTAINER_EXISTS" = "no" ] && [ "$PM2_EXISTS" = "yes" ]; then
    IS_FIRST_DOCKER_DEPLOY="true"
    log_warning "First Docker deployment detected - will migrate from PM2"
fi

# Step 2: If first Docker deploy, migrate data from PM2 setup
if [ "$IS_FIRST_DOCKER_DEPLOY" = "true" ]; then
    log_info "Migrating from PM2 to Docker..."
    
    ssh ${SSH_TARGET} << 'MIGRATE_EOF'
        set -e
        
        echo "📦 Creating pre-migration backup..."
        BACKUP_NAME="pre-docker-migration-$(date +%Y%m%d-%H%M%S)"
        mkdir -p /srv/bwb/backups
        if [ -f /srv/bwb/app/prisma/dev.db ]; then
            cp /srv/bwb/app/prisma/dev.db "/srv/bwb/backups/${BACKUP_NAME}.db"
            echo "✅ Database backed up to /srv/bwb/backups/${BACKUP_NAME}.db"
        fi
        
        echo "🛑 Stopping PM2 application..."
        pm2 stop bwb-climbing 2>/dev/null || echo "PM2 app not running"
        pm2 delete bwb-climbing 2>/dev/null || echo "PM2 app not found"
        pm2 save 2>/dev/null || true
        
        echo "📁 Setting up Docker directory structure..."
        mkdir -p /srv/bwb/data
        mkdir -p /srv/bwb/uploads/change-requests
        mkdir -p /srv/bwb/uploads/consent-types
        mkdir -p /srv/bwb/uploads/documents
        mkdir -p /srv/bwb/uploads/user-consents
        mkdir -p /srv/bwb/uploads/notes
        mkdir -p /srv/bwb/uploads/support-requests
        mkdir -p /srv/bwb/uploads/changes
        mkdir -p /srv/bwb/uploads/journal
        mkdir -p /srv/bwb/backups
        
        echo "🗃️ Moving database to new location..."
        if [ -f /srv/bwb/app/prisma/dev.db ]; then
            cp /srv/bwb/app/prisma/dev.db /srv/bwb/data/bwb.db
            echo "✅ Database moved to /srv/bwb/data/bwb.db"
        else
            echo "⚠️ No existing database found at /srv/bwb/app/prisma/dev.db"
        fi
        
        echo "📂 Ensuring uploads are in place..."
        if [ -d /srv/bwb/uploads ]; then
            echo "✅ Uploads directory exists at /srv/bwb/uploads/"
            ls -la /srv/bwb/uploads/
        fi
        
        echo "🧹 Cleaning up old PM2 app directory..."
        rm -f /srv/bwb/app/ecosystem.config.js 2>/dev/null || true
        rm -rf /srv/bwb/app/node_modules 2>/dev/null || true
        rm -rf /srv/bwb/app/.next 2>/dev/null || true
        
        echo "✅ Migration preparation complete"
MIGRATE_EOF
    
    log_success "PM2 to Docker migration complete"
fi

# Step 3: Build Docker image locally
log_info "Building Docker image locally..."
log_info "This may take 2-3 minutes..."

# Get version and git SHA for image tagging
VERSION=$(node -p "require('./version.json').version")
GIT_SHA=$(git rev-parse --short HEAD)
IMAGE_TAG="${VERSION}-${GIT_SHA}"

log_info "Building image with tag: ${IMAGE_TAG}"
docker build -t ${APP_NAME}:${IMAGE_TAG} -t ${APP_NAME}:latest .

log_success "Docker image built successfully (${IMAGE_TAG})"

# Step 4: Save and transfer image
log_info "Saving Docker image to tar file..."
docker save ${APP_NAME}:latest -o ${IMAGE_TAR}
IMAGE_SIZE=$(du -h ${IMAGE_TAR} | cut -f1)
log_success "Image saved (${IMAGE_SIZE}, tag: ${IMAGE_TAG})"

log_info "Transferring image to server..."
log_info "This may take a few minutes depending on connection speed..."
rsync -avz --progress ${IMAGE_TAR} ${SSH_TARGET}:/tmp/

log_success "Image transferred"

# Step 5: Load image on server and cleanup
log_info "Loading image on server..."
ssh ${SSH_TARGET} "docker load -i /tmp/${APP_NAME}-image.tar && rm /tmp/${APP_NAME}-image.tar"
log_success "Image loaded on server"

# Cleanup local tar
rm -f ${IMAGE_TAR}

# Step 6: Sync docker-compose and .env files
log_info "Syncing configuration files..."
rsync -avz docker-compose.prod.yml ${SSH_TARGET}:${REMOTE_PATH}/

# Step 6b: Sync test results to server
log_info "Syncing test results to server..."
ssh ${SSH_TARGET} "mkdir -p ${REMOTE_PATH}/data/test-results"
# Copy the latest test results from root (generated by npm run test:results)
rsync -avz test-results.json ${SSH_TARGET}:${REMOTE_PATH}/data/test-results/test-results.json
log_success "Test results synced (latest run from test:results)"

# Step 6c: Export and sync git commits
log_info "Exporting git commits..."
npx ts-node scripts/deployment/export-git-commits.ts
ssh ${SSH_TARGET} "mkdir -p ${REMOTE_PATH}/data/git-commits"
rsync -avz data/git-commits/commits.json ${SSH_TARGET}:${REMOTE_PATH}/data/git-commits/
log_success "Git commits exported and synced"

# Check/create .env on server
if ! ssh ${SSH_TARGET} "[ -f ${REMOTE_PATH}/.env ]"; then
    log_warning ".env file NOT found on server, creating default..."
    ssh ${SSH_TARGET} << EOF
        cat > ${REMOTE_PATH}/.env << 'ENVEOF'
NEXTAUTH_SECRET=\$(openssl rand -base64 32)
NEXTAUTH_URL=https://${DOMAIN}
DATABASE_URL=file:/app/data/bwb.db
UPLOADS_DIR=/app/uploads
BACKUP_DIR=/app/backups
NODE_ENV=production
PORT=${PORT}
ENVEOF
EOF
    log_success "Default .env file created"
else
    log_success ".env file found on server"
fi

# Step 6d: Ensure host volume directories exist and are writable by the container user
# The container runs as UID/GID 1001 (nodejs). Bind mounts inherit host permissions.
log_info "Ensuring /srv/bwb volume permissions..."
ssh ${SSH_TARGET} << 'VOLUMES_EOF'
    set -e

    # Create host dirs (idempotent)
    mkdir -p /srv/bwb/data /srv/bwb/uploads /srv/bwb/backups

    # Ensure DB file exists so the app can boot even on fresh installs
    if [ ! -f /srv/bwb/data/bwb.db ]; then
        : > /srv/bwb/data/bwb.db
    fi

    # Set ownership to match container user (UID 1001)
    chown -R 1001:1001 /srv/bwb/data /srv/bwb/uploads /srv/bwb/backups

    # Reasonable permissions (dirs executable, db writable)
    chmod 755 /srv/bwb/data /srv/bwb/uploads /srv/bwb/backups
    chmod 664 /srv/bwb/data/bwb.db || true
VOLUMES_EOF
log_success "Volume directories ready"

# Step 7: Pre-deployment Backup (if DB file exists)
log_info "Creating pre-deployment backup (if database exists)..."
ssh ${SSH_TARGET} "
    if [ -f /srv/bwb/data/bwb.db ]; then
        BACKUP_FILE=\"/srv/bwb/backups/deploy-backup-\$(date +%Y%m%d-%H%M%S).db\"
        cp /srv/bwb/data/bwb.db \"\$BACKUP_FILE\"
        echo \"Backup created: \$BACKUP_FILE\"
    else
        echo 'No database to backup'
    fi
"

# Step 7b: Apply Prisma migrations BEFORE starting the app
# This creates/updates /srv/bwb/data/bwb.db and avoids boot-time failures.
log_info "Applying Prisma migrations (docker one-off)..."
ssh ${SSH_TARGET} "cd ${REMOTE_PATH} && \
    docker run --rm \
        --env-file .env \
        -e DATABASE_URL=file:/app/data/bwb.db \
        -v /srv/bwb/data:/app/data \
        -v /srv/bwb/uploads:/app/uploads \
        -v /srv/bwb/backups:/app/backups \
        ${APP_NAME}:latest \
        sh -c 'npx prisma migrate deploy --schema prisma/schema.prisma'" || {
        log_error "Migration failed. Recent Docker output:";
        ssh ${SSH_TARGET} "docker image ls | head -10" || true
        exit 1
}
log_success "Migrations applied"

# Step 8: Start container
log_info "Starting container..."
ssh ${SSH_TARGET} "cd ${REMOTE_PATH} && \
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true && \
    docker compose -f docker-compose.prod.yml up -d"
log_success "Container started"

# Step 8b: Skip `prisma db push` in production.
# Migrations are applied in Step 7b.
log_info "Skipping prisma db push (migrations already applied)"

# Legal documents are copied directly via Dockerfile (COPY data/legal ./data/legal)
# No seeding needed - files are part of the Docker image

# Step 9: Cleanup old images on server
log_info "Cleaning up old images..."
ssh ${SSH_TARGET} "docker image prune -f > /dev/null 2>&1"

# Step 10: Wait for Health Check
log_info "Waiting for container to be ready..."
for i in {1..15}; do
    # Use docker exec to check health from inside the container (wget is available in alpine)
    if ssh ${SSH_TARGET} "docker exec ${APP_NAME} wget -q --spider http://localhost:${PORT}/api/health 2>/dev/null"; then
        log_success "Container is healthy"
        break
    fi
    if [ $i -eq 15 ]; then
        log_error "Container failed to become healthy"
        ssh ${SSH_TARGET} "docker logs ${APP_NAME} --tail 30"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""

# Step 11: Database schema changes
# NOTE: We intentionally do NOT run `prisma db push` in production.
# - It can change the schema in ways that risk data integrity.
# - Prisma 7 uses `prisma.config.ts` for datasource URL; the production container does not need Prisma CLI.
# Apply schema changes via explicit migrations in a separate, controlled step if needed.
log_info "Skipping automatic database schema changes"

# Step 12: Verify Nginx
log_info "Verifying Nginx configuration..."
ssh ${SSH_TARGET} << 'NGINX_EOF'
    if [ -f "/etc/nginx/sites-available/example.com" ] && [ -L "/etc/nginx/sites-enabled/example.com" ]; then
        echo "✅ Nginx configuration is set up"
        if nginx -t >/dev/null 2>&1; then
            echo "✅ Nginx configuration is valid"
        else
            echo "⚠️ Nginx configuration has errors"
        fi
    else
        echo "⚠️ Nginx configuration missing - run setup-nginx.sh"
    fi
NGINX_EOF

# Step 13: Cleanup old backups
log_info "Cleaning up old backups..."
ssh ${SSH_TARGET} << 'CLEANUP_EOF'
    find /srv/bwb/backups -name '*.db' -type f -mtime +30 -delete 2>/dev/null || true
    find /srv/bwb/backups -name '*.tar.gz' -type f -mtime +30 -delete 2>/dev/null || true
    cd /srv/bwb/backups && ls -t *.db 2>/dev/null | tail -n +11 | xargs -r rm -f
    
    BACKUP_COUNT=$(ls -1 /srv/bwb/backups/*.db 2>/dev/null | wc -l)
    BACKUP_SIZE=$(du -sh /srv/bwb/backups 2>/dev/null | cut -f1)
    echo "📊 Total backups: $BACKUP_COUNT | Disk usage: $BACKUP_SIZE"
CLEANUP_EOF

log_success "Deployment complete!"
echo ""
echo -e "${GREEN}=============================================="
echo "  ✓ Deployment Successful!"
echo "  App: https://${DOMAIN}"
echo "==============================================${NC}"
echo ""

# Show useful commands
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "  View logs:    ssh ${SSH_TARGET} 'docker logs ${APP_NAME} -f'"
echo "  Restart:      ssh ${SSH_TARGET} 'cd ${REMOTE_PATH} && docker compose -f docker-compose.prod.yml restart'"
echo "  Stop:         ssh ${SSH_TARGET} 'cd ${REMOTE_PATH} && docker compose -f docker-compose.prod.yml down'"
echo "  Status:       ssh ${SSH_TARGET} 'docker ps | grep ${APP_NAME}'"
echo "  Shell:        ssh ${SSH_TARGET} 'docker exec -it ${APP_NAME} sh'"
echo "  Check URL:    curl -I https://${DOMAIN}"
echo ""

# Show container status
echo -e "${BLUE}📊 Container Status:${NC}"
ssh ${SSH_TARGET} "docker ps --filter 'name=${APP_NAME}' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
echo ""

# Show directory structure
echo -e "${BLUE}📁 Directory Structure:${NC}"
ssh ${SSH_TARGET} "echo '/srv/bwb/' && find /srv/bwb -maxdepth 2 -type d 2>/dev/null | head -15 | sed 's|/srv/bwb|  |g' | sort"