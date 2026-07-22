import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const artifact = new URL("../docs/generated/openapi.json", import.meta.url);
const before = readFileSync(artifact, "utf8");
const generated = spawnSync("pnpm openapi:generate", {
  cwd: new URL("..", import.meta.url),
  shell: true,
  stdio: "inherit",
});
if (generated.error) throw generated.error;
if (generated.status !== 0) process.exit(generated.status ?? 1);

const after = readFileSync(artifact, "utf8");
if (after !== before) {
  console.error(
    "OpenAPI artifact drift detected. Run pnpm openapi:generate and commit the result.",
  );
  process.exit(1);
}
