import { defineConfig, devices } from "@playwright/test";

const serviceEnvironment = {
  APP_ENV: "test",
  APP_VERSION: "0.1.0",
  CORS_ORIGINS: "http://localhost:3000",
  DATABASE_URL:
    "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public",
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:3001",
  OIDC_CLIENT_ID: "mecoflow-web",
  OIDC_ISSUER: "http://127.0.0.1:4310",
  OIDC_REDIRECT_URI: "http://localhost:3001/api/v1/auth/callback",
  REDIS_URL: "redis://127.0.0.1:6379",
  S3_ACCESS_KEY: "mecoflow_local",
  S3_BUCKET: "mecoflow-private",
  S3_ENDPOINT: "http://127.0.0.1:9000",
  S3_REGION: "us-east-1",
  S3_SECRET_KEY: "local_only_minio_change_me",
  SESSION_SECRET: "local_only_session_secret_change_me_32_chars",
  WEB_BASE_URL: "http://localhost:3000",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/oidc-mock.mjs",
      port: 4310,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "pnpm --filter @mecoflow/api start",
      env: serviceEnvironment,
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @mecoflow/web start",
      env: serviceEnvironment,
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
