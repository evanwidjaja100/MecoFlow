export interface RequisitionQuantityDecision {
  coveredQuantity: number;
  exceedsNeed: boolean;
  outstandingQuantity: number;
  resultingCoverage: number;
}

export function calculateRequisitionQuantity(
  requiredQuantity: number,
  coveredQuantity: number,
  requestedQuantity: number,
): RequisitionQuantityDecision {
  if (
    ![requiredQuantity, coveredQuantity, requestedQuantity].every(
      Number.isFinite,
    ) ||
    requiredQuantity <= 0 ||
    coveredQuantity < 0 ||
    requestedQuantity <= 0
  )
    throw new Error("Invalid requisition quantity input");
  const resultingCoverage = coveredQuantity + requestedQuantity;
  return {
    coveredQuantity,
    exceedsNeed: resultingCoverage > requiredQuantity,
    outstandingQuantity: Math.max(0, requiredQuantity - coveredQuantity),
    resultingCoverage,
  };
}
