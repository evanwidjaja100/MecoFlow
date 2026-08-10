import { describe, expect, it } from "vitest";
import { Prisma } from "@mecoflow/database";
import { inspectionQuantityDecision } from "./inspection-quantity.js";

describe("receiving inspection quantity invariants", () => {
  it("derives the exact quarantined remainder", () => {
    const decision = inspectionQuantityDecision({
      acceptedQuantity: "6.25",
      decimalPrecision: 2,
      disposition: "QUARANTINED",
      receivedQuantity: new Prisma.Decimal("10.00"),
      rejectedQuantity: "1.25",
    });
    expect(decision.quarantined.toString()).toBe("2.5");
  });

  it("rejects accepted plus rejected above received", () => {
    expect(() =>
      inspectionQuantityDecision({
        acceptedQuantity: "8",
        decimalPrecision: 0,
        disposition: "ACCEPTED",
        receivedQuantity: new Prisma.Decimal("10"),
        rejectedQuantity: "3",
      }),
    ).toThrow("invalid");
  });

  it("enforces configured precision exactly", () => {
    expect(() =>
      inspectionQuantityDecision({
        acceptedQuantity: "1.001",
        decimalPrecision: 2,
        disposition: "ACCEPTED",
        receivedQuantity: new Prisma.Decimal("1.00"),
        rejectedQuantity: "0",
      }),
    ).toThrow("invalid");
  });

  it("enforces disposition-specific quantity shapes", () => {
    expect(() =>
      inspectionQuantityDecision({
        acceptedQuantity: "1",
        decimalPrecision: 0,
        disposition: "REJECTED",
        receivedQuantity: new Prisma.Decimal("2"),
        rejectedQuantity: "1",
      }),
    ).toThrow("full quantity");
    expect(() =>
      inspectionQuantityDecision({
        acceptedQuantity: "2",
        decimalPrecision: 0,
        disposition: "QUARANTINED",
        receivedQuantity: new Prisma.Decimal("2"),
        rejectedQuantity: "0",
      }),
    ).toThrow("quarantined quantity");
  });
});
