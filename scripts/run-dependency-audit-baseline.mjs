import { spawnSync } from "node:child_process";

const audit =
  process.platform === "win32"
    ? spawnSync("pnpm audit --json", {
        encoding: "utf8",
        maxBuffer: 25 * 1024 * 1024,
        shell: true,
        windowsHide: true,
      })
    : spawnSync("pnpm", ["audit", "--json"], {
        encoding: "utf8",
        maxBuffer: 25 * 1024 * 1024,
        windowsHide: true,
      });
if (!audit.stdout?.trim()) {
  console.error(audit.stderr || "pnpm audit returned no JSON");
  process.exitCode = 1;
} else {
  const verify = spawnSync(
    process.execPath,
    ["scripts/verify-dependency-audit-baseline.mjs"],
    {
      input: audit.stdout,
      stdio: ["pipe", "inherit", "inherit"],
      windowsHide: true,
    },
  );
  process.exitCode = verify.status ?? 1;
}
