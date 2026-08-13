import { execFileSync } from "node:child_process";

const status = execFileSync(
  "git",
  ["status", "--porcelain=v1", "--untracked-files=all"],
  { encoding: "utf8", windowsHide: true },
).trim();

if (status) {
  const paths = status
    .split(/\r?\n/u)
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
  console.error(
    `CI commands changed the clean candidate workspace: ${paths.join(", ")}`,
  );
  process.exitCode = 1;
} else {
  console.log("CI candidate workspace remained clean after all source gates.");
}
