import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadOperationalManifest,
  verifyOperationalReadiness,
} from "./operational-readiness-policy.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const configuredPath =
    argument("--config") ?? process.env.MECOFLOW_OPERATIONAL_READINESS_FILE;
  if (!configuredPath)
    throw new Error(
      "Set MECOFLOW_OPERATIONAL_READINESS_FILE or pass --config with an external operational-readiness manifest",
    );
  const configPath = resolve(configuredPath);
  const manifest = loadOperationalManifest(configPath);
  const summary = verifyOperationalReadiness({
    configPath,
    manifest,
    repositoryRoot,
  });
  const evidenceDirectory = resolve(
    repositoryRoot,
    ".runtime",
    "operational-readiness",
    summary.verifiedAt.replaceAll(":", "-"),
  );
  mkdirSync(evidenceDirectory, { recursive: true });
  const summaryPath = resolve(evidenceDirectory, "summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  process.stdout.write(
    `Operational readiness preflight passed. Safe summary: ${summaryPath}\n`,
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Operational readiness preflight failed"}\n`,
  );
  process.exitCode = 1;
}
