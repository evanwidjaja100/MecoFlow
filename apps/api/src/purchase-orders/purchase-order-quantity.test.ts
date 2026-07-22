import { describe, expect, it } from "vitest";
import { calculatePurchaseOrderQuantity } from "./purchase-order-quantity.js";

describe("purchase order approved availability", () => {
  it.each([
    [10, 0, 10, false, 10],
    [10, 2, 7, false, 8],
    [10, 10, 1, true, 0],
    [10, 8, 3, true, 2],
  ])(
    "checks approved %s, ordered %s, requested %s",
    (approved, ordered, requested, exceeds, available) => {
      expect(
        calculatePurchaseOrderQuantity(approved, ordered, requested),
      ).toMatchObject({
        availableQuantity: available,
        exceedsApprovedAvailable: exceeds,
      });
    },
  );

  it.each([
    [0, 0, 1],
    [1, -1, 1],
    [1, 0, 0],
    [1, 0, Number.NaN],
  ])("rejects invalid boundaries", (approved, ordered, requested) => {
    expect(() =>
      calculatePurchaseOrderQuantity(approved, ordered, requested),
    ).toThrow("Invalid purchase order quantity input");
  });
});
