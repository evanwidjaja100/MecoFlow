export type AdvanceShipmentNoticeStatus =
  "DRAFT" | "SUBMITTED" | "IN_TRANSIT" | "ARRIVED" | "CANCELLED";

const transitions: Record<
  AdvanceShipmentNoticeStatus,
  readonly AdvanceShipmentNoticeStatus[]
> = {
  ARRIVED: [],
  CANCELLED: [],
  DRAFT: ["SUBMITTED", "CANCELLED"],
  IN_TRANSIT: ["ARRIVED"],
  SUBMITTED: ["IN_TRANSIT", "CANCELLED"],
};

export function canTransitionShipment(
  source: AdvanceShipmentNoticeStatus,
  target: AdvanceShipmentNoticeStatus,
): boolean {
  return transitions[source].includes(target);
}
