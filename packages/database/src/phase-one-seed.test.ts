import { describe, expect, it } from "vitest";
import { shouldSeedLocalFixtures } from "./phase-one-seed.js";

describe("Phase 1 seed environment boundary", () => {
  it.each(["local", "development", "test", "ci"])(
    "allows fictional fixtures in %s",
    (environment) => {
      expect(shouldSeedLocalFixtures(environment)).toBe(true);
    },
  );

  it.each([undefined, "staging", "production", "review"])(
    "denies fictional fixtures in %s",
    (environment) => {
      expect(shouldSeedLocalFixtures(environment)).toBe(false);
    },
  );
});
