import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveApprovedBuildApiBaseUrl } from "./phase-zero-closure-policy.mjs";

const githubEnvironmentFile = process.env.GITHUB_ENV?.trim();
if (!githubEnvironmentFile) {
  throw new Error(
    "GITHUB_ENV is required to export the approved build endpoint",
  );
}
const matrix = JSON.parse(
  readFileSync(resolve("docs/readiness/endpoint-matrix.json"), "utf8"),
);
const value = resolveApprovedBuildApiBaseUrl(matrix);
appendFileSync(githubEnvironmentFile, `NEXT_PUBLIC_API_BASE_URL=${value}\n`, {
  encoding: "utf8",
});
console.log(`Approved build API endpoint exported for ${new URL(value).host}`);
