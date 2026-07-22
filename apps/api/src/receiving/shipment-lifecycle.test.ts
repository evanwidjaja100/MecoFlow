import { describe, expect, it } from "vitest";
import {
  canTransitionShipment,
  type AdvanceShipmentNoticeStatus,
} from "./shipment-lifecycle.js";

const statuses: AdvanceShipmentNoticeStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "IN_TRANSIT",
  "ARRIVED",
  "CANCELLED",
];

describe("Phase 5B shipment lifecycle", () => {
  it("allows only explicit forward shipment commands and cancellation before dispatch", () => {
    const allowed = new Set([
      "DRAFT:SUBMITTED",
      "DRAFT:CANCELLED",
      "SUBMITTED:IN_TRANSIT",
      "SUBMITTED:CANCELLED",
      "IN_TRANSIT:ARRIVED",
    ]);
    for (const source of statuses)
      for (const target of statuses)
        expect(canTransitionShipment(source, target)).toBe(
          allowed.has(`${source}:${target}`),
        );
  });
});
