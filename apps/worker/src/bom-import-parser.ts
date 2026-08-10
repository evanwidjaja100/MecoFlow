import { inflateRawSync } from "node:zlib";

export const BOM_IMPORT_COLUMNS = [
  "item_code",
  "item_name",
  "quantity",
  "unit_code",
  "criticality",
  "notes",
] as const;

const MAX_IMPORT_ROWS = 5_000;
const MAX_XLSX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;

export interface ImportIssue {
  code: string;
  field: string;
  message: string;
}

export interface RawImportRow {
  formulaFields: string[];
  rowNumber: number;
  unexpectedColumnCount: number;
  values: Record<string, string>;
}

export interface CatalogItem {
  active: boolean;
  code: string;
  id: string;
  name: string;
  unitOfMeasure: {
    active: boolean;
    code: string;
    decimalPrecision: number;
    id: string;
  };
}

export interface ValidatedImportRow {
  criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | null;
  errors: ImportIssue[];
  itemId: string | null;
  notes: string;
  quantity: string | null;
  rawData: Record<string, string>;
  rowNumber: number;
  unitOfMeasureId: string | null;
  warnings: ImportIssue[];
}

export class ImportFileError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

function suspiciousFormula(value: string): boolean {
  const trimmed = value.trimStart();
  return (
    /^[=+@]/.test(trimmed) || (/^-/.test(trimmed) && !/^-\d/.test(trimmed))
  );
}

function parseCsvRecords(
  text: string,
): Array<{ cells: string[]; rowNumber: number }> {
  const records: Array<{ cells: string[]; rowNumber: number }> = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let recordLine = 1;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!;
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else {
        if (character === "\n") line += 1;
        cell += character;
      }
      continue;
    }
    if (character === '"' && cell.length === 0) quoted = true;
    else if (character === ",") {
      cells.push(cell);
      cell = "";
    } else if (character === "\n") {
      cells.push(cell.endsWith("\r") ? cell.slice(0, -1) : cell);
      records.push({ cells, rowNumber: recordLine });
      if (records.length > MAX_IMPORT_ROWS + 1)
        throw new ImportFileError("ROW_LIMIT_EXCEEDED");
      cells = [];
      cell = "";
      line += 1;
      recordLine = line;
    } else cell += character;
  }
  if (quoted) throw new ImportFileError("INVALID_CSV_QUOTES");
  if (cell.length > 0 || cells.length > 0) {
    cells.push(cell.endsWith("\r") ? cell.slice(0, -1) : cell);
    records.push({ cells, rowNumber: recordLine });
    if (records.length > MAX_IMPORT_ROWS + 1)
      throw new ImportFileError("ROW_LIMIT_EXCEEDED");
  }
  return records;
}

function rowsFromTable(
  records: Array<{
    cells: string[];
    formulaColumns?: Set<number>;
    rowNumber: number;
  }>,
): RawImportRow[] {
  if (records.length === 0) throw new ImportFileError("EMPTY_FILE");
  const header = records[0]!.cells.map((value) =>
    value.trim().toLowerCase().replace(/[ -]+/g, "_"),
  );
  if (
    header.length !== BOM_IMPORT_COLUMNS.length ||
    BOM_IMPORT_COLUMNS.some((column, index) => header[index] !== column)
  )
    throw new ImportFileError("INVALID_HEADERS");
  if (records.length - 1 > MAX_IMPORT_ROWS)
    throw new ImportFileError("ROW_LIMIT_EXCEEDED");
  return records.slice(1).map((record) => {
    if (record.cells.length > 20)
      throw new ImportFileError("COLUMN_LIMIT_EXCEEDED");
    const values: Record<string, string> = {};
    const formulaFields: string[] = [];
    BOM_IMPORT_COLUMNS.forEach((column, index) => {
      const value = record.cells[index] ?? "";
      if (value.length > 2000) throw new ImportFileError("CELL_LIMIT_EXCEEDED");
      values[column] = value;
      if (record.formulaColumns?.has(index) || suspiciousFormula(value))
        formulaFields.push(column);
    });
    for (
      let index = BOM_IMPORT_COLUMNS.length;
      index < record.cells.length;
      index += 1
    ) {
      const value = record.cells[index] ?? "";
      if (value.length > 2000) throw new ImportFileError("CELL_LIMIT_EXCEEDED");
      values[`unexpected_column_${index + 1}`] = value;
      if (record.formulaColumns?.has(index) || suspiciousFormula(value))
        formulaFields.push(`unexpected_column_${index + 1}`);
    }
    return {
      formulaFields,
      rowNumber: record.rowNumber,
      unexpectedColumnCount: Math.max(
        0,
        record.cells.length - BOM_IMPORT_COLUMNS.length,
      ),
      values,
    };
  });
}

export function parseCsv(buffer: Buffer): RawImportRow[] {
  if (buffer.includes(0)) throw new ImportFileError("BINARY_CSV_REJECTED");
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  return rowsFromTable(parseCsvRecords(decoded.replace(/^\uFEFF/, "")));
}

function xmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    );
}

function unzip(buffer: Buffer): Map<string, Buffer> {
  const minimum = Math.max(0, buffer.length - 65_557);
  let end = -1;
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw new ImportFileError("INVALID_XLSX_ARCHIVE");
  const entryCount = buffer.readUInt16LE(end + 10);
  const centralSize = buffer.readUInt32LE(end + 12);
  const centralOffset = buffer.readUInt32LE(end + 16);
  if (entryCount > 100 || centralOffset + centralSize > buffer.length)
    throw new ImportFileError("UNSAFE_XLSX_ARCHIVE");
  const entries = new Map<string, Buffer>();
  let offset = centralOffset;
  let totalSize = 0;
  for (let entry = 0; entry < entryCount; entry += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50)
      throw new ImportFileError("INVALID_XLSX_ARCHIVE");
    const flags = buffer.readUInt16LE(offset + 8);
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    if (
      (flags & 1) !== 0 ||
      ![0, 8].includes(compression) ||
      name.startsWith("/") ||
      name.split("/").includes("..") ||
      /(^|\/)vbaProject\.bin$/i.test(name) ||
      name.startsWith("xl/externalLinks/") ||
      name.startsWith("xl/embeddings/")
    )
      throw new ImportFileError("UNSAFE_XLSX_CONTENT");
    totalSize += uncompressedSize;
    if (
      totalSize > MAX_XLSX_UNCOMPRESSED_BYTES ||
      (compressedSize > 0 && uncompressedSize / compressedSize > 200)
    )
      throw new ImportFileError("UNSAFE_XLSX_ARCHIVE");
    if (buffer.readUInt32LE(localOffset) !== 0x04034b50)
      throw new ImportFileError("INVALID_XLSX_ARCHIVE");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(start, start + compressedSize);
    const data =
      compression === 8
        ? inflateRawSync(compressed, {
            maxOutputLength: Math.min(
              uncompressedSize + 1,
              MAX_XLSX_UNCOMPRESSED_BYTES + 1,
            ),
          })
        : Buffer.from(compressed);
    if (data.length !== uncompressedSize)
      throw new ImportFileError("INVALID_XLSX_ARCHIVE");
    entries.set(name, data);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function columnIndex(reference: string): number {
  const letters = /^[A-Z]+/i.exec(reference)?.[0]?.toUpperCase() ?? "";
  let value = 0;
  for (const letter of letters) value = value * 26 + letter.charCodeAt(0) - 64;
  return value - 1;
}

function parseXlsxUnchecked(buffer: Buffer): RawImportRow[] {
  const entries = unzip(buffer);
  const worksheet =
    entries.get("xl/worksheets/sheet1.xml") ??
    [...entries.entries()]
      .filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
      .sort(([left], [right]) => left.localeCompare(right))[0]?.[1];
  if (!worksheet) throw new ImportFileError("XLSX_SHEET_MISSING");
  const sharedXml = entries.get("xl/sharedStrings.xml")?.toString("utf8") ?? "";
  const sharedStrings = [
    ...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g),
  ].map((match) => xmlText(match[1] ?? ""));
  const xml = worksheet.toString("utf8");
  const records: Array<{
    cells: string[];
    formulaColumns: Set<number>;
    rowNumber: number;
  }> = [];
  for (const row of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowNumber = Number(
      /\br="(\d+)"/.exec(row[1] ?? "")?.[1] ?? records.length + 1,
    );
    const cells: string[] = [];
    const formulaColumns = new Set<number>();
    for (const cell of (row[2] ?? "").matchAll(
      /<c\b([^>]*)>([\s\S]*?)<\/c>/g,
    )) {
      const attributes = cell[1] ?? "";
      const content = cell[2] ?? "";
      const reference = /\br="([A-Z]+\d+)"/i.exec(attributes)?.[1] ?? "A1";
      const index = columnIndex(reference);
      const type = /\bt="([^"]+)"/.exec(attributes)?.[1];
      if (/<f(?:\s[^>]*)?>/i.test(content)) formulaColumns.add(index);
      const raw = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(content)?.[1];
      const inline = /<is(?:\s[^>]*)?>([\s\S]*?)<\/is>/.exec(content)?.[1];
      cells[index] =
        type === "s" && raw !== undefined
          ? (sharedStrings[Number(raw)] ?? "")
          : inline !== undefined
            ? xmlText(inline)
            : xmlText(raw ?? "");
    }
    records.push({ cells, formulaColumns, rowNumber });
    if (records.length > MAX_IMPORT_ROWS + 1)
      throw new ImportFileError("ROW_LIMIT_EXCEEDED");
  }
  return rowsFromTable(records);
}

export function parseXlsx(buffer: Buffer): RawImportRow[] {
  try {
    return parseXlsxUnchecked(buffer);
  } catch (error) {
    if (error instanceof ImportFileError) throw error;
    throw new ImportFileError("INVALID_XLSX_ARCHIVE");
  }
}

function issue(code: string, field: string, message: string): ImportIssue {
  return { code, field, message };
}

function normalized(value: string): string {
  return value.trim().toUpperCase();
}

export function validateImportRows(
  rows: readonly RawImportRow[],
  catalog: readonly CatalogItem[],
): ValidatedImportRow[] {
  const active = catalog.filter(
    (item) => item.active && item.unitOfMeasure.active,
  );
  const byCode = new Map(active.map((item) => [item.code.toUpperCase(), item]));
  const byName = new Map<string, CatalogItem[]>();
  for (const item of active) {
    const key = item.name.trim().toLocaleLowerCase("en");
    byName.set(key, [...(byName.get(key) ?? []), item]);
  }
  const seen = new Set<string>();
  return rows.map((row) => {
    const errors: ImportIssue[] = row.formulaFields.map((field) =>
      issue(
        "FORMULA_NOT_ALLOWED",
        field,
        "Formula-like content is not allowed",
      ),
    );
    if (row.unexpectedColumnCount > 0)
      errors.push(
        issue(
          "UNEXPECTED_COLUMNS",
          "row",
          `${row.unexpectedColumnCount} unexpected column(s) were supplied`,
        ),
      );
    const warnings: ImportIssue[] = [];
    const itemCode = normalized(row.values.item_code ?? "");
    const itemName = (row.values.item_name ?? "").trim();
    let item: CatalogItem | undefined;
    if (itemCode) {
      item = byCode.get(itemCode);
      if (!item)
        errors.push(
          issue(
            "ITEM_NOT_FOUND",
            "item_code",
            "Active item code was not found",
          ),
        );
      else if (
        itemName &&
        item.name.toLocaleLowerCase("en") !== itemName.toLocaleLowerCase("en")
      )
        warnings.push(
          issue(
            "ITEM_NAME_MISMATCH",
            "item_name",
            "Item name does not match the item code",
          ),
        );
    } else if (itemName) {
      const matches = byName.get(itemName.toLocaleLowerCase("en")) ?? [];
      if (matches.length > 1)
        errors.push(
          issue(
            "AMBIGUOUS_ITEM",
            "item_name",
            "More than one active item has this name",
          ),
        );
      else if (matches.length === 0)
        errors.push(
          issue("ITEM_NOT_FOUND", "item_name", "Active item was not found"),
        );
      else {
        item = matches[0];
        warnings.push(
          issue(
            "MATCHED_BY_NAME",
            "item_name",
            "Item was matched by exact name because code was blank",
          ),
        );
      }
    } else
      errors.push(
        issue(
          "ITEM_REQUIRED",
          "item_code",
          "Item code or exact item name is required",
        ),
      );

    const quantityText = (row.values.quantity ?? "").trim();
    let quantity: string | null = null;
    if (!/^\d+(?:\.\d{1,6})?$/.test(quantityText) || Number(quantityText) <= 0)
      errors.push(
        issue(
          "INVALID_QUANTITY",
          "quantity",
          "Quantity must be a positive decimal with at most six places",
        ),
      );
    else quantity = quantityText;

    const unitCode = normalized(row.values.unit_code ?? "");
    let unitOfMeasureId: string | null = null;
    if (!unitCode)
      errors.push(issue("INVALID_UNIT", "unit_code", "Unit code is required"));
    else if (item && item.unitOfMeasure.code.toUpperCase() !== unitCode)
      errors.push(
        issue(
          "INVALID_UNIT",
          "unit_code",
          "Unit must equal the item's active base unit",
        ),
      );
    else if (item) {
      unitOfMeasureId = item.unitOfMeasure.id;
      const decimals = quantityText.split(".")[1]?.length ?? 0;
      if (decimals > item.unitOfMeasure.decimalPrecision)
        errors.push(
          issue(
            "INVALID_QUANTITY_PRECISION",
            "quantity",
            "Quantity is more precise than the unit allows",
          ),
        );
    }

    const rawCriticality = normalized(row.values.criticality ?? "");
    let criticality: ValidatedImportRow["criticality"] = null;
    if (!rawCriticality) {
      criticality = "NORMAL";
      warnings.push(
        issue(
          "DEFAULT_CRITICALITY",
          "criticality",
          "Blank criticality defaults to NORMAL",
        ),
      );
    } else if (["CRITICAL", "HIGH", "NORMAL", "LOW"].includes(rawCriticality))
      criticality = rawCriticality as NonNullable<
        ValidatedImportRow["criticality"]
      >;
    else
      errors.push(
        issue(
          "INVALID_CRITICALITY",
          "criticality",
          "Criticality must be CRITICAL, HIGH, NORMAL, or LOW",
        ),
      );

    const notes = (row.values.notes ?? "").trim();
    if (notes.length > 1000)
      errors.push(
        issue("NOTES_TOO_LONG", "notes", "Notes exceed 1000 characters"),
      );
    if (item) {
      if (seen.has(item.id))
        warnings.push(
          issue(
            "DUPLICATE_ITEM_ROW",
            "item_code",
            "Item appears on more than one row; every row will be retained",
          ),
        );
      seen.add(item.id);
    }
    if (Object.values(row.values).every((value) => value.trim().length === 0))
      errors.push(
        issue(
          "EMPTY_ROW",
          "row",
          "Blank rows are retained and must be corrected or removed from the source file",
        ),
      );
    return {
      criticality,
      errors,
      itemId: item?.id ?? null,
      notes,
      quantity,
      rawData: row.values,
      rowNumber: row.rowNumber,
      unitOfMeasureId,
      warnings,
    };
  });
}
