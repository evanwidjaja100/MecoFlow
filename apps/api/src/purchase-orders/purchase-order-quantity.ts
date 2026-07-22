export interface PurchaseOrderQuantityDecision {
  availableQuantity: number;
  exceedsApprovedAvailable: boolean;
  resultingOrderedQuantity: number;
}

export function calculatePurchaseOrderQuantity(
  approvedQuantity: number,
  alreadyOrderedQuantity: number,
  requestedQuantity: number,
): PurchaseOrderQuantityDecision {
  if (
    ![approvedQuantity, alreadyOrderedQuantity, requestedQuantity].every(
      Number.isFinite,
    ) ||
    approvedQuantity <= 0 ||
    alreadyOrderedQuantity < 0 ||
    requestedQuantity <= 0
  )
    throw new Error("Invalid purchase order quantity input");
  const availableQuantity = Math.max(
    0,
    approvedQuantity - alreadyOrderedQuantity,
  );
  return {
    availableQuantity,
    exceedsApprovedAvailable: requestedQuantity > availableQuantity,
    resultingOrderedQuantity: alreadyOrderedQuantity + requestedQuantity,
  };
}
