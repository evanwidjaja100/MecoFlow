import { describe, expect, it } from "vitest";
import { createBomCsvTemplate, createBomXlsxTemplate } from "./bom-template.js";

describe("BOM import templates", () => {
  it("emits fixed CSV headers and a macro-free XLSX archive", () => {
    expect(createBomCsvTemplate()).toBe(
      "item_code,item_name,quantity,unit_code,criticality,notes\r\n",
    );
    const xlsx = createBomXlsxTemplate();
    expect(xlsx.readUInt32LE(0)).toBe(0x04034b50);
    expect(xlsx.toString("utf8")).not.toMatch(/vbaProject|<f[ >]/i);
    expect(xlsx.toString("utf8")).toContain("item_code");
  });
});
