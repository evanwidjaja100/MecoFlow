import type { LoggerService } from "@nestjs/common";
import pino, { type Logger } from "pino";

const redactedPaths = [
  "authorization",
  "cookie",
  "*.authorization",
  "*.cookie",
  "*.password",
  "*.token",
  "*.secret",
  "*.accessKey",
  "*.storageKey",
];

export class JsonLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(service: string, environment: string, level: string) {
    this.logger = pino({
      base: { environment, service },
      level,
      redact: { paths: redactedPaths, censor: "[REDACTED]" },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  log(message: unknown, context?: string): void {
    this.logger.info({ context }, this.toMessage(message));
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.logger.error(
      { context, errorClassification: "unexpected_internal_error", trace },
      this.toMessage(message),
    );
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context }, this.toMessage(message));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context }, this.toMessage(message));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context }, this.toMessage(message));
  }

  info(fields: Record<string, unknown>, message: string): void {
    this.logger.info(fields, message);
  }

  private toMessage(value: unknown): string {
    if (value instanceof Error) return value.message;
    return typeof value === "string" ? value : "Application event";
  }
}
