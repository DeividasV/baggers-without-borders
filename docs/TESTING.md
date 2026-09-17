# Testing Guide

**BWB (Baggers Without Borders) - Comprehensive Testing Documentation**

---

## Quick Reference

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test types
npm run test:unit           # Unit tests only
npm run test:api            # API route tests (--runInBand for SQLite)
npm run test:integration    # Integration workflow tests
npm run test:components     # Component tests only
npm run test:contracts      # API contract tests
npm run test:e2e            # End-to-end flow tests
npm run test:a11y           # Accessibility tests
```

---

## Test Suite Overview

**Current Status:** ⚠️ **Partially red** — **4,312 tests · 4,166 passing · 74 failing · 72 skipped** (23 failing suites of 167)  
**Coverage:** Unit, Component, API, Integration, Contracts, E2E, Accessibility, Security, Responsive, Regression  
**Framework:** Jest + React Testing Library

The figures are a point-in-time snapshot from
`data/test-results/test-results.json` (see [CONTRIBUTING.md §7](../CONTRIBUTING.md#7-testing)
and `/admin/test-results`); regenerate them with `npm run test:results`. Per
`CONTRIBUTING.md`, the failures are stale test copy rather than product defects.

### Test Distribution

Test-file counts come from the current `__tests__/` tree; test counts come from
`data/test-results/test-results.json` where the suite is part of that run.

| Suite         | Location                 | Test files | Tests          |
| ------------- | ------------------------ | ---------- | -------------- |
| Unit          | `__tests__/unit/`        | 19         | 393            |
| API           | `__tests__/api/`         | 21         | 221            |
| Components    | `__tests__/components/`  | 102        | 3,286          |
| Integration   | `__tests__/integration/` | 9          | run separately |
| Contracts     | `__tests__/contracts/`   | 2          | run separately |
| E2E           | `__tests__/e2e/`         | 9          | run separately |
| Accessibility | `__tests__/a11y/`        | 9          | 121            |
| Security      | `__tests__/security/`    | 2          | 12             |
| Responsive    | `__tests__/responsive/`  | 4          | 99             |
| Regression    | `__tests__/regression/`  | 2          | 29             |
| App           | `__tests__/app/`         | 4          | 44             |
| Lib           | `__tests__/lib/`         | 2          | 36             |
| Types         | `__tests__/types/`       | 1          | 19             |

`__tests__/utils/` and `__tests__/fixtures/` hold shared helpers and mock data,
not test files. Integration, contracts and E2E run under their own Jest configs
(`jest.integration.config.js`, `jest.contracts.config.js`, `jest.e2e.config.js`)
and are therefore not included in the `test-results.json` snapshot.

---

## Testing Framework Stack

### Core Dependencies

- **Jest** (v30.2.0) - Test framework and runner
- **React Testing Library** (v16.3.1) - Component testing utilities
- **@testing-library/jest-dom** (v6.9.1) - Custom DOM matchers
- **@testing-library/user-event** (v14.6.1) - User interaction simulation
- **next/jest** - Next.js-aware Jest configuration and TypeScript transform pipeline

TypeScript test files run through the repository's Next.js Jest integration, defined in [jest.config.js](../jest.config.js) and the sibling Jest config files for integration, contracts, and e2e suites. This repository does not currently use `ts-jest`.

### Configuration Files

- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Global test setup (DOM matchers, env vars)
- `jest.globalSetup.js` - Database setup for API tests
- `jest.integration.config.js` - Integration test configuration
- `jest.env.js` - Environment variables for tests

---

## Test Categories

### 1. Unit Tests

**Location:** `__tests__/unit/`  
**Purpose:** Test individual functions and utilities in isolation

#### What's Covered:

- **Utility Functions** (`utils.test.ts`)
  - Date formatting (formatDateYMD, formatDateTime, formatTimeAgo)
  - Number formatting (formatNumber, formatFileSize)
  - Text utilities (truncateText, getInitials)
  - Badge variant mapping
  - File validation
- **HOF Tier Logic** (`hofTierUtils.test.ts`)
  - Tier assignment (Gold/Silver/Bronze)
  - Tie-breaking rules
  - Member sorting by peaks
- **Auth Helpers** (`auth.test.ts`, `api-auth.test.ts`)
  - Session validation
  - Role checking
  - Token generation

#### Running Unit Tests:

```bash
npm run test:unit

# Watch mode
npm run test:unit -- --watch

# Specific file
npm run test:unit -- --testPathPatterns=utils
```

---

### 2. API Route Tests

**Location:** `__tests__/api/`  
**Purpose:** Test Next.js API route handlers (request/response handling)

#### What's Covered:

- **Authentication** (`auth.api.test.ts`)
  - Login flow
  - Password validation
  - JWT token handling
  - Session management
- **Users** (`users.api.test.ts`)
  - CRUD operations
  - Pagination
  - Search & filtering (username, email, country, role, status)
  - Advanced filters (birth year range)
  - Password hashing
  - Duplicate detection
- **HOF Entries** (`hof-entries.api.test.ts`)
  - Entry creation & updates
  - Total recalculation logic
  - Cumulative peak totals
  - Multi-year workflows
- **HOF Year Configs** (`hof-year-configs.api.test.ts`)
  - Configuration management
  - Award tier setup (Gold/Silver/Bronze)
  - LCE country mappings
  - Admin-only access enforcement
- **Countries & Regions** (`countries.api.test.ts`, `regions.api.test.ts`)
  - Geographic data management
  - Country-region relationships

#### Important: Database Tests Run Sequentially

SQLite doesn't handle concurrent writes well. Always use `--runInBand`:

```bash
npm run test:api                    # Runs with --runInBand by default
npm run test:api -- --watch         # Watch mode

# To test specific API
npm run test:api -- --testPathPatterns=users
```

---

### 3. Integration Tests

**Location:** `__tests__/integration/`  
**Purpose:** Test complete workflows across multiple components/APIs

#### What's Covered:

- **User Registration Flow** (`critical-flows.integration.test.ts`)
  1. Create user with country
  2. Verify HOF participation setup
  3. Verify Year participation setup
  4. Fetch user with relationships
- **HOF Entry & Recalculation Flow**
  1. Create entries across multiple years
  2. Verify cumulative totals (Year 1: 60, Year 2: 105, Year 3: 135)
  3. Update entries
  4. Verify total recalculation
- **HOF Configuration Workflow** (`hof-entries.integration.test.ts`)
  - Year configuration CRUD
  - Peak requirements validation
  - Filter operations
  - Multi-year workflows
- **Document Management** (`document-management.integration.test.ts`)
  - File upload handling
  - Folder/document relationships
  - Tag operations
  - Search & filtering
- **Country/Region Management** (`country-region.integration.test.ts`)
  - Geographic data relationships
  - CRUD operations

#### Running Integration Tests:

```bash
npm run test:integration
npm run test:integration -- --watch
```

---

### 4. Component Tests

**Location:** `__tests__/components/`  
**Purpose:** Test React component rendering and user interactions

#### What's Covered:

- **UI Components** (`__tests__/components/ui/`)
  - Button variants (primary, secondary, danger, etc.)
  - Badge colors (default, primary, success, warning, danger)
  - Input validation
  - Modal behavior
  - Pagination controls
  - Search inputs
  - Date pickers
  - Switches & selects
- **Feature Components** (`__tests__/components/features/`)
  - HOF tables
  - Member management
  - Document file managers
  - User profile sections

#### Example Component Test:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui";

describe("Button", () => {
  it("renders with correct variant classes", () => {
    render(<Button variant="primary">Click Me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toHaveClass("bg-primary-600");
  });

  it("calls onClick when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Running Component Tests:

```bash
npm run test:components
npm run test:components -- --watch
```

---

## E2E Testing

**Framework:** Jest (Next.js route handlers plus `@testing-library/react`) — driven by `jest.e2e.config.js`  
**Location:** `__tests__/e2e/` (9 test files under `api/` and `flows/`, matched by `**/__tests__/e2e/**/*.e2e.test.ts`)  
**Command:** `npm run test:e2e` (`jest --config=jest.e2e.config.js --runInBand --forceExit`)

E2E is Jest-based, not Playwright: Playwright is **not** a dependency in
`package.json` and there is no root-level `e2e/` directory. The suite runs
sequentially (`maxWorkers: 1`) to avoid SQLite write contention, with a
30-second per-test timeout, and exercises the full stack against the database.

### When to Use E2E Tests:

- Full user journeys across multiple pages
- Route-handler flows against a real database
- Multi-step API interactions (registration, HOF qualification)

### Running E2E Tests:

```bash
npm run test:e2e

# Watch mode
npm run test:e2e:watch
```

---

## Test Patterns & Best Practices

### 1. API Route Testing Pattern

```typescript
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/users/route";

describe("GET /api/users", () => {
  beforeEach(async () => {
    // Clean database
    await prisma.user.deleteMany();
  });

  it("returns paginated users", async () => {
    // Create test data
    await prisma.user.create({
      data: {
        /* ... */
      },
    });

    // Create request
    const request = new NextRequest("http://localhost:3000/api/users?page=1&limit=10");

    // Call handler
    const response = await GET(request);
    const data = await response.json();

    // Assertions
    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.total).toBe(1);
  });
});
```

### 2. Component Testing Pattern

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("MyComponent", () => {
  it("handles user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    // Find elements
    const button = screen.getByRole("button", { name: /submit/i });

    // Simulate interaction
    await user.click(button);

    // Assert outcome
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Integration Testing Pattern

```typescript
describe("Complete User Workflow", () => {
  it("creates user and sets up participations", async () => {
    // Step 1: Create user
    const user = await prisma.user.create({
      data: {
        /* ... */
      },
    });

    // Step 2: Verify HOF participations
    const hofParticipations = await prisma.userHofParticipation.findMany({
      where: { userId: user.id },
    });
    expect(hofParticipations).toHaveLength(5);

    // Step 3: Verify Year participations
    const yearParticipations = await prisma.userYearParticipation.findMany({
      where: { userId: user.id },
    });
    expect(yearParticipations.length).toBeGreaterThan(0);
  });
});
```

---

## Writing New Tests

### Step 1: Choose Test Type

- **Unit Test** → Pure function, no external dependencies
- **API Test** → Testing route handlers
- **Integration Test** → Multi-step workflow across systems
- **Component Test** → React component rendering/interaction

### Step 2: Create Test File

```bash
# Unit test
touch __tests__/unit/my-utility.test.ts

# API test
touch __tests__/api/my-route.api.test.ts

# Integration test
touch __tests__/integration/my-workflow.integration.test.ts

# Component test
touch __tests__/components/features/my-component/MyComponent.test.tsx
```

### Step 3: Write Test Structure

```typescript
describe("Feature/Function Name", () => {
  // Setup
  beforeEach(() => {
    // Reset state, mock functions, etc.
  });

  // Teardown
  afterEach(() => {
    // Clean up
  });

  // Test cases
  describe("specific behavior", () => {
    it("does what it should", () => {
      // Arrange
      const input = "test";

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

---

## Test Data Management

### Mock Data Location

- `__tests__/utils/mock-data.ts` - Reusable test fixtures
- `__tests__/utils/test-utils.tsx` - Custom render functions with providers
- `__tests__/utils/test-data-factory.ts` - Database-backed factories (below)
- `__tests__/utils/test-db-setup.ts` - Test database lifecycle helpers

### Creating Test Data

Build plain object literals from `mock-data.ts`. When a test needs Prisma to
resolve real relations, use the database-backed factories instead — they insert
actual rows:

| Factory                                                       | Purpose                                           |
| ------------------------------------------------------------- | ------------------------------------------------- |
| `createBaseTestData(prisma)`                                  | Baseline reference rows; returns a context object |
| `createTestUser` / `createTestAdmin` / `createCompleteUser`   | Users at increasing completeness                  |
| `createRegions`, `createConsentTypes`                         | Geography and consent reference data              |
| `createHofYearConfig`                                         | One Hall-of-Fame-year configuration               |
| `createUserHofParticipations`, `createUserYearParticipations` | Participation rows the HoF tables read            |
| `createCompleteHofEntry(prisma, { totalPeaks, peaksInYear })` | A fully populated `HofEntry`                      |
| `createHofEntries`, `createTestDocument`                      | Bulk entries and document rows                    |

Database lifecycle helpers live in `test-db-setup.ts`: `initTestDb`, `cleanTestDb`,
`getTestDb`, `backupTestDb`, `restoreTestDb`, `deleteTestDb`, `setupTestDatabase`
and `teardownTestDatabase`. Separately, `jest.globalSetup.js` creates
`prisma/test.db` and applies migrations once before any test file is loaded.

---

## Coverage Requirements

### Current Coverage Goals:

- **Unit Tests:** 90%+ coverage for utilities
- **API Tests:** 85%+ coverage for critical routes (users, HOFs, auth)
- **Integration Tests:** All major workflows covered
- **Component Tests:** 70%+ coverage for UI components

### Viewing Coverage:

```bash
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

---

## Debugging Tests

### 1. Run Single Test:

```bash
npm test -- --testNamePattern="specific test name"
```

### 2. Debug in VS Code:

Add this to your own `.vscode/launch.json` (create the file if you do not have one; it is not part of the repository):

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "--watchAll=false"],
  "console": "integratedTerminal"
}
```

### 3. Use console.log:

```typescript
it("debugs test", () => {
  console.log("Current state:", myVariable);
  expect(myVariable).toBe(expected);
});
```

### 4. Inspect Component Output:

```typescript
import { screen, debug } from "@testing-library/react";

it("shows component structure", () => {
  render(<MyComponent />);
  debug(); // Prints DOM to console
});
```

---

## Common Issues & Solutions

### Issue: "Cannot find module '@/...'

**Solution:** Ensure `tsconfig.json` has path mappings and `jest.config.js` has `moduleNameMapper`.

### Issue: "Database locked" errors

**Solution:** Always use `--runInBand` for API/database tests:

```bash
npm run test:api  # Already includes --runInBand
```

### Issue: Tests pass locally but fail in CI

**Solution:** Check for:

- Timezone differences (use UTC in tests)
- File path differences (use path.join)
- Async timing issues (increase timeouts if needed)

### Issue: "ReferenceError: fetch is not defined"

**Solution:** Add to `jest.setup.js`:

```javascript
global.fetch = jest.fn();
```

---

## Test Maintenance

### Regular Tasks:

1. **Update snapshots** when UI changes intentionally:

   ```bash
   npm test -- -u
   ```

2. **Clean coverage reports** before generating new ones:

   ```bash
   rm -rf coverage && npm run test:coverage
   ```

3. **Review slow tests** and optimize:

   ```bash
   npm test -- --verbose --listTests
   ```

4. **Archive old test files** when features are deprecated

---

## Related Documentation

- [Component Reference](COMPONENT_REFERENCE.md) - Component APIs for testing
- [API Reference](API_REFERENCE.md) - API endpoints being tested
- [Contributing Guide](../CONTRIBUTING.md) - Local setup and workflow for running tests

---

## Summary

The BWB testing suite provides comprehensive coverage across multiple layers:

- ✅ Unit tests for business logic
- ✅ API tests for route handlers
- ✅ Integration tests for workflows
- ✅ Component tests for UI

Run tests frequently during development, maintain good coverage, and write tests that document expected behavior.
