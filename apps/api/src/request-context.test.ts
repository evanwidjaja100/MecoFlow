import type { Request } from "express";
import { describe, expect, it } from "vitest";
import { requestContext } from "./request-context.js";

describe("requestContext", () => {
  it("extracts correlationId and requestId from response locals", () => {
    const req = {
      res: { locals: { correlationId: "corr-123", requestId: "req-456" } },
    } as unknown as Request;
    expect(requestContext(req)).toEqual({
      correlationId: "corr-123",
      requestId: "req-456",
    });
  });

  it("falls back to unknown when correlationId is not a string", () => {
    const req = {
      res: { locals: { correlationId: 42, requestId: "req-456" } },
    } as unknown as Request;
    expect(requestContext(req)).toEqual({
      correlationId: "unknown",
      requestId: "req-456",
    });
  });

  it("falls back to unknown when requestId is not a string", () => {
    const req = {
      res: { locals: { correlationId: "corr-123", requestId: null } },
    } as unknown as Request;
    expect(requestContext(req)).toEqual({
      correlationId: "corr-123",
      requestId: "unknown",
    });
  });

  it("falls back to unknown when locals are empty", () => {
    const req = { res: { locals: {} } } as unknown as Request;
    expect(requestContext(req)).toEqual({
      correlationId: "unknown",
      requestId: "unknown",
    });
  });

  it("handles missing res", () => {
    const req = {} as unknown as Request;
    expect(requestContext(req)).toEqual({
      correlationId: "unknown",
      requestId: "unknown",
    });
  });
});
