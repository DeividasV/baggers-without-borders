const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  globalSetup: "<rootDir>/jest.globalSetup.js",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },
  // Set test environment variables (Turnstile test keys)
  setupFiles: ["<rootDir>/jest.env.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "app/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/dist/**",
    "!app/layout.tsx",
    "!app/providers.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/dist/",
    "/coverage/",
    "/__tests__/utils/",
    "/__tests__/integration/", // Skip integration tests - use test:integration
    "/__tests__/e2e/", // Skip E2E tests - use test:e2e
    "/__tests__/contracts/", // Skip contract tests - use test:contracts
  ],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|react-markdown|remark-gfm|vfile|vfile-message|unist-.*|unified|bail|is-plain-obj|trough|mdast-.*|micromark.*|decode-named-character-reference|character-entities|ccount|escape-string-regexp|markdown-table|jose|@panva|openid-client)/)",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
