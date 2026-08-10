import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: { timeout: 15_000 },
  forbidOnly: true,
  fullyParallel: false,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: "list",
  retries: 0,
  testDir: "./tests/staging",
  timeout: 60_000,
  use: {
    baseURL:
      process.env.STAGING_PUBLIC_URL ?? "https://mecoflow.localhost:8443",
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ["--host-resolver-rules=MAP mecoflow.localhost 127.0.0.1"],
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  workers: 1,
});
