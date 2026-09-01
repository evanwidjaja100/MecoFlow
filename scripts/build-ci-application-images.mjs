import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolveApprovedBuildApiBaseUrl } from "./phase-zero-closure-policy.mjs";

const builds = [
  ["apps/api/Dockerfile", "mecoflow-api:ci", []],
  ["apps/worker/Dockerfile", "mecoflow-worker:ci", []],
  ["apps/web/Dockerfile", "mecoflow-web:ci", null],
];

const publicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const approvedPublicApiBaseUrl = resolveApprovedBuildApiBaseUrl(
  JSON.parse(readFileSync("docs/readiness/endpoint-matrix.json", "utf8")),
);
if (publicApiBaseUrl !== approvedPublicApiBaseUrl) {
  throw new Error("The approved NEXT_PUBLIC_API_BASE_URL is required");
}
builds[2][2] = ["--build-arg", `NEXT_PUBLIC_API_BASE_URL=${publicApiBaseUrl}`];

for (const [dockerfile, tag, additionalArgs] of builds) {
  console.log(`Building ${tag} from ${dockerfile}`);
  const result = spawnSync(
    "docker",
    ["build", ...additionalArgs, "-f", dockerfile, "-t", tag, "."],
    { encoding: "utf8", stdio: "inherit", windowsHide: true },
  );
  if (result.status !== 0) {
    throw new Error(`${tag} build failed with exit ${result.status}`);
  }
}
