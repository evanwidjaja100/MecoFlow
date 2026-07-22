import { describe, expect, it } from "vitest";
import {
  parseCsv,
  parseXlsx,
  validateImportRows,
  type CatalogItem,
} from "./bom-import-parser.js";

const header = "item_code,item_name,quantity,unit_code,criticality,notes";
const catalog: CatalogItem[] = [
  {
    active: true,
    code: "ITEM-A",
    id: "item-a",
    name: "Ambiguous plate",
    unitOfMeasure: {
      active: true,
      code: "KG",
      decimalPrecision: 2,
      id: "unit-kg",
    },
  },
  {
    active: true,
    code: "ITEM-B",
    id: "item-b",
    name: "Ambiguous plate",
    unitOfMeasure: {
      active: true,
      code: "M",
      decimalPrecision: 3,
      id: "unit-m",
    },
  },
];

describe("BOM import parsing and validation", () => {
  it("reports invalid quantity, invalid unit, ambiguity, formulas, and retained blank rows", () => {
    const rows = parseCsv(
      Buffer.from(
        `${header}\nITEM-A,,0,M,NORMAL,invalid\n,Ambiguous plate,1,KG,HIGH,ambiguous\nITEM-A,,1,KG,NORMAL,=HYPERLINK("x")\n,,,,,\n`,
      ),
    );
    const validated = validateImportRows(rows, catalog);
    expect(validated).toHaveLength(4);
    expect(validated[0]?.errors.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["INVALID_QUANTITY", "INVALID_UNIT"]),
    );
    expect(validated[1]?.errors.map(({ code }) => code)).toContain(
      "AMBIGUOUS_ITEM",
    );
    expect(validated[2]?.errors.map(({ code }) => code)).toContain(
      "FORMULA_NOT_ALLOWED",
    );
    expect(validated[3]?.errors.map(({ code }) => code)).toContain("EMPTY_ROW");
  });

  it("never merges duplicate item rows", () => {
    const rows = parseCsv(
      Buffer.from(
        `${header}\nITEM-A,,1,KG,NORMAL,first\nITEM-A,,2,KG,NORMAL,second\n`,
      ),
    );
    const validated = validateImportRows(rows, catalog);
    expect(validated).toHaveLength(2);
    expect(validated[1]?.warnings.map(({ code }) => code)).toContain(
      "DUPLICATE_ITEM_ROW",
    );
  });

  it("retains rows with extra columns and reports them explicitly", () => {
    const validated = validateImportRows(
      parseCsv(Buffer.from(`${header}\nITEM-A,,1,KG,NORMAL,note,extra\n`)),
      catalog,
    );
    expect(validated).toHaveLength(1);
    expect(validated[0]?.errors.map(({ code }) => code)).toContain(
      "UNEXPECTED_COLUMNS",
    );
    expect(validated[0]?.rawData.unexpected_column_7).toBe("extra");
  });

  it("marks XLSX formula cells without evaluating them", () => {
    const xlsx = testXlsx(
      '<row r="1"><c r="A1" t="inlineStr"><is><t>item_code</t></is></c><c r="B1" t="inlineStr"><is><t>item_name</t></is></c><c r="C1" t="inlineStr"><is><t>quantity</t></is></c><c r="D1" t="inlineStr"><is><t>unit_code</t></is></c><c r="E1" t="inlineStr"><is><t>criticality</t></is></c><c r="F1" t="inlineStr"><is><t>notes</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>ITEM-A</t></is></c><c r="C2"><f>1+1</f><v>2</v></c><c r="D2" t="inlineStr"><is><t>KG</t></is></c><c r="E2" t="inlineStr"><is><t>NORMAL</t></is></c></row>',
    );
    const parsed = parseXlsx(xlsx);
    expect(parsed[0]?.formulaFields).toContain("quantity");
    expect(
      validateImportRows(parsed, catalog)[0]?.errors.map(({ code }) => code),
    ).toContain("FORMULA_NOT_ALLOWED");
  });

  it("rejects malformed XLSX archives as terminal file errors", () => {
    expect(() => parseXlsx(Buffer.from("PK\u0003\u0004truncated"))).toThrow(
      "INVALID_XLSX_ARCHIVE",
    );
  });
});

function testXlsx(rows: string): Buffer {
  const name = Buffer.from("xl/worksheets/sheet1.xml");
  const data = Buffer.from(
    `<?xml version="1.0"?><worksheet><sheetData>${rows}</sheetData></worksheet>`,
  );
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 6);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + name.length, 12);
  end.writeUInt32LE(local.length + name.length + data.length, 16);
  return Buffer.concat([local, name, data, central, name, end]);
}
