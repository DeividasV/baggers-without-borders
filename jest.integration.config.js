const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

// Integration test configuration
const customJestConfig = {
  displayName: "integration",
  testEnvironment: "node", // Use node environment for integration tests
  setupFilesAfterEnv: [
    "<rootDir>/__tests__/integration/jest.setup.integration.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/integration/**/*.test.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testTimeout: 30000, // 30 seconds timeout for integration tests
  transformIgnorePatterns: ["node_modules/(?!(uuid|jose|openid-client)/)"],
  maxWorkers: 1, // Force sequential execution to prevent database locking issues
};

module.exports = createJestConfig(customJestConfig);
