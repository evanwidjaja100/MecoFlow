import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

if (existsSync(".git")) {
  const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "inherit",
  });
  if (result.error?.code === "ENOENT") {
    process.stderr.write(
      "[prepare] Git is not available on PATH; skipping local hook configuration.\n",
    );
  } else if (result.error) {
    throw result.error;
  } else if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}
