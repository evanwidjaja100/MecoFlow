export type ExportCell = boolean | null | number | string;

export interface ExportColumn<Row> {
  header: string;
  value: (row: Row) => ExportCell;
}

export interface ReportExport<Row> {
  columns: Array<ExportColumn<Row>>;
  filters: Record<string, string>;
  generatedAt: string;
  reportKey: string;
  rows: Row[];
  trends?: {
    columns: Array<ExportColumn<Record<string, ExportCell>>>;
    rows: Array<Record<string, ExportCell>>;
  };
}

export function formulaSafe(value: string): string {
  return /^\s*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: ExportCell): string {
  const safe =
    typeof value === "string" ? formulaSafe(value) : String(value ?? "");
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createReportCsv<Row>(report: ReportExport<Row>): string {
  const metadata: ExportCell[][] = [
    ["report_key", report.reportKey],
    ["generated_at_utc", report.generatedAt],
    ...Object.entries(report.filters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [`filter.${key}`, value]),
    [],
  ];
  const data = [
    report.columns.map(({ header }) => header),
    ...report.rows.map((row) =>
      report.columns.map((column) => column.value(row)),
    ),
  ];
  return [...metadata, ...data]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
    .concat("\r\n");
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(entries: Array<{ data: string; name: string }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.data, "utf8");
    const checksum = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const central = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...localParts, central, end]);
}

function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function columnName(index: number): string {
  let result = "";
  let current = index + 1;
  while (current > 0) {
    current -= 1;
    result = String.fromCharCode(65 + (current % 26)) + result;
    current = Math.floor(current / 26);
  }
  return result;
}

function worksheet(rows: ExportCell[][]): string {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          if (typeof value === "number" && Number.isFinite(value))
            return `<c r="${reference}" t="n"><v>${value}</v></c>`;
          const safe = formulaSafe(String(value ?? ""));
          return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(safe)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const width = Math.max(1, ...rows.map((row) => row.length));
  const height = Math.max(1, rows.length);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${columnName(width - 1)}${height}"/><sheetData>${body}</sheetData></worksheet>`;
}

export function createReportXlsx<Row>(report: ReportExport<Row>): Buffer {
  const metadataRows: ExportCell[][] = [
    ["report_key", report.reportKey],
    ["generated_at_utc", report.generatedAt],
    ...Object.entries(report.filters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [`filter.${key}`, value]),
  ];
  const dataRows: ExportCell[][] = [
    report.columns.map(({ header }) => header),
    ...report.rows.map((row) =>
      report.columns.map((column) => column.value(row)),
    ),
  ];
  const trendRows: ExportCell[][] = report.trends
    ? [
        report.trends.columns.map(({ header }) => header),
        ...report.trends.rows.map((row) =>
          report.trends!.columns.map((column) => column.value(row)),
        ),
      ]
    : [["No trend data"]];
  return zip([
    {
      name: "[Content_Types].xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    },
    {
      name: "_rels/.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    },
    {
      name: "xl/workbook.xml",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Metadata" sheetId="1" r:id="rId1"/><sheet name="Data" sheetId="2" r:id="rId2"/><sheet name="Trends" sheetId="3" r:id="rId3"/></sheets></workbook>',
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/></Relationships>',
    },
    { name: "xl/worksheets/sheet1.xml", data: worksheet(metadataRows) },
    { name: "xl/worksheets/sheet2.xml", data: worksheet(dataRows) },
    { name: "xl/worksheets/sheet3.xml", data: worksheet(trendRows) },
  ]);
}
