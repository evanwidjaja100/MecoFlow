export const MATERIAL_REQUIREMENT_STATUS_MODEL_VERSION =
  "material-requirement-status-v1";

export const MATERIAL_REQUIREMENT_STAGES = [
  "NOT_STARTED",
  "REQUISITIONED",
  "ORDERED",
  "CONFIRMED",
  "SHIPPED",
  "RECEIVED",
  "ACCEPTED",
  "CERTIFICATE_COMPLETE",
  "ALLOCATED",
  "COMPLETE",
] as const;

export type MaterialRequirementStage =
  (typeof MATERIAL_REQUIREMENT_STAGES)[number];

export const MATERIAL_REQUIREMENT_BLOCKERS = [
  "REQUISITION_SHORTFALL",
  "ORDER_SHORTFALL",
  "SUPPLIER_CONFIRMATION_MISSING",
  "SHIPMENT_SHORTFALL",
  "RECEIPT_SHORTFALL",
  "REJECTED_MATERIAL",
  "QUARANTINED_MATERIAL",
  "INSPECTION_PENDING",
  "ACCEPTANCE_SHORTFALL",
  "CERTIFICATE_INCOMPLETE",
  "ALLOCATION_SHORTFALL",
] as const;

export type MaterialRequirementBlocker =
  (typeof MATERIAL_REQUIREMENT_BLOCKERS)[number];

export interface RequirementInput {
  bomLineId: string;
  decimalPrecision: number;
  requiredQuantity: string;
}

export interface RequisitionInput {
  bomLineId: string;
  quantity: string;
  status: "APPROVED" | "CANCELLED" | "DRAFT" | "REJECTED" | "SUBMITTED";
}

export interface PurchaseOrderAllocationInput {
  bomLineId: string;
  quantity: string;
  requiredDate: string;
}

export interface SupplierCommitmentInput {
  committedDate: string;
  revisionNumber: number;
}

export interface ShipmentInput {
  quantity: string;
  status: "ARRIVED" | "CANCELLED" | "DRAFT" | "IN_TRANSIT" | "SUBMITTED";
}

export interface ReceiptLotInput {
  acceptedQuantity: string;
  certificateCompleteQuantity: string;
  correctionQuantityDeltas: readonly string[];
  id: string;
  originalQuantity: string;
  quarantinedQuantity: string;
  rejectedQuantity: string;
  sortKey: string;
}

export interface PurchaseOrderLineInput {
  allocations: readonly PurchaseOrderAllocationInput[];
  commitments: readonly SupplierCommitmentInput[];
  currentRevision: boolean;
  decimalPrecision: number;
  id: string;
  lots: readonly ReceiptLotInput[];
  orderStatus: "ACKNOWLEDGED" | "CANCELLED" | "DRAFT" | "SENT";
  shipments: readonly ShipmentInput[];
}

export interface MaterialAllocationInput {
  bomLineId: string;
  quantity: string;
  status: "ALLOCATED" | "CONSUMED" | "RELEASED";
}

export interface MaterialRequirementCalculationInput {
  materialAllocations: readonly MaterialAllocationInput[];
  purchaseOrderLines: readonly PurchaseOrderLineInput[];
  requisitions: readonly RequisitionInput[];
  requirements: readonly RequirementInput[];
}

export interface MaterialRequirementCalculation {
  acceptedQuantity: string;
  allocatedQuantity: string;
  blockerReason: MaterialRequirementBlocker | null;
  bomLineId: string;
  certificateCompleteQuantity: string;
  confirmedQuantity: string;
  currentStage: MaterialRequirementStage;
  operativeCommitmentDate: string | null;
  orderedQuantity: string;
  receivedQuantity: string;
  requiredQuantity: string;
  requisitionedQuantity: string;
  shippedQuantity: string;
  shortage: string;
}

interface QuantityAccumulator {
  accepted: bigint;
  allocated: bigint;
  certificateComplete: bigint;
  confirmed: bigint;
  operativeCommitmentDate: string | null;
  ordered: bigint;
  precision: number;
  quarantined: bigint;
  received: bigint;
  rejected: bigint;
  required: bigint;
  requisitioned: bigint;
  shipped: bigint;
  unresolved: bigint;
}

interface Capacity {
  bomLineId: string;
  quantity: bigint;
  remaining: bigint;
}

function scaleFor(precision: number) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6)
    throw new Error("Invalid decimal precision");
  return 10n ** BigInt(precision);
}

function parseUnits(value: string, precision: number) {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) throw new Error("Invalid decimal quantity");
  const fraction = match[3] ?? "";
  if (fraction.length > precision)
    throw new Error("Quantity exceeds decimal precision");
  const units =
    BigInt(match[2]!) * scaleFor(precision) +
    BigInt(fraction.padEnd(precision, "0") || "0");
  return match[1] === "-" ? -units : units;
}

function formatUnits(value: bigint, precision: number) {
  if (precision === 0) return value.toString();
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const scale = scaleFor(precision);
  const whole = absolute / scale;
  const fraction = (absolute % scale)
    .toString()
    .padStart(precision, "0")
    .replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole.toString()}${fraction ? `.${fraction}` : ""}`;
}

function requireNonnegative(value: bigint, label: string) {
  if (value < 0n) throw new Error(`${label} cannot be negative`);
  return value;
}

function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Invalid commitment date");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value)
    throw new Error("Invalid commitment date");
  return value;
}

export function selectLatestCommitmentDate(
  commitments: readonly SupplierCommitmentInput[],
) {
  if (commitments.length === 0) return null;
  const selected = [...commitments].sort(
    (left, right) =>
      right.revisionNumber - left.revisionNumber ||
      dateOnly(right.committedDate).localeCompare(dateOnly(left.committedDate)),
  )[0]!.committedDate;
  return dateOnly(selected);
}

function groupedCapacities(line: PurchaseOrderLineInput) {
  const grouped = new Map<
    string,
    { bomLineId: string; quantity: bigint; requiredDate: string }
  >();
  for (const allocation of line.allocations) {
    const quantity = requireNonnegative(
      parseUnits(allocation.quantity, line.decimalPrecision),
      "Purchase-order allocation",
    );
    if (quantity === 0n)
      throw new Error("Purchase-order allocation must be positive");
    const requiredDate = dateOnly(allocation.requiredDate);
    const existing = grouped.get(allocation.bomLineId);
    if (existing) {
      existing.quantity += quantity;
      if (requiredDate < existing.requiredDate)
        existing.requiredDate = requiredDate;
    } else {
      grouped.set(allocation.bomLineId, {
        bomLineId: allocation.bomLineId,
        quantity,
        requiredDate,
      });
    }
  }
  return [...grouped.values()]
    .sort(
      (left, right) =>
        left.requiredDate.localeCompare(right.requiredDate) ||
        left.bomLineId.localeCompare(right.bomLineId),
    )
    .map((entry) => ({
      bomLineId: entry.bomLineId,
      quantity: entry.quantity,
      remaining: entry.quantity,
    }));
}

function allocateSequential(amount: bigint, capacities: Capacity[]) {
  const result: Capacity[] = [];
  let remaining = amount;
  for (const capacity of capacities) {
    if (remaining === 0n) break;
    if (capacity.remaining === 0n) continue;
    const quantity =
      remaining < capacity.remaining ? remaining : capacity.remaining;
    capacity.remaining -= quantity;
    remaining -= quantity;
    result.push({
      bomLineId: capacity.bomLineId,
      quantity,
      remaining: quantity,
    });
  }
  if (remaining !== 0n)
    throw new Error("Supply quantity exceeds purchase-order allocations");
  return result;
}

function addContribution(
  accumulators: Map<string, QuantityAccumulator>,
  bomLineId: string,
  field:
    | "accepted"
    | "certificateComplete"
    | "confirmed"
    | "ordered"
    | "quarantined"
    | "received"
    | "rejected"
    | "shipped"
    | "unresolved",
  quantity: bigint,
  precision: number,
) {
  const accumulator = accumulators.get(bomLineId);
  if (!accumulator) return;
  if (accumulator.precision !== precision)
    throw new Error("Supply and requirement precision do not match");
  accumulator[field] += quantity;
}

function currentStage(accumulator: QuantityAccumulator) {
  if (
    accumulator.allocated >= accumulator.required &&
    accumulator.certificateComplete >= accumulator.required
  )
    return "COMPLETE" as const;
  if (accumulator.allocated > 0n) return "ALLOCATED" as const;
  if (accumulator.certificateComplete > 0n)
    return "CERTIFICATE_COMPLETE" as const;
  if (accumulator.accepted > 0n) return "ACCEPTED" as const;
  if (accumulator.received > 0n) return "RECEIVED" as const;
  if (accumulator.shipped > 0n) return "SHIPPED" as const;
  if (accumulator.confirmed > 0n) return "CONFIRMED" as const;
  if (accumulator.ordered > 0n) return "ORDERED" as const;
  if (accumulator.requisitioned > 0n) return "REQUISITIONED" as const;
  return "NOT_STARTED" as const;
}

function blockerReason(
  accumulator: QuantityAccumulator,
): MaterialRequirementBlocker | null {
  const shortage = accumulator.required - accumulator.allocated;
  if (shortage <= 0n && accumulator.certificateComplete >= accumulator.required)
    return null;
  if (shortage > 0n && accumulator.rejected > 0n) return "REJECTED_MATERIAL";
  if (shortage > 0n && accumulator.quarantined > 0n)
    return "QUARANTINED_MATERIAL";
  if (
    accumulator.accepted < accumulator.required &&
    accumulator.unresolved > 0n
  )
    return "INSPECTION_PENDING";
  if (accumulator.requisitioned < accumulator.required)
    return "REQUISITION_SHORTFALL";
  if (accumulator.ordered < accumulator.required) return "ORDER_SHORTFALL";
  if (accumulator.confirmed < accumulator.required)
    return "SUPPLIER_CONFIRMATION_MISSING";
  if (accumulator.shipped < accumulator.required) return "SHIPMENT_SHORTFALL";
  if (accumulator.received < accumulator.required) return "RECEIPT_SHORTFALL";
  if (accumulator.accepted < accumulator.required)
    return "ACCEPTANCE_SHORTFALL";
  if (accumulator.certificateComplete < accumulator.required)
    return "CERTIFICATE_INCOMPLETE";
  if (accumulator.allocated < accumulator.required)
    return "ALLOCATION_SHORTFALL";
  return null;
}

export function calculateMaterialRequirementStatus(
  input: MaterialRequirementCalculationInput,
): MaterialRequirementCalculation[] {
  const accumulators = new Map<string, QuantityAccumulator>();
  for (const requirement of input.requirements) {
    if (accumulators.has(requirement.bomLineId))
      throw new Error("Duplicate requirement");
    const required = parseUnits(
      requirement.requiredQuantity,
      requirement.decimalPrecision,
    );
    if (required <= 0n) throw new Error("Required quantity must be positive");
    accumulators.set(requirement.bomLineId, {
      accepted: 0n,
      allocated: 0n,
      certificateComplete: 0n,
      confirmed: 0n,
      operativeCommitmentDate: null,
      ordered: 0n,
      precision: requirement.decimalPrecision,
      quarantined: 0n,
      received: 0n,
      rejected: 0n,
      required,
      requisitioned: 0n,
      shipped: 0n,
      unresolved: 0n,
    });
  }

  for (const requisition of input.requisitions) {
    if (!["APPROVED", "DRAFT", "SUBMITTED"].includes(requisition.status))
      continue;
    const accumulator = accumulators.get(requisition.bomLineId);
    if (!accumulator) continue;
    const quantity = parseUnits(requisition.quantity, accumulator.precision);
    if (quantity <= 0n)
      throw new Error("Requisition quantity must be positive");
    accumulator.requisitioned += quantity;
  }

  for (const line of [...input.purchaseOrderLines].sort((left, right) =>
    left.id.localeCompare(right.id),
  )) {
    const capacities = groupedCapacities(line);
    const latestCommitmentDate = selectLatestCommitmentDate(line.commitments);
    const commerciallyOrdered =
      line.currentRevision &&
      ["ACKNOWLEDGED", "SENT"].includes(line.orderStatus);
    if (commerciallyOrdered) {
      for (const capacity of capacities) {
        addContribution(
          accumulators,
          capacity.bomLineId,
          "ordered",
          capacity.quantity,
          line.decimalPrecision,
        );
        if (line.orderStatus === "ACKNOWLEDGED" && latestCommitmentDate) {
          addContribution(
            accumulators,
            capacity.bomLineId,
            "confirmed",
            capacity.quantity,
            line.decimalPrecision,
          );
          const accumulator = accumulators.get(capacity.bomLineId);
          if (
            accumulator &&
            (!accumulator.operativeCommitmentDate ||
              latestCommitmentDate > accumulator.operativeCommitmentDate)
          )
            accumulator.operativeCommitmentDate = latestCommitmentDate;
        }
      }
    }

    const dispatchedQuantity = line.shipments
      .filter(({ status }) => ["ARRIVED", "IN_TRANSIT"].includes(status))
      .reduce((total, shipment) => {
        const quantity = parseUnits(shipment.quantity, line.decimalPrecision);
        if (quantity <= 0n)
          throw new Error("Shipment quantity must be positive");
        return total + quantity;
      }, 0n);
    for (const contribution of allocateSequential(
      dispatchedQuantity,
      capacities.map((capacity) => ({ ...capacity })),
    ))
      addContribution(
        accumulators,
        contribution.bomLineId,
        "shipped",
        contribution.quantity,
        line.decimalPrecision,
      );

    const receiptCapacities = capacities.map((capacity) => ({ ...capacity }));
    for (const lot of [...line.lots].sort(
      (left, right) =>
        left.sortKey.localeCompare(right.sortKey) ||
        left.id.localeCompare(right.id),
    )) {
      const received = lot.correctionQuantityDeltas.reduce(
        (total, delta) => total + parseUnits(delta, line.decimalPrecision),
        parseUnits(lot.originalQuantity, line.decimalPrecision),
      );
      if (received <= 0n) throw new Error("Effective receipt must be positive");
      const accepted = requireNonnegative(
        parseUnits(lot.acceptedQuantity, line.decimalPrecision),
        "Accepted quantity",
      );
      const rejected = requireNonnegative(
        parseUnits(lot.rejectedQuantity, line.decimalPrecision),
        "Rejected quantity",
      );
      const quarantined = requireNonnegative(
        parseUnits(lot.quarantinedQuantity, line.decimalPrecision),
        "Quarantined quantity",
      );
      const certificateComplete = requireNonnegative(
        parseUnits(lot.certificateCompleteQuantity, line.decimalPrecision),
        "Certificate-complete quantity",
      );
      if (accepted + rejected + quarantined > received)
        throw new Error("Lot disposition exceeds effective receipt");
      if (certificateComplete > accepted)
        throw new Error(
          "Certificate-complete quantity exceeds accepted quantity",
        );
      const unresolved = received - accepted - rejected - quarantined;
      const receivedSlices = allocateSequential(received, receiptCapacities);
      for (const contribution of receivedSlices)
        addContribution(
          accumulators,
          contribution.bomLineId,
          "received",
          contribution.quantity,
          line.decimalPrecision,
        );

      const outcomeCapacities = receivedSlices.map((slice) => ({ ...slice }));
      const acceptedSlices = allocateSequential(accepted, outcomeCapacities);
      for (const contribution of acceptedSlices)
        addContribution(
          accumulators,
          contribution.bomLineId,
          "accepted",
          contribution.quantity,
          line.decimalPrecision,
        );
      for (const contribution of allocateSequential(
        rejected,
        outcomeCapacities,
      ))
        addContribution(
          accumulators,
          contribution.bomLineId,
          "rejected",
          contribution.quantity,
          line.decimalPrecision,
        );
      for (const contribution of allocateSequential(
        quarantined,
        outcomeCapacities,
      ))
        addContribution(
          accumulators,
          contribution.bomLineId,
          "quarantined",
          contribution.quantity,
          line.decimalPrecision,
        );
      for (const contribution of allocateSequential(
        unresolved,
        outcomeCapacities,
      ))
        addContribution(
          accumulators,
          contribution.bomLineId,
          "unresolved",
          contribution.quantity,
          line.decimalPrecision,
        );
      for (const contribution of allocateSequential(
        certificateComplete,
        acceptedSlices.map((slice) => ({ ...slice })),
      ))
        addContribution(
          accumulators,
          contribution.bomLineId,
          "certificateComplete",
          contribution.quantity,
          line.decimalPrecision,
        );
    }
  }

  for (const allocation of input.materialAllocations) {
    if (allocation.status === "RELEASED") continue;
    const accumulator = accumulators.get(allocation.bomLineId);
    if (!accumulator) continue;
    const quantity = parseUnits(allocation.quantity, accumulator.precision);
    if (quantity <= 0n)
      throw new Error("Material allocation quantity must be positive");
    accumulator.allocated += quantity;
  }

  return input.requirements.map((requirement) => {
    const accumulator = accumulators.get(requirement.bomLineId)!;
    const shortage =
      accumulator.required > accumulator.allocated
        ? accumulator.required - accumulator.allocated
        : 0n;
    const format = (value: bigint) => formatUnits(value, accumulator.precision);
    return {
      acceptedQuantity: format(accumulator.accepted),
      allocatedQuantity: format(accumulator.allocated),
      blockerReason: blockerReason(accumulator),
      bomLineId: requirement.bomLineId,
      certificateCompleteQuantity: format(accumulator.certificateComplete),
      confirmedQuantity: format(accumulator.confirmed),
      currentStage: currentStage(accumulator),
      operativeCommitmentDate: accumulator.operativeCommitmentDate,
      orderedQuantity: format(accumulator.ordered),
      receivedQuantity: format(accumulator.received),
      requiredQuantity: format(accumulator.required),
      requisitionedQuantity: format(accumulator.requisitioned),
      shippedQuantity: format(accumulator.shipped),
      shortage: format(shortage),
    };
  });
}
