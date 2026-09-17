#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}   BWB Project Health Check${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Track failures
LINT_FAILED=0
TS_FAILED=0
BUILD_FAILED=0

# 1. ESLint Check
# Warning budget (ratchet): the repo currently has 69 jsx-a11y warnings and 0
# errors. The budget stops NEW warnings being added; lower it as warnings are
# fixed, and never raise it. Errors always fail.
ESLINT_MAX_WARNINGS=69
echo -e "${YELLOW}[1/3] Running ESLint...${NC}"
if npx eslint . --max-warnings="${ESLINT_MAX_WARNINGS}" > /tmp/lint.log 2>&1; then
    echo -e "${GREEN}✓ ESLint: PASSED${NC} (warning budget ${ESLINT_MAX_WARNINGS})"
else
    LINT_FAILED=1
    ERROR_COUNT=$(grep -oP '\d+ problems' /tmp/lint.log | grep -oP '^\d+' || echo "unknown")
    echo -e "${RED}✗ ESLint: FAILED${NC} (${ERROR_COUNT} problems)"
    echo "  Run: npm run lint (or npx eslint .)"
    echo "  If the only change is new warnings, fix them rather than raising"
    echo "  ESLINT_MAX_WARNINGS in this script."
fi
echo ""

# 2. TypeScript Check
echo -e "${YELLOW}[2/3] Running TypeScript check...${NC}"
if npx tsc --noEmit --skipLibCheck > /tmp/tsc.log 2>&1; then
    echo -e "${GREEN}✓ TypeScript: PASSED${NC}"
else
    TS_FAILED=1
    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc.log || echo "0")
    echo -e "${RED}✗ TypeScript: FAILED${NC} (${ERROR_COUNT} errors)"
    echo "  Run: npx tsc --noEmit --skipLibCheck"
    echo "  First few errors:"
    head -n 5 /tmp/tsc.log | sed 's/^/    /'
fi
echo ""

# 3. Build Check
echo -e "${YELLOW}[3/3] Running Next.js build...${NC}"
if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓ Build: PASSED${NC}"
    BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1)
    echo "  Build size: ${BUILD_SIZE}"
else
    BUILD_FAILED=1
    echo -e "${RED}✗ Build: FAILED${NC}"
    echo "  Run: npm run build"
    echo "  Error:"
    grep -A 5 "Failed to compile" /tmp/build.log | sed 's/^/    /'
fi
echo ""

# Summary
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}           SUMMARY${NC}"
echo -e "${BLUE}================================${NC}"

TOTAL_FAILED=$((LINT_FAILED + TS_FAILED + BUILD_FAILED))

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ ${TOTAL_FAILED}/3 checks failed${NC}"
    echo ""
    echo "Fix order recommendation:"
    if [ $LINT_FAILED -eq 1 ]; then
        echo "  1. Fix ESLint errors first"
    fi
    if [ $TS_FAILED -eq 1 ]; then
        echo "  2. Fix TypeScript errors"
    fi
    if [ $BUILD_FAILED -eq 1 ]; then
        echo "  3. Run build to verify"
    fi
    echo ""
    echo "Quick commands:"
    echo "  Lint only:  npx eslint ."
    echo "  TS only:    npx tsc --noEmit --skipLibCheck"
    echo "  Build only: npm run build"
    echo "  All checks: npm run check:all"
    exit 1
fi
