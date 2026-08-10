import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const secretFiles = [
  ["SESSION_SECRET", "SESSION_SECRET_FILE"],
  ["S3_ACCESS_KEY", "S3_ACCESS_KEY_FILE"],
  ["S3_SECRET_KEY", "S3_SECRET_KEY_FILE"],
  ["SMTP_PASSWORD", "SMTP_PASSWORD_FILE"],
  ["KEYCLOAK_ADMIN_PASSWORD", "KEYCLOAK_ADMIN_PASSWORD_FILE"],
  ["STAGING_INTERNAL_PASSWORD", "STAGING_INTERNAL_PASSWORD_FILE"],
  ["STAGING_SUPPLIER_A_PASSWORD", "STAGING_SUPPLIER_A_PASSWORD_FILE"],
  ["STAGING_SUPPLIER_B_PASSWORD", "STAGING_SUPPLIER_B_PASSWORD_FILE"],
];

function readSecret(path, name) {
  const value = readFileSync(path, "utf8").trim();
  if (!value || value.includes("\0"))
    throw new Error(`Invalid secret file for ${name}`);
  return value;
}

for (const [valueName, fileName] of secretFiles) {
  const path = process.env[fileName];
  if (path) process.env[valueName] = readSecret(path, valueName);
}

if (!process.env.DATABASE_URL && process.env.DATABASE_PASSWORD_FILE) {
  const url = new URL(
    `postgresql://${process.env.DATABASE_HOST ?? "postgres"}:${
      process.env.DATABASE_PORT ?? "5432"
    }/${process.env.DATABASE_NAME ?? "mecoflow"}`,
  );
  url.username = process.env.DATABASE_USER ?? "mecoflow";
  url.password = readSecret(
    process.env.DATABASE_PASSWORD_FILE,
    "DATABASE_PASSWORD",
  );
  url.searchParams.set("schema", process.env.DATABASE_SCHEMA ?? "public");
  process.env.DATABASE_URL = url.toString();
}

if (!process.env.REDIS_URL && process.env.REDIS_PASSWORD_FILE) {
  const url = new URL(
    `redis://${process.env.REDIS_HOST ?? "redis"}:${
      process.env.REDIS_PORT ?? "6379"
    }`,
  );
  url.password = readSecret(process.env.REDIS_PASSWORD_FILE, "REDIS_PASSWORD");
  process.env.REDIS_URL = url.toString();
}

const command = process.argv.slice(2);
if (command.length === 0) throw new Error("A command is required");

const child = spawn(command[0], command.slice(1), {
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}

child.on("error", () => {
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = signal ? 1 : (code ?? 1);
});
