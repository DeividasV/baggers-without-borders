const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

// E2E test configuration
// Tests full application stack with database operations
// Requires sequential execution to avoid SQLite locking issues
const customJestConfig = {
  displayName: "e2e",
  globalSetup: "<rootDir>/jest.globalSetup.js",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/jest.env.js"],
  testMatch: ["**/__tests__/e2e/**/*.e2e.test.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testTimeout: 30000, // 30 seconds timeout for E2E tests
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|react-markdown|remark-gfm|vfile|vfile-message|unist-.*|unified|bail|is-plain-obj|trough|mdast-.*|micromark.*|decode-named-character-reference|character-entities|ccount|escape-string-regexp|markdown-table|jose|@panva|openid-client)/)",
  ],
  maxWorkers: 1, // Force sequential execution to prevent database locking
  bail: false, // Continue running tests even if some fail
};

module.exports = createJestConfig(customJestConfig);
