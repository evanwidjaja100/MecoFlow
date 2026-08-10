import { performance } from "node:perf_hooks";
import { calculateReadiness } from "../packages/readiness/src/index.js";
import {
  parseCsv,
  validateImportRows,
  type CatalogItem,
} from "../apps/worker/src/bom-import-parser.js";
import { calculateSupplierScorecard } from "../apps/api/src/reports/supplier-kpis.js";

const READINESS_LINES = 5_000;
const BOM_IMPORT_ROWS = 5_000;
const SCORECARD_FACTS = 10_000;

function measured<T>(operation: () => T) {
  const heapBefore = process.memoryUsage().heapUsed;
  const startedAt = performance.now();
  const result = operation();
  return {
    durationMs: Number((performance.now() - startedAt).toFixed(2)),
    heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore,
    result,
  };
}

const readiness = measured(() =>
  calculateReadiness({
    calculationDate: "2026-07-28",
    lines: Array.from({ length: READINESS_LINES }, (_, index) => ({
      acceptedQuantity: "1",
      allocatedQuantity: "1",
      blockerReason: null,
      bomLineId: `line-${String(index).padStart(5, "0")}`,
      certificateCompleteQuantity: "1",
      certificateRequired: index % 3 === 0,
      criticality:
        index % 10 === 0 ? ("CRITICAL" as const) : ("NORMAL" as const),
      currentStage: "COMPLETE" as const,
      itemCode: `ITEM-${String(index).padStart(5, "0")}`,
      lineNumber: index + 1,
      openNcrCount: 0,
      operativeCommitmentDate: "2026-08-01",
      requiredDate: "2026-08-01",
      requiredQuantity: "1",
      shortage: "0",
      workPackageId: `wp-${index % 100}`,
    })),
    scopeId: "representative-project",
    scopeType: "PROJECT",
    unresolvedProjectNcrCount: 0,
  }),
);

const catalog: CatalogItem[] = Array.from(
  { length: BOM_IMPORT_ROWS },
  (_, index) => ({
    active: true,
    code: `ITEM-${String(index).padStart(5, "0")}`,
    id: `item-${index}`,
    name: `Representative item ${index}`,
    unitOfMeasure: {
      active: true,
      code: "EA",
      decimalPrecision: 0,
      id: "unit-ea",
    },
  }),
);
const csv = Buffer.from(
  [
    "item_code,item_name,quantity,unit_code,criticality,notes",
    ...catalog.map(
      (item, index) =>
        `${item.code},${item.name},1,EA,${index % 10 === 0 ? "CRITICAL" : "NORMAL"},representative`,
    ),
  ].join("\n"),
);
const bomImport = measured(() => {
  const rows = parseCsv(csv);
  const validated = validateImportRows(rows, catalog);
  return {
    byteSize: csv.byteLength,
    errorRows: validated.filter((row) => row.errors.length > 0).length,
    rows: validated.length,
  };
});

const scorecard = measured(() =>
  calculateSupplierScorecard({
    asOf: "2026-12-31T23:59:59.999+07:00",
    deliveries: Array.from({ length: SCORECARD_FACTS }, (_, index) => {
      const month = String((index % 12) + 1).padStart(2, "0");
      return {
        arrivals: [
          {
            arrivedAt: `2026-${month}-15T09:00:00.000+07:00`,
            quantity: "1",
          },
        ],
        commitments: [
          { committedDate: `2026-${month}-15`, revisionNumber: 1 },
          { committedDate: `2026-${month}-16`, revisionNumber: 2 },
        ],
        currentAcknowledged: true,
        orderedQuantity: "1",
        purchaseOrderLineId: `po-line-${index}`,
        requiredDate: `2026-${month}-15`,
      };
    }),
    from: "2026-01-01",
    inspections: Array.from({ length: SCORECARD_FACTS }, (_, index) => {
      const month = String((index % 12) + 1).padStart(2, "0");
      return {
        acceptedQuantity: "1",
        disposition: "ACCEPTED" as const,
        finalizedAt: `2026-${month}-15T10:00:00.000+07:00`,
        finalizedReceivedQuantity: "1",
      };
    }),
    ncrs: Array.from({ length: SCORECARD_FACTS }, (_, index) => {
      const month = String((index % 12) + 1).padStart(2, "0");
      return {
        issuedAt: `2026-${month}-15T11:00:00.000+07:00`,
        responseCount: index % 2,
      };
    }),
    to: "2026-12-31",
  }),
);

console.log(
  JSON.stringify(
    {
      assumptions: {
        bomImportRows: BOM_IMPORT_ROWS,
        readinessLines: READINESS_LINES,
        scorecardDeliveries: SCORECARD_FACTS,
        scorecardInspections: SCORECARD_FACTS,
        scorecardNcrs: SCORECARD_FACTS,
      },
      bomImport: {
        durationMs: bomImport.durationMs,
        heapDeltaBytes: bomImport.heapDeltaBytes,
        ...bomImport.result,
      },
      readiness: {
        blockerCount: readiness.result.blockerCount,
        durationMs: readiness.durationMs,
        heapDeltaBytes: readiness.heapDeltaBytes,
        lineCount: readiness.result.lineCount,
        status: readiness.result.status,
      },
      scorecard: {
        durationMs: scorecard.durationMs,
        heapDeltaBytes: scorecard.heapDeltaBytes,
        modelVersion: scorecard.result.modelVersion,
        trendMonths: scorecard.result.trends.length,
      },
    },
    null,
    2,
  ),
);
