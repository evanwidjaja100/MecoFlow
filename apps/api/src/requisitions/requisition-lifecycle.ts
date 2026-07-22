export type RequisitionStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";

const transitions: Record<RequisitionStatus, readonly RequisitionStatus[]> = {
  APPROVED: ["CANCELLED"],
  CANCELLED: [],
  DRAFT: ["SUBMITTED", "CANCELLED"],
  REJECTED: [],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
};

export function canTransitionRequisition(
  source: RequisitionStatus,
  target: RequisitionStatus,
): boolean {
  return transitions[source].includes(target);
}
