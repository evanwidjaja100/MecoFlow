import { describe, expect, it } from "vitest";
import {
  createReportCsv,
  createReportXlsx,
  formulaSafe,
} from "./report-export.js";

describe("secure report exports", () => {
  const report = {
    columns: [
      { header: "Supplier", value: (row: { value: string }) => row.value },
    ],
    filters: { supplier: "  =FILTER" },
    generatedAt: "2026-07-27T00:00:00.000Z",
    reportKey: "supplier-performance",
    rows: [{ value: "@SUM(A1:A2)" }],
  };

  it("neutralizes every spreadsheet formula trigger including whitespace", () => {
    for (const value of [
      "=1+1",
      "+1",
      "-1",
      "@SUM(A1:A2)",
      "\tcmd",
      "\rcommand",
      "  =1+1",
    ])
      expect(formulaSafe(value)).toBe(`'${value}`);
    expect(formulaSafe("ordinary")).toBe("ordinary");
  });

  it("includes canonical metadata and safe values in CSV", () => {
    const csv = createReportCsv(report);
    expect(csv).toContain('"generated_at_utc","2026-07-27T00:00:00.000Z"');
    expect(csv).toContain('"filter.supplier","\'  =FILTER"');
    expect(csv).toContain('"\'@SUM(A1:A2)"');
  });

  it("creates a macro-free workbook with metadata, data, and trends sheets", () => {
    const workbook = createReportXlsx(report);
    const text = workbook.toString("utf8");
    expect(text).toContain("Metadata");
    expect(text).toContain("Data");
    expect(text).toContain("Trends");
    expect(text).toContain("&apos;@SUM(A1:A2)");
    expect(text).not.toContain("<f>");
    expect(text).not.toContain("vbaProject");
  });
});
