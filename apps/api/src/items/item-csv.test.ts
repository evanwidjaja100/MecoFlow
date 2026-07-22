import { describe, expect, it } from "vitest";
import { createItemsCsv } from "./item-csv.js";

function row(overrides: Partial<{ description: string; name: string }> = {}) {
  return {
    active: true,
    code: "PLATE-001",
    description: "Safe description",
    itemCategory: { code: "PLATE", name: "Plate" },
    name: "Stainless plate",
    specificationValues: [],
    unitOfMeasure: { code: "KG", decimalPrecision: 3, symbol: "kg" },
    ...overrides,
  };
}

describe("item CSV export", () => {
  it("escapes delimiters, quotes, and line breaks", () => {
    const csv = createItemsCsv([
      row({
        description: "Line one\nLine two",
        name: 'Plate, 10 mm "pickled"',
      }),
    ]);

    expect(csv).toContain('"Plate, 10 mm ""pickled"""');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it.each(["=2+3", "+2+3", "-2+3", "@SUM(A1:A2)"])(
    "neutralizes formula-capable value %s",
    (name) => {
      const csv = createItemsCsv([row({ name })]);

      expect(csv).toContain(`'${name}`);
      expect(csv).not.toMatch(new RegExp(`(?:^|,)${escapeRegExp(name)}`));
      expect(csv).not.toMatch(new RegExp(`(?:^|,)"${escapeRegExp(name)}`));
    },
  );

  it("emits a stable header even when no rows match", () => {
    const csv = createItemsCsv([]);
    const [header, ...rows] = csv.trimEnd().split(/\r?\n/);

    expect(header?.toLowerCase()).toContain("code");
    expect(header?.toLowerCase()).toContain("name");
    expect(rows).toHaveLength(0);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
