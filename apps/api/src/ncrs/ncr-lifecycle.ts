export type NcrStatus =
  "CANCELLED" | "CLOSED" | "DRAFT" | "ISSUED" | "SUPPLIER_RESPONDED";

const transitions: Readonly<Record<NcrStatus, readonly NcrStatus[]>> = {
  CANCELLED: [],
  CLOSED: [],
  DRAFT: ["ISSUED", "CANCELLED"],
  ISSUED: ["SUPPLIER_RESPONDED", "CLOSED", "CANCELLED"],
  SUPPLIER_RESPONDED: ["CLOSED"],
};

export function canTransitionNcr(source: NcrStatus, target: NcrStatus) {
  return transitions[source].includes(target);
}
