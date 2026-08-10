import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPinoInstance, mockPinoFactory } = vi.hoisted(() => {
  const mockInstance = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  };
  const mockFactory = Object.assign(
    vi.fn(() => mockInstance),
    {
      stdTimeFunctions: { isoTime: "2024-01-01T00:00:00.000Z" },
    },
  );
  return { mockPinoInstance: mockInstance, mockPinoFactory: mockFactory };
});

vi.mock("pino", () => ({ default: mockPinoFactory }));

import { JsonLogger } from "./logger.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("JsonLogger", () => {
  it("constructs with the given service, environment, and level", () => {
    const logger = new JsonLogger("my-service", "production", "info");
    expect(logger).toBeDefined();
    expect(mockPinoFactory).toHaveBeenCalledWith({
      base: { environment: "production", service: "my-service" },
      level: "info",
      redact: { paths: expect.any(Array), censor: "[REDACTED]" },
      timestamp: expect.any(String),
    });
  });

  it("log sends a message at info level with context", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.log("hello world", "AppContext");
    expect(mockPinoInstance.info).toHaveBeenCalledWith(
      { context: "AppContext" },
      "hello world",
    );
  });

  it("log without context still works", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.log("hello");
    expect(mockPinoInstance.info).toHaveBeenCalledWith(
      { context: undefined },
      "hello",
    );
  });

  it("log converts Error to its message", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.log(new Error("failure"));
    expect(mockPinoInstance.info).toHaveBeenCalledWith(
      { context: undefined },
      "failure",
    );
  });

  it("error omits raw traces and retains a safe classification", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.error(
      "something broke",
      "stack includes password=do-not-log",
      "ErrCtx",
    );
    expect(mockPinoInstance.error).toHaveBeenCalledWith(
      {
        context: "ErrCtx",
        errorClassification: "unexpected_internal_error",
        errorType: undefined,
      },
      "something broke",
    );
  });

  it("error without trace still works", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.error("fail");
    expect(mockPinoInstance.error).toHaveBeenCalledWith(
      {
        context: undefined,
        errorClassification: "unexpected_internal_error",
        errorType: undefined,
      },
      "fail",
    );
  });

  it("warn sends a message at warn level", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.warn("caution", "WarnCtx");
    expect(mockPinoInstance.warn).toHaveBeenCalledWith(
      { context: "WarnCtx" },
      "caution",
    );
  });

  it("debug sends a message at debug level", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.debug("verbose detail", "DebugCtx");
    expect(mockPinoInstance.debug).toHaveBeenCalledWith(
      { context: "DebugCtx" },
      "verbose detail",
    );
  });

  it("verbose sends a message at trace level", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.verbose("trace detail", "VerboseCtx");
    expect(mockPinoInstance.trace).toHaveBeenCalledWith(
      { context: "VerboseCtx" },
      "trace detail",
    );
  });

  it("info sends structured fields with message", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.info({ correlationId: "abc" }, "event occurred");
    expect(mockPinoInstance.info).toHaveBeenCalledWith(
      { correlationId: "abc" },
      "event occurred",
    );
  });

  it("error does not serialize exception messages or traces", () => {
    const logger = new JsonLogger("s", "e", "debug");
    logger.error(
      new Error("database password=do-not-log"),
      "stack token=do-not-log",
      "ctx",
    );
    expect(mockPinoInstance.error).toHaveBeenCalledWith(
      {
        context: "ctx",
        errorClassification: "unexpected_internal_error",
        errorType: "Error",
      },
      "Application error",
    );
  });
});
