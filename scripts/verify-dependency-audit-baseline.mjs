import { readFileSync } from "node:fs";
import { validateDependencyAudit } from "./dependency-audit-policy.mjs";

try {
  const report = JSON.parse(readFileSync(0, "utf8"));
  const errors = validateDependencyAudit(report);
  if (errors.length > 0) throw new Error(errors.join("; "));
  console.log(
    "Dependency audit exactly matches the recorded Phase 0 baseline.",
  );
} catch (error) {
  console.error(
    `Dependency audit baseline verification failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
