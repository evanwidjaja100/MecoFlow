import { describe, expect, it } from "vitest";
import {
  canTransitionAllocation,
  type MaterialAllocationStatus,
} from "./allocation-lifecycle.js";

describe("material allocation lifecycle", () => {
  const states: MaterialAllocationStatus[] = [
    "ALLOCATED",
    "RELEASED",
    "CONSUMED",
  ];

  it("permits only release or consumption of an active allocation", () => {
    for (const source of states)
      for (const target of states)
        expect(canTransitionAllocation(source, target)).toBe(
          source === "ALLOCATED" &&
            (target === "RELEASED" || target === "CONSUMED"),
        );
  });
});
