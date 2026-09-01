import process from "node:process";
import { validateRepository } from "./repository-governance-policy.mjs";

const errors = validateRepository(process.cwd());
if (errors.length > 0) {
  console.error("Repository governance check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Repository governance check passed.");
}
