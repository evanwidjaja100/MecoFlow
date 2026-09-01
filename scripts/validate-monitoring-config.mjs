import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const MONITORING_IMAGES = {
  alertmanager:
    "prom/alertmanager:v0.32.1@sha256:51a825c2a40acc3e338fdd00d622e01ec090f72be2b3ea46be0839cd47a4d286",
  blackbox:
    "prom/blackbox-exporter:v0.28.0@sha256:e753ff9f3fc458d02cca5eddab5a77e1c175eee484a8925ac7d524f04366c2fc",
  prometheus:
    "prom/prometheus:v3.12.0-busybox@sha256:69f5241418838263316593f7274a304b095c40bcf22e57272865da91bd60a8ac",
};

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const monitoringDirectory = path.join(repositoryRoot, "infra", "monitoring");

function run(image, entrypoint, mountTarget, args) {
  const mount = `${monitoringDirectory}:${mountTarget}:ro`;
  const entrypointArguments = entrypoint ? ["--entrypoint", entrypoint] : [];
  const result = spawnSync(
    "docker",
    ["run", "--rm", "--volume", mount, ...entrypointArguments, image, ...args],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true,
    },
  );
  if (result.stdout?.trim()) process.stdout.write(result.stdout);
  if (result.stderr?.trim()) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${image} configuration validation exited ${result.status}.`,
    );
  }
}

run(MONITORING_IMAGES.prometheus, "promtool", "/etc/prometheus", [
  "check",
  "config",
  "/etc/prometheus/prometheus.yml",
]);
run(MONITORING_IMAGES.alertmanager, "amtool", "/config", [
  "check-config",
  "/config/alertmanager.staging.yml",
]);
run(MONITORING_IMAGES.alertmanager, "amtool", "/config", [
  "check-config",
  "/config/alertmanager.production.example.yml",
]);
run(MONITORING_IMAGES.blackbox, null, "/config", [
  "--config.check",
  "--config.file=/config/blackbox.yml",
]);

process.stdout.write("Monitoring configuration and rules are valid.\n");
