export type PurchaseOrderStatus =
  "DRAFT" | "SENT" | "ACKNOWLEDGED" | "CANCELLED";

const transitions: Record<PurchaseOrderStatus, readonly PurchaseOrderStatus[]> =
  {
    ACKNOWLEDGED: ["DRAFT", "CANCELLED"],
    CANCELLED: [],
    DRAFT: ["SENT", "CANCELLED"],
    SENT: ["ACKNOWLEDGED", "DRAFT", "CANCELLED"],
  };

export function canTransitionPurchaseOrder(
  source: PurchaseOrderStatus,
  target: PurchaseOrderStatus,
): boolean {
  return transitions[source].includes(target);
}

export function canRevisePurchaseOrder(status: PurchaseOrderStatus): boolean {
  return status !== "CANCELLED";
}
