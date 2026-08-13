import { defineConfig, devices } from "@playwright/test";

export function resolveE2ePorts(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  const read = (name: string, fallback: number) => {
    const raw = environment[name] ?? String(fallback);
    if (!/^\d+$/u.test(raw)) throw new Error(`${name} must be an integer port`);
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > 65_535) {
      throw new Error(`${name} must be between 1 and 65535`);
    }
    return value;
  };
  const ports = {
    api: read("E2E_API_PORT", 3001),
    oidc: 4310,
    web: read("E2E_WEB_PORT", 3000),
  };
  if (new Set(Object.values(ports)).size !== 3) {
    throw new Error("E2E API, OIDC, and web ports must be distinct");
  }
  return ports;
}

const ports = resolveE2ePorts();
const apiBaseUrl = `http://localhost:${ports.api}`;
const oidcIssuer = `http://127.0.0.1:${ports.oidc}`;
const webBaseUrl = `http://localhost:${ports.web}`;

const serviceEnvironment = {
  APP_ENV: "test",
  APP_VERSION: "0.1.0",
  API_PORT: String(ports.api),
  CORS_ORIGINS: webBaseUrl,
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public",
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  OIDC_CLIENT_ID: "mecoflow-web",
  OIDC_ISSUER: oidcIssuer,
  OIDC_REDIRECT_URI: `${apiBaseUrl}/api/v1/auth/callback`,
  REDIS_URL: "redis://127.0.0.1:6379",
  S3_ACCESS_KEY: "mecoflow_local",
  S3_BUCKET: "mecoflow-private",
  S3_ENDPOINT: "http://127.0.0.1:9000",
  S3_REGION: "us-east-1",
  S3_SECRET_KEY: "local_only_minio_change_me",
  SESSION_SECRET: "local_only_session_secret_change_me_32_chars",
  WEB_BASE_URL: webBaseUrl,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  ...(process.platform === "win32" ? { workers: 1 } : {}),
  use: {
    baseURL: webBaseUrl,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node tests/oidc-mock.mjs",
      env: {
        E2E_API_PORT: String(ports.api),
      },
      port: ports.oidc,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command:
        "pnpm --parallel --filter @mecoflow/api --filter @mecoflow/worker start",
      env: serviceEnvironment,
      port: ports.api,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `pnpm --filter @mecoflow/web exec next start --hostname 0.0.0.0 --port ${ports.web}`,
      env: { NEXT_PUBLIC_API_BASE_URL: apiBaseUrl },
      port: ports.web,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
