import { describe, expect, it } from "vitest";
import {
  calculateSupplierScorecard,
  type SupplierScorecardInput,
} from "./supplier-kpis.js";

const input: SupplierScorecardInput = {
  asOf: "2026-03-31T16:00:00.000Z",
  deliveries: [
    {
      arrivals: [{ arrivedAt: "2026-01-09T12:00:00.000Z", quantity: "10" }],
      commitments: [
        { committedDate: "2026-01-10", revisionNumber: 1 },
        { committedDate: "2026-01-12", revisionNumber: 2 },
      ],
      currentAcknowledged: true,
      orderedQuantity: "10",
      purchaseOrderLineId: "line-1",
      requiredDate: "2026-01-11",
    },
    {
      arrivals: [{ arrivedAt: "2026-02-12T03:00:00.000Z", quantity: "5" }],
      commitments: [
        { committedDate: "2026-02-10", revisionNumber: 1 },
        { committedDate: "2026-02-15", revisionNumber: 2 },
      ],
      currentAcknowledged: true,
      orderedQuantity: "10",
      purchaseOrderLineId: "line-2",
      requiredDate: "2026-02-09",
    },
    {
      arrivals: [],
      commitments: [{ committedDate: "2026-04-01", revisionNumber: 1 }],
      currentAcknowledged: true,
      orderedQuantity: "20",
      purchaseOrderLineId: "future",
      requiredDate: "2026-04-01",
    },
  ],
  from: "2026-01-01",
  inspections: [
    {
      acceptedQuantity: "8",
      disposition: "ACCEPTED",
      finalizedAt: "2026-01-20T02:00:00.000Z",
      finalizedReceivedQuantity: "10",
    },
    {
      acceptedQuantity: "5",
      disposition: "CONDITIONALLY_ACCEPTED",
      finalizedAt: "2026-02-20T02:00:00.000Z",
      finalizedReceivedQuantity: "10",
    },
    {
      acceptedQuantity: "0",
      disposition: "REJECTED",
      finalizedAt: "2026-02-21T02:00:00.000Z",
      finalizedReceivedQuantity: "5",
    },
  ],
  ncrs: [
    { issuedAt: "2026-01-15T02:00:00.000Z", responseCount: 1 },
    { issuedAt: "2026-02-15T02:00:00.000Z", responseCount: 0 },
  ],
  to: "2026-03-31",
};

describe("supplier scorecard KPI fixtures", () => {
  it("distinguishes original and latest commitments with exact known outcomes", () => {
    const result = calculateSupplierScorecard(input);
    expect(result.kpis.originalCommitmentOnTimeRate).toEqual({
      denominator: "20",
      numerator: "10",
      percentage: 50,
      unit: "QUANTITY",
    });
    expect(result.kpis.latestCommitmentOnTimeRate.percentage).toBe(75);
    expect(result.kpis.requiredDateDeliveryRate.percentage).toBe(50);
    expect(result.kpis.commitmentRevisionRate.percentage).toBe(100);
    expect(result.kpis.firstPassAcceptanceRate.percentage).toBe(32);
    expect(result.kpis.usableAcceptanceRate.percentage).toBe(52);
    expect(result.kpis.ncrResponseRate.percentage).toBe(50);
    expect(result.trends).toHaveLength(3);
  });

  it("returns null rather than a misleading percentage for empty cohorts", () => {
    const result = calculateSupplierScorecard({
      asOf: "2026-01-31T00:00:00.000Z",
      deliveries: [],
      from: "2026-01-01",
      inspections: [],
      ncrs: [],
      to: "2026-01-31",
    });
    for (const metric of Object.values(result.kpis))
      expect(metric.percentage).toBeNull();
  });

  it("excludes superseded unshipped lines and retains noncurrent arrived lines", () => {
    const result = calculateSupplierScorecard({
      ...input,
      deliveries: [
        {
          ...input.deliveries[0]!,
          arrivals: [],
          currentAcknowledged: false,
        },
        {
          ...input.deliveries[1]!,
          currentAcknowledged: false,
        },
      ],
      inspections: [],
      ncrs: [],
    });
    expect(result.kpis.originalCommitmentOnTimeRate.denominator).toBe("10");
    expect(result.kpis.originalCommitmentOnTimeRate.percentage).toBe(0);
    expect(result.kpis.latestCommitmentOnTimeRate.percentage).toBe(50);
  });

  it("covers every finalized quality disposition with quantity weighting", () => {
    const result = calculateSupplierScorecard({
      asOf: "2026-01-31T00:00:00.000Z",
      deliveries: [],
      from: "2026-01-01",
      inspections: [
        {
          acceptedQuantity: "10",
          disposition: "ACCEPTED",
          finalizedAt: "2026-01-10T00:00:00.000Z",
          finalizedReceivedQuantity: "10",
        },
        {
          acceptedQuantity: "5",
          disposition: "CONDITIONALLY_ACCEPTED",
          finalizedAt: "2026-01-11T00:00:00.000Z",
          finalizedReceivedQuantity: "5",
        },
        {
          acceptedQuantity: "0",
          disposition: "QUARANTINED",
          finalizedAt: "2026-01-12T00:00:00.000Z",
          finalizedReceivedQuantity: "5",
        },
        {
          acceptedQuantity: "0",
          disposition: "REJECTED",
          finalizedAt: "2026-01-13T00:00:00.000Z",
          finalizedReceivedQuantity: "5",
        },
      ],
      ncrs: [],
      to: "2026-01-31",
    });
    expect(result.kpis.firstPassAcceptanceRate.percentage).toBe(40);
    expect(result.kpis.usableAcceptanceRate.percentage).toBe(60);
  });

  it("counts delivery after both commitment dates as late and rounds half-up", () => {
    const result = calculateSupplierScorecard({
      asOf: "2026-01-31T00:00:00.000Z",
      deliveries: [
        {
          arrivals: [{ arrivedAt: "2026-01-21T00:00:00.000Z", quantity: "1" }],
          commitments: [
            { committedDate: "2026-01-10", revisionNumber: 1 },
            { committedDate: "2026-01-20", revisionNumber: 2 },
          ],
          currentAcknowledged: true,
          orderedQuantity: "1",
          purchaseOrderLineId: "late-both",
          requiredDate: "2026-01-09",
        },
      ],
      from: "2026-01-01",
      inspections: [],
      ncrs: [
        { issuedAt: "2026-01-10T00:00:00.000Z", responseCount: 1 },
        { issuedAt: "2026-01-11T00:00:00.000Z", responseCount: 0 },
        { issuedAt: "2026-01-12T00:00:00.000Z", responseCount: 0 },
      ],
      to: "2026-01-31",
    });
    expect(result.kpis.originalCommitmentOnTimeRate.percentage).toBe(0);
    expect(result.kpis.latestCommitmentOnTimeRate.percentage).toBe(0);
    expect(result.kpis.ncrResponseRate.percentage).toBe(33.33);
  });
});
