import { Prisma } from "@mecoflow/database";

export type InspectionDisposition =
  "ACCEPTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED" | "REJECTED";

export interface InspectionQuantityDecision {
  accepted: Prisma.Decimal;
  quarantined: Prisma.Decimal;
  received: Prisma.Decimal;
  rejected: Prisma.Decimal;
}

export function inspectionQuantityDecision(input: {
  acceptedQuantity: string;
  decimalPrecision: number;
  disposition: InspectionDisposition;
  receivedQuantity: Prisma.Decimal;
  rejectedQuantity: string;
}): InspectionQuantityDecision {
  const accepted = new Prisma.Decimal(input.acceptedQuantity);
  const rejected = new Prisma.Decimal(input.rejectedQuantity);
  const received = input.receivedQuantity;
  if (
    input.decimalPrecision < 0 ||
    input.decimalPrecision > 6 ||
    accepted.isNegative() ||
    rejected.isNegative() ||
    accepted.decimalPlaces() > input.decimalPrecision ||
    rejected.decimalPlaces() > input.decimalPrecision ||
    received.lte(0) ||
    accepted.plus(rejected).gt(received)
  )
    throw new Error("Inspection quantities are invalid");
  const quarantined = received.minus(accepted).minus(rejected);
  if (
    input.disposition === "REJECTED" &&
    (!accepted.isZero() || !rejected.eq(received))
  )
    throw new Error("Rejected disposition must reject the full quantity");
  if (input.disposition === "QUARANTINED" && !quarantined.gt(0))
    throw new Error("Quarantined disposition requires quarantined quantity");
  if (
    ["ACCEPTED", "CONDITIONALLY_ACCEPTED"].includes(input.disposition) &&
    (!accepted.gt(0) || !quarantined.isZero())
  )
    throw new Error(
      "Accepted dispositions require accepted material and no quarantined remainder",
    );
  return { accepted, quarantined, received, rejected };
}
