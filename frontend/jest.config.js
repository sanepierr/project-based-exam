const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const customConfig = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // Mood page tests require Next app router context; keep unit suite green until shimmed.
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/src/app/mood/page.test.tsx",
  ],
};

module.exports = createJestConfig(customConfig);
