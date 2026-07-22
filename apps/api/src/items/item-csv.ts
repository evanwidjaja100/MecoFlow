export interface CsvItemRow {
  active: boolean;
  code: string;
  description: string;
  itemCategory: { code: string; name: string };
  name: string;
  specificationValues: Array<{
    attributeDefinition: {
      code: string;
      dataType: SpecificationDataType;
      unitOfMeasure: { symbol: string } | null;
    };
    booleanValue: boolean | null;
    numericValue: { toString(): string } | null;
    textValue: string | null;
  }>;
  unitOfMeasure: {
    code: string;
    decimalPrecision: number;
    symbol: string;
  };
}

type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

function formulaSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cell(value: string | number): string {
  return `"${formulaSafe(String(value)).replaceAll('"', '""')}"`;
}

function specificationValue(
  value: CsvItemRow["specificationValues"][number],
): string {
  if (value.attributeDefinition.dataType === "BOOLEAN")
    return value.booleanValue ? "true" : "false";
  if (value.attributeDefinition.dataType === "NUMBER") {
    const number = value.numericValue?.toString() ?? "";
    return value.attributeDefinition.unitOfMeasure
      ? `${number} ${value.attributeDefinition.unitOfMeasure.symbol}`
      : number;
  }
  return value.textValue ?? "";
}

export function createItemsCsv(rows: readonly CsvItemRow[]): string {
  const header = [
    "Code",
    "Name",
    "Description",
    "Category code",
    "Category name",
    "Unit code",
    "Unit symbol",
    "Unit decimal precision",
    "Status",
    "Specifications",
  ];
  const lines = rows.map((row) => [
    row.code,
    row.name,
    row.description,
    row.itemCategory.code,
    row.itemCategory.name,
    row.unitOfMeasure.code,
    row.unitOfMeasure.symbol,
    row.unitOfMeasure.decimalPrecision,
    row.active ? "ACTIVE" : "INACTIVE",
    row.specificationValues
      .map(
        (value) =>
          `${value.attributeDefinition.code}=${specificationValue(value)}`,
      )
      .join("; "),
  ]);
  return [header, ...lines]
    .map((row) => row.map((value) => cell(value)).join(","))
    .join("\r\n")
    .concat("\r\n");
}
