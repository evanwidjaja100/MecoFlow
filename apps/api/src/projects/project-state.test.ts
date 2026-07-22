import { describe, expect, it } from "vitest";
import {
  allowedProjectTransitions,
  canTransitionProject,
  projectStates,
} from "./project-state.js";

describe("project state transitions", () => {
  const expected = {
    ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
    CANCELLED: [],
    COMPLETED: [],
    DRAFT: ["PLANNED", "CANCELLED"],
    ON_HOLD: ["ACTIVE", "CANCELLED"],
    PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
  } as const;

  it.each(projectStates)(
    "allows only documented transitions from %s",
    (source) => {
      expect(allowedProjectTransitions(source)).toEqual(expected[source]);
      for (const target of projectStates)
        expect(canTransitionProject(source, target)).toBe(
          expected[source].some((candidate) => candidate === target),
        );
    },
  );

  it("forbids reopening a completed project through the normal transition command", () => {
    expect(canTransitionProject("COMPLETED", "ACTIVE")).toBe(false);
  });
});
