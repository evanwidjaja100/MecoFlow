import { describe, expect, it } from "vitest";
import { canTransitionNcr, type NcrStatus } from "./ncr-lifecycle.js";

describe("NCR lifecycle", () => {
  const states: NcrStatus[] = [
    "DRAFT",
    "ISSUED",
    "SUPPLIER_RESPONDED",
    "CLOSED",
    "CANCELLED",
  ];
  const allowed = new Set([
    "DRAFT:ISSUED",
    "DRAFT:CANCELLED",
    "ISSUED:SUPPLIER_RESPONDED",
    "ISSUED:CLOSED",
    "ISSUED:CANCELLED",
    "SUPPLIER_RESPONDED:CLOSED",
  ]);

  it("allows only explicit lifecycle edges", () => {
    for (const source of states)
      for (const target of states)
        expect(canTransitionNcr(source, target)).toBe(
          allowed.has(`${source}:${target}`),
        );
  });
});
