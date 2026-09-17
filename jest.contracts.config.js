const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

// API Contract test configuration
// Tests API response schemas and error handling
const customJestConfig = {
  displayName: "contracts",
  globalSetup: "<rootDir>/jest.globalSetup.js",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/jest.env.js"],
  testMatch: ["**/__tests__/contracts/**/*.contract.test.ts"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  testTimeout: 10000, // 10 seconds timeout
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|react-markdown|remark-gfm|vfile|vfile-message|unist-.*|unified|bail|is-plain-obj|trough|mdast-.*|micromark.*|decode-named-character-reference|character-entities|ccount|escape-string-regexp|markdown-table|jose|@panva|openid-client)/)",
  ],
  maxWorkers: 1, // Sequential for consistent API testing
};

module.exports = createJestConfig(customJestConfig);
