import { describe, expect, it } from "vitest";
import {
  canReleaseBom,
  canTransitionBom,
  type BomRevisionStatus,
} from "./bom-lifecycle.js";

const states: BomRevisionStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "RELEASED",
  "SUPERSEDED",
  "CANCELLED",
];

describe("BOM revision lifecycle", () => {
  it("allows only the accepted lifecycle graph edges", () => {
    const allowed = new Set([
      "DRAFT:IN_REVIEW",
      "DRAFT:CANCELLED",
      "IN_REVIEW:RELEASED",
      "IN_REVIEW:CANCELLED",
      "RELEASED:SUPERSEDED",
    ]);
    for (const source of states)
      for (const target of states)
        expect(canTransitionBom(source, target)).toBe(
          allowed.has(`${source}:${target}`),
        );
  });

  it("requires a non-empty reviewed revision on a nonterminal project for release", () => {
    expect(
      canReleaseBom({
        lineCount: 1,
        projectState: "ACTIVE",
        status: "IN_REVIEW",
      }),
    ).toBe(true);
    expect(
      canReleaseBom({
        lineCount: 0,
        projectState: "ACTIVE",
        status: "IN_REVIEW",
      }),
    ).toBe(false);
    expect(
      canReleaseBom({
        lineCount: 1,
        projectState: "COMPLETED",
        status: "IN_REVIEW",
      }),
    ).toBe(false);
    expect(
      canReleaseBom({
        lineCount: 1,
        projectState: "ACTIVE",
        status: "DRAFT",
      }),
    ).toBe(false);
  });
});
