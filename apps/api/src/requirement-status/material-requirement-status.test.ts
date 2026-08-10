import { describe, expect, it } from "vitest";
import {
  calculateMaterialRequirementStatus,
  selectLatestCommitmentDate,
  type PurchaseOrderLineInput,
} from "./material-requirement-status.js";

function supplyLine(
  input: Partial<PurchaseOrderLineInput> &
    Pick<PurchaseOrderLineInput, "allocations" | "id">,
): PurchaseOrderLineInput {
  return {
    commitments: [],
    currentRevision: true,
    decimalPrecision: 0,
    lots: [],
    orderStatus: "ACKNOWLEDGED",
    shipments: [],
    ...input,
  };
}

describe("Phase 7A material requirement status calculation", () => {
  it("selects the highest supplier commitment revision deterministically", () => {
    expect(
      selectLatestCommitmentDate([
        { committedDate: "2026-08-20", revisionNumber: 2 },
        { committedDate: "2026-09-01", revisionNumber: 1 },
        { committedDate: "2026-08-25", revisionNumber: 3 },
      ]),
    ).toBe("2026-08-25");
    expect(selectLatestCommitmentDate([])).toBeNull();
  });

  it("combines split sourcing, ignores replaced order plans, and chooses the final operative date", () => {
    const result = calculateMaterialRequirementStatus({
      materialAllocations: [
        { bomLineId: "requirement-a", quantity: "4", status: "CONSUMED" },
        { bomLineId: "requirement-a", quantity: "6", status: "ALLOCATED" },
        { bomLineId: "requirement-a", quantity: "9", status: "RELEASED" },
      ],
      purchaseOrderLines: [
        supplyLine({
          allocations: [
            {
              bomLineId: "requirement-a",
              quantity: "4",
              requiredDate: "2026-10-01",
            },
          ],
          commitments: [
            { committedDate: "2026-08-10", revisionNumber: 1 },
            { committedDate: "2026-08-12", revisionNumber: 2 },
          ],
          id: "po-line-a",
          lots: [
            {
              acceptedQuantity: "4",
              certificateCompleteQuantity: "4",
              correctionQuantityDeltas: [],
              id: "lot-a",
              originalQuantity: "4",
              quarantinedQuantity: "0",
              rejectedQuantity: "0",
              sortKey: "2026-08-01:lot-a",
            },
          ],
          shipments: [{ quantity: "4", status: "ARRIVED" }],
        }),
        supplyLine({
          allocations: [
            {
              bomLineId: "requirement-a",
              quantity: "6",
              requiredDate: "2026-10-01",
            },
          ],
          commitments: [{ committedDate: "2026-09-01", revisionNumber: 1 }],
          id: "po-line-b",
          lots: [
            {
              acceptedQuantity: "6",
              certificateCompleteQuantity: "6",
              correctionQuantityDeltas: [],
              id: "lot-b",
              originalQuantity: "6",
              quarantinedQuantity: "0",
              rejectedQuantity: "0",
              sortKey: "2026-08-02:lot-b",
            },
          ],
          shipments: [{ quantity: "6", status: "IN_TRANSIT" }],
        }),
        supplyLine({
          allocations: [
            {
              bomLineId: "requirement-a",
              quantity: "10",
              requiredDate: "2026-10-01",
            },
          ],
          commitments: [{ committedDate: "2026-12-31", revisionNumber: 99 }],
          currentRevision: false,
          id: "replaced-po-line",
        }),
      ],
      requisitions: [
        { bomLineId: "requirement-a", quantity: "10", status: "APPROVED" },
        { bomLineId: "requirement-a", quantity: "10", status: "CANCELLED" },
      ],
      requirements: [
        {
          bomLineId: "requirement-a",
          decimalPrecision: 0,
          requiredQuantity: "10",
        },
      ],
    });

    expect(result).toEqual([
      {
        acceptedQuantity: "10",
        allocatedQuantity: "10",
        blockerReason: null,
        bomLineId: "requirement-a",
        certificateCompleteQuantity: "10",
        confirmedQuantity: "10",
        currentStage: "COMPLETE",
        operativeCommitmentDate: "2026-09-01",
        orderedQuantity: "10",
        receivedQuantity: "10",
        requiredQuantity: "10",
        requisitionedQuantity: "10",
        shippedQuantity: "10",
        shortage: "0",
      },
    ]);
  });

  it("attributes a pooled PO line once across requirements and retains partial correction and quality outcomes", () => {
    const input = {
      materialAllocations: [
        {
          bomLineId: "requirement-a",
          quantity: "2",
          status: "ALLOCATED" as const,
        },
        {
          bomLineId: "requirement-a",
          quantity: "1",
          status: "CONSUMED" as const,
        },
        {
          bomLineId: "requirement-a",
          quantity: "5",
          status: "RELEASED" as const,
        },
        {
          bomLineId: "requirement-b",
          quantity: "1",
          status: "ALLOCATED" as const,
        },
      ],
      purchaseOrderLines: [
        supplyLine({
          allocations: [
            {
              bomLineId: "requirement-b",
              quantity: "4",
              requiredDate: "2026-09-01",
            },
            {
              bomLineId: "requirement-a",
              quantity: "6",
              requiredDate: "2026-08-01",
            },
          ],
          commitments: [
            { committedDate: "2026-08-15", revisionNumber: 1 },
            { committedDate: "2026-08-20", revisionNumber: 2 },
          ],
          id: "pooled-line",
          lots: [
            {
              acceptedQuantity: "3",
              certificateCompleteQuantity: "3",
              correctionQuantityDeltas: [],
              id: "lot-one",
              originalQuantity: "5",
              quarantinedQuantity: "1",
              rejectedQuantity: "1",
              sortKey: "2026-08-01:lot-one",
            },
            {
              acceptedQuantity: "0",
              certificateCompleteQuantity: "0",
              correctionQuantityDeltas: ["-1"],
              id: "lot-two",
              originalQuantity: "3",
              quarantinedQuantity: "0",
              rejectedQuantity: "0",
              sortKey: "2026-08-02:lot-two",
            },
          ],
          shipments: [
            { quantity: "7", status: "IN_TRANSIT" },
            { quantity: "3", status: "SUBMITTED" },
          ],
        }),
      ],
      requisitions: [
        {
          bomLineId: "requirement-a",
          quantity: "6",
          status: "APPROVED" as const,
        },
        {
          bomLineId: "requirement-b",
          quantity: "4",
          status: "SUBMITTED" as const,
        },
      ],
      requirements: [
        {
          bomLineId: "requirement-a",
          decimalPrecision: 0,
          requiredQuantity: "6",
        },
        {
          bomLineId: "requirement-b",
          decimalPrecision: 0,
          requiredQuantity: "4",
        },
      ],
    };

    const first = calculateMaterialRequirementStatus(input);
    expect(calculateMaterialRequirementStatus(input)).toEqual(first);
    expect(first).toEqual([
      {
        acceptedQuantity: "3",
        allocatedQuantity: "3",
        blockerReason: "REJECTED_MATERIAL",
        bomLineId: "requirement-a",
        certificateCompleteQuantity: "3",
        confirmedQuantity: "6",
        currentStage: "ALLOCATED",
        operativeCommitmentDate: "2026-08-20",
        orderedQuantity: "6",
        receivedQuantity: "6",
        requiredQuantity: "6",
        requisitionedQuantity: "6",
        shippedQuantity: "6",
        shortage: "3",
      },
      {
        acceptedQuantity: "0",
        allocatedQuantity: "1",
        blockerReason: "INSPECTION_PENDING",
        bomLineId: "requirement-b",
        certificateCompleteQuantity: "0",
        confirmedQuantity: "4",
        currentStage: "ALLOCATED",
        operativeCommitmentDate: "2026-08-20",
        orderedQuantity: "4",
        receivedQuantity: "1",
        requiredQuantity: "4",
        requisitionedQuantity: "4",
        shippedQuantity: "1",
        shortage: "3",
      },
    ]);
    expect(
      first.reduce(
        (total, requirement) => total + Number(requirement.receivedQuantity),
        0,
      ),
    ).toBe(7);
  });

  it("reports quarantine and excludes released allocations with exact decimal quantities", () => {
    const [result] = calculateMaterialRequirementStatus({
      materialAllocations: [
        { bomLineId: "precision-line", quantity: "1.25", status: "RELEASED" },
      ],
      purchaseOrderLines: [
        supplyLine({
          allocations: [
            {
              bomLineId: "precision-line",
              quantity: "1.25",
              requiredDate: "2026-08-01",
            },
          ],
          commitments: [{ committedDate: "2026-08-01", revisionNumber: 1 }],
          decimalPrecision: 2,
          id: "precision-po-line",
          lots: [
            {
              acceptedQuantity: "0",
              certificateCompleteQuantity: "0",
              correctionQuantityDeltas: [],
              id: "quarantine-lot",
              originalQuantity: "1.25",
              quarantinedQuantity: "1.25",
              rejectedQuantity: "0",
              sortKey: "2026-08-01:quarantine-lot",
            },
          ],
          shipments: [{ quantity: "1.25", status: "ARRIVED" }],
        }),
      ],
      requisitions: [
        { bomLineId: "precision-line", quantity: "1.25", status: "DRAFT" },
      ],
      requirements: [
        {
          bomLineId: "precision-line",
          decimalPrecision: 2,
          requiredQuantity: "1.25",
        },
      ],
    });
    expect(result).toMatchObject({
      allocatedQuantity: "0",
      blockerReason: "QUARANTINED_MATERIAL",
      currentStage: "RECEIVED",
      receivedQuantity: "1.25",
      shortage: "1.25",
    });
  });

  it("fails closed for over-precise or internally inconsistent persisted inputs", () => {
    expect(() =>
      calculateMaterialRequirementStatus({
        materialAllocations: [],
        purchaseOrderLines: [],
        requisitions: [],
        requirements: [
          {
            bomLineId: "invalid",
            decimalPrecision: 2,
            requiredQuantity: "1.001",
          },
        ],
      }),
    ).toThrow("precision");
  });
});
