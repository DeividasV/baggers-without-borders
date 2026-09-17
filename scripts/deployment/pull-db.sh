#!/bin/bash
# =============================================================================
# Pull Production Database to Local for Testing
# =============================================================================
# Downloads the production database and optionally restores it locally
# Usage: ./scripts/deployment/pull-db.sh [--restore]
# =============================================================================

set -e  # Exit on any error

# Configuration
REMOTE_USER="root"
REMOTE_HOST="example.com"
REMOTE_DB_PATH="/srv/bwb/data/bwb.db"
SSH_TARGET="${REMOTE_USER}@${REMOTE_HOST}"
LOCAL_BACKUP_DIR="./backups/pulled-from-prod"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOCAL_BACKUP_FILE="${LOCAL_BACKUP_DIR}/prod-db-${TIMESTAMP}.db"
LOCAL_DB_PATH="./prisma/dev.db"

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

# Parse arguments
RESTORE_LOCAL=false
COMPARE_SCHEMAS=false
SCHEMA_ONLY=false
if [[ "$1" == "--restore" ]]; then
    RESTORE_LOCAL=true
elif [[ "$1" == "--compare" ]]; then
    COMPARE_SCHEMAS=true
elif [[ "$1" == "--schema" ]]; then
    SCHEMA_ONLY=true
fi

# Banner
echo -e "${BLUE}"
echo "=============================================="
echo "  Pull Production Database to Local"
echo "  Source: ${REMOTE_HOST}"
echo "=============================================="
echo -e "${NC}"

# Check if we can connect to server
log_info "Checking connection to ${REMOTE_HOST}..."
if ssh -q -o BatchMode=yes -o ConnectTimeout=5 ${SSH_TARGET} exit; then
    log_success "Connection successful"
else
    log_error "Cannot connect to ${SSH_TARGET}. Check SSH keys and connectivity."
    exit 1
fi

# Check if remote database exists
log_info "Checking if production database exists..."
if ! ssh ${SSH_TARGET} "test -f ${REMOTE_DB_PATH}"; then
    log_error "Production database not found at ${REMOTE_DB_PATH}"
    exit 1
fi

# Get remote database size
REMOTE_SIZE=$(ssh ${SSH_TARGET} "du -h ${REMOTE_DB_PATH} | cut -f1")
log_success "Production database found (${REMOTE_SIZE})"

# Create local backup directory
log_info "Creating local backup directory..."
mkdir -p "${LOCAL_BACKUP_DIR}"
log_success "Backup directory ready: ${LOCAL_BACKUP_DIR}"

# Download production database
log_info "Downloading production database..."
log_info "This may take a moment depending on database size and connection speed..."
scp ${SSH_TARGET}:${REMOTE_DB_PATH} "${LOCAL_BACKUP_FILE}"
LOCAL_SIZE=$(du -h "${LOCAL_BACKUP_FILE}" | cut -f1)
log_success "Database downloaded successfully (${LOCAL_SIZE})"
log_success "Saved to: ${LOCAL_BACKUP_FILE}"

# If schema-only flag is set, extract and display schema then exit
if [ "$SCHEMA_ONLY" = true ]; then
    log_info "Extracting schema from production database..."
    echo ""
    echo -e "${GREEN}==================== PRODUCTION DATABASE SCHEMA ====================${NC}"
    echo ""
    sqlite3 "${LOCAL_BACKUP_FILE}" ".schema"
    echo ""
    echo -e "${GREEN}====================================================================${NC}"
    echo ""
    log_success "Schema extracted successfully"
    log_info "Database file saved to: ${LOCAL_BACKUP_FILE}"
    exit 0
fi

# If restore flag is set, replace local dev database
if [ "$RESTORE_LOCAL" = true ]; then
    log_warning "⚠️  RESTORE MODE: This will replace your local development database!"
    log_info "Current local database will be backed up first..."
    
    # Backup current local database if it exists
    if [ -f "${LOCAL_DB_PATH}" ]; then
        LOCAL_BACKUP_NAME="./backups/pre-restore-${TIMESTAMP}.db"
        mkdir -p ./backups
        cp "${LOCAL_DB_PATH}" "${LOCAL_BACKUP_NAME}"
        log_success "Current local database backed up to: ${LOCAL_BACKUP_NAME}"
    fi
    
    # Copy downloaded database to local dev location
    cp "${LOCAL_BACKUP_FILE}" "${LOCAL_DB_PATH}"
    log_success "Production database restored to: ${LOCAL_DB_PATH}"
    
    # Regenerate Prisma Client
    log_info "Regenerating Prisma Client..."
    npx prisma generate
    log_success "Prisma Client regenerated"
    
    log_success "✅ Local database restored from production"
    log_info "You can now test with production data locally"
elif [ "$COMPARE_SCHEMAS" = true ]; then
    log_info "Extracting schema from downloaded database..."
    sqlite3 "${LOCAL_BACKUP_FILE}" ".schema" > "${LOCAL_BACKUP_DIR}/prod-schema-${TIMESTAMP}.sql"
    
    log_info "Extracting schema from development database..."
    if [ -f "${LOCAL_DB_PATH}" ]; then
        sqlite3 "${LOCAL_DB_PATH}" ".schema" > "${LOCAL_BACKUP_DIR}/dev-schema-${TIMESTAMP}.sql"
        
        log_info "Comparing schemas..."
        echo ""
        diff -u "${LOCAL_BACKUP_DIR}/prod-schema-${TIMESTAMP}.sql" "${LOCAL_BACKUP_DIR}/dev-schema-${TIMESTAMP}.sql" > "${LOCAL_BACKUP_DIR}/schema-diff-${TIMESTAMP}.diff" || true
        
        DIFF_SIZE=$(wc -l < "${LOCAL_BACKUP_DIR}/schema-diff-${TIMESTAMP}.diff")
        
        if [ "$DIFF_SIZE" -eq 0 ]; then
            log_success "✅ Schemas are IDENTICAL - Production and development databases match!"
        else
            log_warning "⚠️  Schemas DIFFER - Found ${DIFF_SIZE} lines of differences"
            echo ""
            log_info "Difference summary (first 50 lines):"
            echo "---"
            head -50 "${LOCAL_BACKUP_DIR}/schema-diff-${TIMESTAMP}.diff"
            echo "---"
            echo ""
            log_info "Full diff saved to: ${LOCAL_BACKUP_DIR}/schema-diff-${TIMESTAMP}.diff"
        fi
    else
        log_error "Development database not found at ${LOCAL_DB_PATH}"
        log_info "Run 'npm run db:migrate' or 'npm run db:seed' to initialize local database first"
        exit 1
    fi
else
    log_info "Database downloaded but NOT restored to local dev.db"
    log_info "Stored safely in: ${LOCAL_BACKUP_FILE}"
    log_info ""
    log_info "To restore it to your local development database, run:"
    log_info "  ./scripts/deployment/pull-db.sh --restore"
    log_info ""
    log_warning "⚠️  Note: Restore will replace your current local database"
fi

# Summary
echo ""
echo -e "${GREEN}=============================================="
echo "  Download Complete"
echo "=============================================="
echo -e "Downloaded: ${LOCAL_BACKUP_FILE} (${LOCAL_SIZE})"
if [ "$RESTORE_LOCAL" = true ]; then
    echo -e "Restored to: ${LOCAL_DB_PATH}"
fi
echo -e "${NC}"
