import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { JsonLogger } from "./logger.js";

const safeIdentifier = /^[A-Za-z0-9._:-]{1,128}$/;

function headerIdentifier(
  value: string | string[] | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && safeIdentifier.test(candidate) ? candidate : undefined;
}

export function requestLogging(logger: JsonLogger) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    const requestId =
      headerIdentifier(request.headers["x-request-id"]) ?? randomUUID();
    const correlationId =
      headerIdentifier(request.headers["x-correlation-id"]) ?? requestId;

    response.removeHeader("X-Powered-By");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; frame-ancestors 'none'",
    );
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("X-Request-Id", requestId);
    response.locals.requestId = requestId;
    response.locals.correlationId = correlationId;

    response.once("finish", () => {
      logger.info(
        {
          correlationId,
          durationMs: Number((performance.now() - startedAt).toFixed(2)),
          httpStatus: response.statusCode,
          method: request.method,
          requestId,
          route: request.path,
        },
        "HTTP request completed",
      );
    });

    next();
  };
}
