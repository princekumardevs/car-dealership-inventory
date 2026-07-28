import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  // Give mongodb-memory-server enough time to spin up
  testTimeout: 30000,
  // Run all tests serially to avoid port/db conflicts
  runInBand: true,
  // Show individual test names in output
  verbose: true,
  // ts-jest options: use the backend tsconfig but include tests/
  globals: {
    "ts-jest": {
      tsconfig: {
        // mirror backend tsconfig but root includes tests
        target: "ES2020",
        module: "commonjs",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    },
  },
};

export default config;
