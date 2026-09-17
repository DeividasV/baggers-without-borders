/**
 * Jest Setup for Integration Tests
 *
 * This file is loaded before integration tests run.
 * It sets up the test database and provides global cleanup utilities.
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
} from "../utils/test-db-setup";

// Setup test database before all tests
beforeAll(async () => {
  console.log("🚀 Setting up integration test database...");
  await setupTestDatabase();
}, 30000); // 30 second timeout for setup

// NOTE: We don't use global afterEach cleanup here
// Instead, each test suite calls cleanTestDb() in its own beforeEach
// This ensures data is cleaned BEFORE each test, not after
// This prevents race conditions when tests run across multiple files

// Teardown test database after all tests
afterAll(async () => {
  console.log("🔒 Tearing down integration test database...");
  await teardownTestDatabase();
}, 30000); // 30 second timeout
