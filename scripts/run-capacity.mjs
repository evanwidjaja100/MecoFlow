import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  evaluateCapacityMeasurements,
  loadCapacityConfig,
} from "./capacity-policy.mjs";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function request(config, scenario) {
  const started = performance.now();
  try {
    const response = await fetch(new URL(scenario.path, config.targetOrigin), {
      headers: scenario.headers,
      method: scenario.method,
      redirect: "manual",
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
    await response.body?.cancel();
    return {
      durationMilliseconds: Number((performance.now() - started).toFixed(3)),
      passed: scenario.expectedStatuses.includes(response.status),
      scenario: scenario.name,
      status: response.status,
    };
  } catch (error) {
    return {
      durationMilliseconds: Number((performance.now() - started).toFixed(3)),
      errorClassification:
        error instanceof DOMException && error.name === "TimeoutError"
          ? "timeout"
          : "network_error",
      passed: false,
      scenario: scenario.name,
    };
  }
}

function schedule(scenarios) {
  return scenarios.flatMap((scenario) =>
    Array.from({ length: scenario.weight }, () => scenario),
  );
}

export async function executeCapacity(config) {
  const weighted = schedule(config.scenarios);
  const warmupDeadline = performance.now() + config.warmupSeconds * 1_000;
  async function warmupWorker(offset) {
    let index = offset;
    while (performance.now() < warmupDeadline) {
      await request(config, weighted[index % weighted.length]);
      index += config.concurrency;
    }
  }
  await Promise.all(
    Array.from({ length: config.concurrency }, (_value, index) =>
      warmupWorker(index),
    ),
  );

  const measurements = [];
  const startedAt = performance.now();
  let cursor = 0;
  const deadline = startedAt + config.durationSeconds * 1_000;
  async function worker() {
    while (
      performance.now() < deadline &&
      measurements.length < config.maxRequests
    ) {
      const index = cursor;
      cursor += 1;
      const scenario = weighted[index % weighted.length];
      const result = await request(config, scenario);
      if (measurements.length < config.maxRequests) measurements.push(result);
    }
  }
  await Promise.all(Array.from({ length: config.concurrency }, () => worker()));
  return evaluateCapacityMeasurements(config, measurements);
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, "..");
  const configuredPath =
    argument("--config") ?? process.env.MECOFLOW_CAPACITY_FILE;
  if (!configuredPath)
    throw new Error(
      "Set MECOFLOW_CAPACITY_FILE or pass --config with a capacity configuration file",
    );
  const config = loadCapacityConfig(
    path.resolve(configuredPath),
    repositoryRoot,
  );
  const evidence = await executeCapacity(config);
  mkdirSync(config.outputDirectory, { recursive: true });
  const outputPath = path.join(
    config.outputDirectory,
    `${evidence.evidenceId}.json`,
  );
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  process.stdout.write(
    `Capacity ${evidence.result}. Requests: ${evidence.requestCount}; error rate: ${(evidence.errorRate * 100).toFixed(3)}%; p95: ${evidence.p95Milliseconds.toFixed(2)} ms; p99: ${evidence.p99Milliseconds.toFixed(2)} ms. Evidence: ${outputPath}\n`,
  );
  if (evidence.result !== "passed") process.exitCode = 1;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Capacity run failed"}\n`,
    );
    process.exitCode = 1;
  });
}
