import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { buildCiEvidence, resolveEvidencePath } from "./ci-evidence-policy.mjs";

try {
  const root = process.cwd();
  const job = process.env.PHASE_ZERO_JOB?.trim() ?? "";
  const directory = resolveEvidencePath(
    root,
    process.env.PHASE_ZERO_EVIDENCE_DIR ?? ".runtime/evidence",
    job,
  );
  const evidence = buildCiEvidence({ root, env: process.env });
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "manifest.json");
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  console.log(`Phase 0 CI evidence manifest written to ${path}`);
} catch (error) {
  console.error(
    `Phase 0 CI evidence generation failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
}
