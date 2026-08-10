import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadProductionControlManifest,
  verifyProductionControls,
} from "./production-control-policy.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

try {
  const repositoryRoot = resolve(import.meta.dirname, "..");
  const configuredPath =
    argument("--config") ?? process.env.MECOFLOW_PRODUCTION_CONTROL_FILE;
  if (!configuredPath) {
    throw new Error(
      "Set MECOFLOW_PRODUCTION_CONTROL_FILE or pass --config with an external production control manifest",
    );
  }
  const configPath = resolve(configuredPath);
  const manifest = loadProductionControlManifest(configPath);
  const summary = verifyProductionControls({
    configPath,
    manifest,
    repositoryRoot,
  });
  const scanId = summary.verifiedAt.replaceAll(":", "-");
  const evidenceDirectory = resolve(
    repositoryRoot,
    ".runtime",
    "production-preflight",
    scanId,
  );
  mkdirSync(evidenceDirectory, { recursive: true });
  const summaryPath = resolve(evidenceDirectory, "summary.json");
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  process.stdout.write(
    `Production control preflight passed. Safe summary: ${summaryPath}\n`,
  );
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Production control preflight failed"}\n`,
  );
  process.exitCode = 1;
}
