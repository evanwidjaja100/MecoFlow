import { describe, expect, it } from "vitest";
import {
  canRevisePurchaseOrder,
  canTransitionPurchaseOrder,
  type PurchaseOrderStatus,
} from "./purchase-order-lifecycle.js";

const states: PurchaseOrderStatus[] = [
  "DRAFT",
  "SENT",
  "ACKNOWLEDGED",
  "CANCELLED",
];

describe("purchase order lifecycle", () => {
  it("allows only explicit lifecycle edges", () => {
    const allowed = new Set([
      "DRAFT:SENT",
      "DRAFT:CANCELLED",
      "SENT:ACKNOWLEDGED",
      "SENT:DRAFT",
      "SENT:CANCELLED",
      "ACKNOWLEDGED:DRAFT",
      "ACKNOWLEDGED:CANCELLED",
    ]);
    for (const source of states)
      for (const target of states)
        expect(canTransitionPurchaseOrder(source, target)).toBe(
          allowed.has(`${source}:${target}`),
        );
  });

  it("never revises a cancelled order", () => {
    expect(states.filter(canRevisePurchaseOrder)).toEqual([
      "DRAFT",
      "SENT",
      "ACKNOWLEDGED",
    ]);
  });
});
