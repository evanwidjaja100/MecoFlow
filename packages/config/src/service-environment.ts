import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const localOnlyValues = new Set([
  "local_only_change_me",
  "local_only_minio_change_me",
  "mecoflow_local",
]);

function hasProtocol(value: string, protocols: readonly string[]): boolean {
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function decodeUrlComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isHttpsOrigin(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const corsOrigins = z
  .string()
  .min(1)
  .default("http://localhost:3000")
  .superRefine((value, context) => {
    for (const candidate of value.split(",").map((origin) => origin.trim())) {
      try {
        const url = new URL(candidate);
        if (
          candidate.length === 0 ||
          !["http:", "https:"].includes(url.protocol) ||
          url.origin !== candidate
        ) {
          context.addIssue({
            code: "custom",
            message: "CORS origins must be absolute HTTP(S) origins",
          });
          return;
        }
      } catch {
        context.addIssue({
          code: "custom",
          message: "CORS origins must be absolute HTTP(S) origins",
        });
        return;
      }
    }
  });

const serviceEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[A-Za-z0-9._-]+$/)
      .default("local"),
    APP_VERSION: z.string().min(1).max(64).default("0.1.0"),
    APP_TIMEZONE: z.string().min(1).refine(isTimeZone).default("Asia/Jakarta"),
    APP_CURRENCY: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("IDR"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    CORS_ORIGINS: corsOrigins,
    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),
    DATABASE_URL: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["postgresql:"])),
    REDIS_URL: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["redis:", "rediss:"])),
    S3_ENDPOINT: z
      .string()
      .url()
      .refine((value) => hasProtocol(value, ["http:", "https:"])),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z
      .string()
      .min(3)
      .max(63)
      .regex(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/)
      .refine((value) => !value.includes("..")),
    S3_FORCE_PATH_STYLE: booleanString.default(true),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== "production") return;

    if (["ci", "development", "local", "test"].includes(environment.APP_ENV))
      context.addIssue({ code: "custom", path: ["APP_ENV"] });

    let databaseUrl: URL | undefined;
    try {
      databaseUrl = new URL(environment.DATABASE_URL);
    } catch {
      context.addIssue({ code: "custom", path: ["DATABASE_URL"] });
    }
    if (
      databaseUrl &&
      (databaseUrl.username.length === 0 ||
        databaseUrl.password.length === 0 ||
        localOnlyValues.has(decodeUrlComponent(databaseUrl.username)) ||
        localOnlyValues.has(decodeUrlComponent(databaseUrl.password)))
    )
      context.addIssue({ code: "custom", path: ["DATABASE_URL"] });

    if (
      environment.CORS_ORIGINS.split(",").some(
        (origin) => !isHttpsOrigin(origin.trim()),
      )
    )
      context.addIssue({ code: "custom", path: ["CORS_ORIGINS"] });

    if (localOnlyValues.has(environment.S3_ACCESS_KEY))
      context.addIssue({ code: "custom", path: ["S3_ACCESS_KEY"] });
    if (localOnlyValues.has(environment.S3_SECRET_KEY))
      context.addIssue({ code: "custom", path: ["S3_SECRET_KEY"] });
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
