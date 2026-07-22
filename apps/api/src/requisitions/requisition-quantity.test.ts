import { describe, expect, it } from "vitest";
import { calculateRequisitionQuantity } from "./requisition-quantity.js";

describe("purchase requisition quantity boundaries", () => {
  it("calculates uncovered need without double counting existing coverage", () => {
    expect(calculateRequisitionQuantity(10, 4, 6)).toEqual({
      coveredQuantity: 4,
      exceedsNeed: false,
      outstandingQuantity: 6,
      resultingCoverage: 10,
    });
  });

  it("marks only a strict over-need request as an override", () => {
    expect(calculateRequisitionQuantity(10, 4, 6).exceedsNeed).toBe(false);
    expect(calculateRequisitionQuantity(10, 4, 6.000001).exceedsNeed).toBe(
      true,
    );
  });

  it("clamps outstanding quantity to zero", () => {
    expect(calculateRequisitionQuantity(10, 12, 1).outstandingQuantity).toBe(0);
  });

  it("rejects invalid quantity inputs", () => {
    expect(() => calculateRequisitionQuantity(0, 0, 1)).toThrow();
    expect(() => calculateRequisitionQuantity(1, -1, 1)).toThrow();
    expect(() => calculateRequisitionQuantity(1, 0, 0)).toThrow();
  });
});
