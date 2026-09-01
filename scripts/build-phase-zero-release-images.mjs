import { spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import {
  candidateBuildTimestamp,
  requireCandidateImageVersion,
} from "./container-scan-policy.mjs";
import { resolveApprovedBuildApiBaseUrl } from "./phase-zero-closure-policy.mjs";

const appVersion = process.env.APP_VERSION?.trim();
const sourceSha = process.env.PHASE_ZERO_SOURCE_SHA?.trim();
const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const approvedPublicApiBaseUrl = resolveApprovedBuildApiBaseUrl(
  JSON.parse(readFileSync("docs/readiness/endpoint-matrix.json", "utf8")),
);
requireCandidateImageVersion(appVersion, sourceSha);
if (publicApiBaseUrl !== approvedPublicApiBaseUrl) {
  throw new Error(
    "An exact HTTPS production NEXT_PUBLIC_API_BASE_URL is required",
  );
}
const commitTimestamp = spawnSync(
  "git",
  ["show", "-s", "--format=%cI", sourceSha],
  { encoding: "utf8", windowsHide: true },
);
if (commitTimestamp.status !== 0) {
  throw new Error("Unable to resolve the candidate commit timestamp.");
}
const buildDate = candidateBuildTimestamp(commitTimestamp.stdout.trim());
const commonBuildArgs = [
  "--build-arg",
  `APP_VERSION=${appVersion}`,
  "--build-arg",
  `BUILD_DATE=${buildDate}`,
  "--build-arg",
  `VCS_REF=${sourceSha}`,
];
const builds = [
  [
    "apps/api/Dockerfile",
    `mecoflow/api:${appVersion}`,
    [],
    "MECOFLOW_API_IMAGE",
  ],
  [
    "apps/worker/Dockerfile",
    `mecoflow/worker:${appVersion}`,
    [],
    "MECOFLOW_WORKER_IMAGE",
  ],
  [
    "apps/web/Dockerfile",
    `mecoflow/web:${appVersion}`,
    ["--build-arg", `NEXT_PUBLIC_API_BASE_URL=${publicApiBaseUrl}`],
    "MECOFLOW_WEB_IMAGE",
  ],
  [
    "infra/docker/migrations.Dockerfile",
    `mecoflow/migrations:${appVersion}`,
    [],
    "MECOFLOW_MIGRATIONS_IMAGE",
  ],
  [
    "infra/docker/operations.Dockerfile",
    `mecoflow/operations:${appVersion}`,
    [],
    "MECOFLOW_OPERATIONS_IMAGE",
  ],
  [
    "infra/docker/minio.Dockerfile",
    `mecoflow/minio:${appVersion}`,
    [],
    "MECOFLOW_MINIO_IMAGE",
  ],
  [
    "infra/docker/clamav.Dockerfile",
    `mecoflow/clamav:${appVersion}`,
    [],
    "MECOFLOW_CLAMAV_IMAGE",
  ],
  [
    "infra/docker/postgres.Dockerfile",
    `mecoflow/postgres:${appVersion}`,
    [],
    "MECOFLOW_POSTGRES_IMAGE",
  ],
  [
    "infra/docker/proxy.Dockerfile",
    `mecoflow/proxy:${appVersion}`,
    [],
    "MECOFLOW_PROXY_IMAGE",
  ],
];
const pulls = [
  "redis:8.2-alpine@sha256:a7859ed111db3c1f5404a973a4747505d559fb5ca32d37e447afc0ef845a2103",
  "quay.io/keycloak/keycloak:26.7.2@sha256:fc072c227dd8d94decf013be9c8395676efacfab5a0ab33ac4d32dd72b4d719a",
  "prom/prometheus:v3.12.0-busybox@sha256:69f5241418838263316593f7274a304b095c40bcf22e57272865da91bd60a8ac",
  "prom/alertmanager:v0.32.1@sha256:51a825c2a40acc3e338fdd00d622e01ec090f72be2b3ea46be0839cd47a4d286",
  "prom/blackbox-exporter:v0.28.0@sha256:e753ff9f3fc458d02cca5eddab5a77e1c175eee484a8925ac7d524f04366c2fc",
];

function docker(args, description, environment = process.env) {
  console.log(description);
  const result = spawnSync("docker", args, {
    stdio: "inherit",
    windowsHide: true,
    env: environment,
  });
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit ${result.status}`);
  }
}

function imageId(tag) {
  const result = spawnSync(
    "docker",
    ["image", "inspect", "--format", "{{.Id}}", tag],
    { encoding: "utf8", windowsHide: true },
  );
  const id = result.stdout?.trim();
  if (result.status !== 0 || !/^sha256:[0-9a-f]{64}$/u.test(id ?? "")) {
    throw new Error(`Unable to resolve immutable image ID for ${tag}`);
  }
  return id;
}

const imageEnvironment = { ...process.env };
for (const [dockerfile, tag, additionalArgs, environmentName] of builds) {
  docker(
    [
      "build",
      ...commonBuildArgs,
      ...additionalArgs,
      "-f",
      dockerfile,
      "-t",
      tag,
      ".",
    ],
    `Building ${tag}`,
  );
  const id = imageId(tag);
  console.log(`${tag} resolved to ${id}`);
  imageEnvironment[environmentName] = id;
  if (process.env.GITHUB_ENV) {
    appendFileSync(
      process.env.GITHUB_ENV,
      `${environmentName}=${id}\n`,
      "utf8",
    );
  }
}
for (const image of pulls) docker(["pull", image], `Pulling ${image}`);
docker(
  [
    "compose",
    "-f",
    "compose.staging.yaml",
    "-f",
    "compose.monitoring.yaml",
    "config",
    "--quiet",
  ],
  "Validating immutable candidate image identities through staging Compose",
  imageEnvironment,
);
