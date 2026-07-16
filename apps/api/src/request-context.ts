import type { Request } from "express";
import type { RequestContext } from "./identity/identity.types.js";

export function requestContext(request: Request): RequestContext {
  const locals = request.res?.locals as
    { correlationId?: unknown; requestId?: unknown } | undefined;
  return {
    correlationId:
      typeof locals?.correlationId === "string"
        ? locals.correlationId
        : "unknown",
    requestId:
      typeof locals?.requestId === "string" ? locals.requestId : "unknown",
  };
}
