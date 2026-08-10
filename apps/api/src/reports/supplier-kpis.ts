export const SUPPLIER_SCORECARD_MODEL_VERSION =
  "supplier-scorecard-calculator-v1";

export type InspectionDisposition =
  "ACCEPTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED" | "REJECTED";

export interface SupplierDeliveryLineInput {
  arrivals: Array<{ arrivedAt: string; quantity: string }>;
  commitments: Array<{ committedDate: string; revisionNumber: number }>;
  currentAcknowledged: boolean;
  orderedQuantity: string;
  purchaseOrderLineId: string;
  requiredDate: string;
}

export interface SupplierInspectionInput {
  acceptedQuantity: string;
  disposition: InspectionDisposition;
  finalizedAt: string;
  finalizedReceivedQuantity: string;
}

export interface SupplierNcrInput {
  issuedAt: string;
  responseCount: number;
}

export interface SupplierScorecardInput {
  asOf: string;
  deliveries: SupplierDeliveryLineInput[];
  from: string;
  inspections: SupplierInspectionInput[];
  ncrs: SupplierNcrInput[];
  to: string;
}

export interface RateMetric {
  denominator: string;
  numerator: string;
  percentage: number | null;
  unit: "COUNT" | "QUANTITY";
}

export interface SupplierKpis {
  commitmentRevisionRate: RateMetric;
  firstPassAcceptanceRate: RateMetric;
  latestCommitmentOnTimeRate: RateMetric;
  ncrResponseRate: RateMetric;
  originalCommitmentOnTimeRate: RateMetric;
  requiredDateDeliveryRate: RateMetric;
  usableAcceptanceRate: RateMetric;
}

export interface SupplierScorecardResult {
  kpis: SupplierKpis;
  modelVersion: typeof SUPPLIER_SCORECARD_MODEL_VERSION;
  trends: Array<{ kpis: SupplierKpis; month: string }>;
}

const SCALE = 1_000_000n;
const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Jakarta",
  year: "numeric",
});

function decimal(value: string): bigint {
  if (!/^\d+(?:\.\d{1,6})?$/.test(value))
    throw new Error("Invalid persisted KPI quantity");
  const [whole = "0", fraction = ""] = value.split(".");
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, "0"));
}

function decimalString(value: bigint): string {
  const whole = value / SCALE;
  const fraction = (value % SCALE)
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function countString(value: number): string {
  return String(value);
}

function percentage(numerator: bigint, denominator: bigint): number | null {
  if (denominator === 0n) return null;
  const hundredths = (numerator * 10_000n + denominator / 2n) / denominator;
  return Number(hundredths) / 100;
}

function quantityRate(numerator: bigint, denominator: bigint): RateMetric {
  return {
    denominator: decimalString(denominator),
    numerator: decimalString(numerator),
    percentage: percentage(numerator, denominator),
    unit: "QUANTITY",
  };
}

function countRate(numerator: number, denominator: number): RateMetric {
  return {
    denominator: countString(denominator),
    numerator: countString(numerator),
    percentage:
      denominator === 0
        ? null
        : Math.round((numerator / denominator) * 10_000) / 100,
    unit: "COUNT",
  };
}

function jakartaDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new Error("Invalid persisted KPI date");
  const parts = jakartaDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function eligible(
  date: string,
  from: string,
  to: string,
  asOf: string,
): boolean {
  return date >= from && date <= to && date <= asOf;
}

function arrivedBy(
  line: SupplierDeliveryLineInput,
  benchmarkDate: string,
): bigint {
  const arrived = line.arrivals.reduce(
    (total, arrival) =>
      arrival.arrivedAt <= benchmarkDate
        ? total + decimal(arrival.quantity)
        : total,
    0n,
  );
  const ordered = decimal(line.orderedQuantity);
  return arrived > ordered ? ordered : arrived;
}

function deliveryRate(
  lines: readonly SupplierDeliveryLineInput[],
  from: string,
  to: string,
  asOf: string,
  benchmark: (line: SupplierDeliveryLineInput) => string | null,
): RateMetric {
  let numerator = 0n;
  let denominator = 0n;
  for (const line of lines) {
    if (!line.currentAcknowledged && line.arrivals.length === 0) continue;
    const date = benchmark(line);
    if (!date || !eligible(date, from, to, asOf)) continue;
    denominator += decimal(line.orderedQuantity);
    numerator += arrivedBy(line, date);
  }
  return quantityRate(numerator, denominator);
}

function commitmentDates(line: SupplierDeliveryLineInput): {
  latest: string | null;
  original: string | null;
} {
  const sorted = [...line.commitments].sort(
    (left, right) =>
      left.revisionNumber - right.revisionNumber ||
      left.committedDate.localeCompare(right.committedDate),
  );
  return {
    latest: sorted.at(-1)?.committedDate ?? null,
    original: sorted[0]?.committedDate ?? null,
  };
}

function calculatePeriod(
  input: SupplierScorecardInput,
  from: string,
  to: string,
): SupplierKpis {
  const asOf = input.asOf;
  const requiredDateDeliveryRate = deliveryRate(
    input.deliveries,
    from,
    to,
    asOf,
    (line) => line.requiredDate,
  );
  const originalCommitmentOnTimeRate = deliveryRate(
    input.deliveries,
    from,
    to,
    asOf,
    (line) => commitmentDates(line).original,
  );
  const latestCommitmentOnTimeRate = deliveryRate(
    input.deliveries,
    from,
    to,
    asOf,
    (line) => commitmentDates(line).latest,
  );

  const committedLines = input.deliveries.filter((line) => {
    const original = commitmentDates(line).original;
    return (
      (line.currentAcknowledged || line.arrivals.length > 0) &&
      original !== null &&
      original >= from &&
      original <= to
    );
  });
  const revisedLines = committedLines.filter((line) => {
    const dates = commitmentDates(line);
    return dates.original !== dates.latest;
  });

  const inspections = input.inspections.filter((inspection) => {
    const finalizedDate = inspection.finalizedAt;
    return finalizedDate >= from && finalizedDate <= to;
  });
  const inspectedQuantity = inspections.reduce(
    (total, inspection) =>
      total + decimal(inspection.finalizedReceivedQuantity),
    0n,
  );
  const firstPassAccepted = inspections.reduce(
    (total, inspection) =>
      inspection.disposition === "ACCEPTED"
        ? total + decimal(inspection.acceptedQuantity)
        : total,
    0n,
  );
  const usableAccepted = inspections.reduce(
    (total, inspection) =>
      ["ACCEPTED", "CONDITIONALLY_ACCEPTED"].includes(inspection.disposition)
        ? total + decimal(inspection.acceptedQuantity)
        : total,
    0n,
  );

  const ncrs = input.ncrs.filter((ncr) => {
    const issuedDate = ncr.issuedAt;
    return issuedDate >= from && issuedDate <= to;
  });
  return {
    commitmentRevisionRate: countRate(
      revisedLines.length,
      committedLines.length,
    ),
    firstPassAcceptanceRate: quantityRate(firstPassAccepted, inspectedQuantity),
    latestCommitmentOnTimeRate,
    ncrResponseRate: countRate(
      ncrs.filter(({ responseCount }) => responseCount > 0).length,
      ncrs.length,
    ),
    originalCommitmentOnTimeRate,
    requiredDateDeliveryRate,
    usableAcceptanceRate: quantityRate(usableAccepted, inspectedQuantity),
  };
}

function monthRanges(
  from: string,
  to: string,
): Array<{ from: string; month: string; to: string }> {
  const [fromYear, fromMonth] = from.split("-").map(Number);
  const [toYear, toMonth] = to.split("-").map(Number);
  if (!fromYear || !fromMonth || !toYear || !toMonth)
    throw new Error("Invalid scorecard period");
  const ranges: Array<{ from: string; month: string; to: string }> = [];
  let cursor = new Date(Date.UTC(fromYear, fromMonth - 1, 1));
  const end = new Date(Date.UTC(toYear, toMonth - 1, 1));
  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const monthNumber = cursor.getUTCMonth() + 1;
    const month = `${year}-${String(monthNumber).padStart(2, "0")}`;
    const lastDay = new Date(Date.UTC(year, monthNumber, 0))
      .toISOString()
      .slice(0, 10);
    ranges.push({
      from: month === from.slice(0, 7) ? from : `${month}-01`,
      month,
      to: month === to.slice(0, 7) ? to : lastDay,
    });
    cursor = new Date(Date.UTC(year, monthNumber, 1));
  }
  if (ranges.length > 12) throw new Error("Scorecard range exceeds 12 months");
  return ranges;
}

export function calculateSupplierScorecard(
  input: SupplierScorecardInput,
): SupplierScorecardResult {
  if (input.from > input.to) throw new Error("Invalid scorecard period");
  const normalized: SupplierScorecardInput = {
    ...input,
    asOf: jakartaDate(input.asOf),
    deliveries: input.deliveries.map((line) => ({
      ...line,
      arrivals: line.arrivals.map((arrival) => ({
        ...arrival,
        arrivedAt: jakartaDate(arrival.arrivedAt),
      })),
    })),
    inspections: input.inspections.map((inspection) => ({
      ...inspection,
      finalizedAt: jakartaDate(inspection.finalizedAt),
    })),
    ncrs: input.ncrs.map((ncr) => ({
      ...ncr,
      issuedAt: jakartaDate(ncr.issuedAt),
    })),
  };
  return {
    kpis: calculatePeriod(normalized, input.from, input.to),
    modelVersion: SUPPLIER_SCORECARD_MODEL_VERSION,
    trends: monthRanges(input.from, input.to).map((range) => ({
      kpis: calculatePeriod(normalized, range.from, range.to),
      month: range.month,
    })),
  };
}
