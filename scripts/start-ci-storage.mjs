import { spawnSync } from "node:child_process";

const minioImage =
  "quay.io/minio/minio:RELEASE.2025-09-07T16-13-09Z@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e";
const clientImage =
  "quay.io/minio/mc:RELEASE.2025-08-13T08-35-41Z@sha256:a7fe349ef4bd8521fb8497f55c6042871b2ae640607cf99d9bede5e9bdf11727";
if (!process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) {
  throw new Error("S3_ACCESS_KEY and S3_SECRET_KEY are required");
}
process.env.MINIO_ROOT_USER = process.env.S3_ACCESS_KEY;
process.env.MINIO_ROOT_PASSWORD = process.env.S3_SECRET_KEY;

function run(args, description) {
  console.log(description);
  const result = spawnSync("docker", args, {
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit ${result.status}`);
  }
}

run(
  [
    "run",
    "--detach",
    "--name",
    "mecoflow-ci-minio",
    "--publish",
    "9000:9000",
    "--env",
    "MINIO_ROOT_USER",
    "--env",
    "MINIO_ROOT_PASSWORD",
    minioImage,
    "server",
    "/data",
  ],
  "Starting digest-pinned isolated MinIO",
);

let ready = false;
for (let attempt = 1; attempt <= 30; attempt += 1) {
  try {
    const response = await fetch("http://127.0.0.1:9000/minio/health/ready");
    if (response.ok) {
      ready = true;
      break;
    }
  } catch {
    // The service is expected to refuse connections while starting.
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
if (!ready) {
  spawnSync("docker", ["logs", "mecoflow-ci-minio"], {
    stdio: "inherit",
    windowsHide: true,
  });
  throw new Error("MinIO did not become ready within 30 seconds");
}

run(
  [
    "run",
    "--rm",
    "--network",
    "host",
    "--env",
    "S3_ACCESS_KEY",
    "--env",
    "S3_SECRET_KEY",
    "--entrypoint",
    "/bin/sh",
    clientImage,
    "-c",
    'mc alias set ci http://127.0.0.1:9000 "$S3_ACCESS_KEY" "$S3_SECRET_KEY" && mc mb --ignore-existing ci/mecoflow-private',
  ],
  "Provisioning the isolated test bucket",
);
