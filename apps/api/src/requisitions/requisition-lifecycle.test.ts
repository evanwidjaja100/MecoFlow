import { describe, expect, it } from "vitest";
import {
  canTransitionRequisition,
  type RequisitionStatus,
} from "./requisition-lifecycle.js";

describe("purchase requisition lifecycle", () => {
  const statuses: RequisitionStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "CANCELLED",
  ];
  const allowed = new Set([
    "DRAFT:SUBMITTED",
    "DRAFT:CANCELLED",
    "SUBMITTED:APPROVED",
    "SUBMITTED:REJECTED",
    "SUBMITTED:CANCELLED",
    "APPROVED:CANCELLED",
  ]);

  for (const source of statuses)
    for (const target of statuses)
      it(`${source} -> ${target}`, () => {
        expect(canTransitionRequisition(source, target)).toBe(
          allowed.has(`${source}:${target}`),
        );
      });
});
