import { rmSync } from "node:fs";

for (const path of [".turbo", "playwright-report", "test-results"]) {
  rmSync(path, { force: true, recursive: true });
}
