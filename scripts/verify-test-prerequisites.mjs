import process from "node:process";
import { resolve } from "node:path";
import {
  validateDatabaseUrl,
  validateRequiredSuite,
  validateTestEnvironment,
} from "./test-prerequisite-policy.mjs";

const suite = process.argv[2];
if (!new Set(["unit", "integration", "authorization", "e2e"]).has(suite)) {
  console.error(
    "Required test prerequisite check needs unit, integration, authorization, or e2e suite name.",
  );
  process.exit(1);
}
const errors = [
  ...validateRequiredSuite(resolve(import.meta.dirname, ".."), suite),
  ...(suite === "unit"
    ? []
    : validateDatabaseUrl(process.env.DATABASE_URL, {
        githubActions:
          process.env.GITHUB_ACTIONS === "true" && process.env.CI === "true",
      })),
  ...validateTestEnvironment(suite, process.env),
];
if (errors.length > 0) {
  console.error(`Required ${suite} test prerequisites failed:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Required ${suite} test prerequisites passed.`);
