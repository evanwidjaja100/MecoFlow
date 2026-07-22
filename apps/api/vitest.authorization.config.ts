import { config as loadEnvironment } from "dotenv";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

loadEnvironment({
  path: resolve(import.meta.dirname, "../../.env"),
  quiet: true,
});

export default defineConfig({
  test: {
    fileParallelism: false,
    hookTimeout: 30_000,
    include: [
      "src/**/*.authorization.test.ts",
      "src/**/*.authorization.integration.test.ts",
    ],
    testTimeout: 20_000,
  },
});
