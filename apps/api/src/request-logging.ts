import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { JsonLogger } from "./logger.js";
import { normalizeMetricRoute } from "./monitoring/metrics-registry.js";
import type { MetricsRegistry } from "./monitoring/metrics-registry.js";

const safeIdentifier = /^[A-Za-z0-9._:-]{1,128}$/;

function headerIdentifier(
  value: string | string[] | undefined,
): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && safeIdentifier.test(candidate) ? candidate : undefined;
}

export function requestLogging(logger: JsonLogger, metrics: MetricsRegistry) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();
    const requestId =
      headerIdentifier(request.headers["x-request-id"]) ?? randomUUID();
    const correlationId =
      headerIdentifier(request.headers["x-correlation-id"]) ?? requestId;

    response.setHeader("X-Request-Id", requestId);
    response.locals.requestId = requestId;
    response.locals.correlationId = correlationId;

    response.once("finish", () => {
      const durationMs = Number((performance.now() - startedAt).toFixed(2));
      const routePath = (request.route as { path?: unknown } | undefined)?.path;
      metrics.recordHttpRequest({
        durationMs,
        method: request.method,
        route: normalizeMetricRoute(
          routePath,
          request.path,
          response.statusCode,
        ),
        statusCode: response.statusCode,
      });
      logger.info(
        {
          correlationId,
          durationMs,
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
