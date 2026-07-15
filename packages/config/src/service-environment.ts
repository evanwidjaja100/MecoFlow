import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const serviceEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z.string().min(1).max(32).default("local"),
  APP_VERSION: z.string().min(1).max(64).default("0.1.0"),
  APP_TIMEZONE: z.string().min(1).default("Asia/Jakarta"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGINS: z.string().min(1).default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  DATABASE_URL: z.string().url().startsWith("postgresql://"),
  REDIS_URL: z.string().url().startsWith("redis://"),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(3).max(63),
  S3_FORCE_PATH_STYLE: booleanString.default(true),
});

export type ServiceEnvironment = z.infer<typeof serviceEnvironmentSchema>;

export function parseServiceEnvironment(
  input: Record<string, string | undefined>,
): ServiceEnvironment {
  const parsed = serviceEnvironmentSchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.issues.map(
      (issue) => issue.path.join(".") || "environment",
    );
    throw new Error(
      `Invalid service environment: ${[...new Set(fields)].join(", ")}`,
    );
  }
  return parsed.data;
}
