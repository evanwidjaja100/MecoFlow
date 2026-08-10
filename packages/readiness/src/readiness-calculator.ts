import type {
  MaterialRequirementBlocker,
  MaterialRequirementStage,
} from "./material-requirement-status.js";

export const READINESS_CALCULATOR_VERSION = "readiness-calculator-v1";
export const READINESS_RULE_VERSION = "readiness-rules-v1";

export const READINESS_STATUSES = [
  "RED",
  "AMBER",
  "GREEN",
  "COMPLETE",
] as const;
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];

export const CRITICALITY_WEIGHTS = {
  CRITICAL: 8,
  HIGH: 4,
  LOW: 1,
  NORMAL: 2,
} as const;

export const STAGE_SCORES: Record<MaterialRequirementStage, number> = {
  ACCEPTED: 80,
  ALLOCATED: 95,
  CERTIFICATE_COMPLETE: 90,
  COMPLETE: 100,
  CONFIRMED: 45,
  NOT_STARTED: 0,
  ORDERED: 30,
  RECEIVED: 70,
  REQUISITIONED: 15,
  SHIPPED: 60,
};

export const READINESS_REASON_CODES = [
  "NO_RELEASED_REQUIREMENTS",
  "CRITICAL_REJECTED_MATERIAL",
  "CRITICAL_QUARANTINED_MATERIAL",
  "CRITICAL_CERTIFICATE_MISSING",
  "CRITICAL_OPEN_NCR",
  "CRITICAL_LATE_COMMITMENT",
  "CRITICAL_SHORTAGE_DUE",
  "LATE_COMMITMENT",
  "OPEN_NCR",
  "PARTIAL_ACCEPTANCE",
  "SHORTAGE_DUE_SOON",
  "FUTURE_LOW_PRIORITY_SHORTAGE",
  "WEIGHTED_SCORE_RED",
  "WEIGHTED_SCORE_AMBER",
] as const;
export type ReadinessReasonCode = (typeof READINESS_REASON_CODES)[number];

export const RECOMMENDED_ACTION_CODES = [
  "RELEASE_REQUIREMENT",
  "RAISE_REQUISITION",
  "PLACE_ORDER",
  "OBTAIN_SUPPLIER_CONFIRMATION",
  "EXPEDITE_SHIPMENT",
  "RECEIVE_MATERIAL",
  "COMPLETE_INSPECTION",
  "REPLACE_REJECTED_MATERIAL",
  "RESOLVE_QUARANTINE",
  "COMPLETE_CERTIFICATE_REVIEW",
  "ALLOCATE_ACCEPTED_MATERIAL",
  "RESOLVE_NCR",
  "EXPEDITE_LATE_COMMITMENT",
] as const;
export type RecommendedActionCode = (typeof RECOMMENDED_ACTION_CODES)[number];

export interface ReadinessLineInput {
  acceptedQuantity: string;
  allocatedQuantity: string;
  blockerReason: MaterialRequirementBlocker | null;
  bomLineId: string;
  certificateCompleteQuantity: string;
  certificateRequired: boolean;
  criticality: keyof typeof CRITICALITY_WEIGHTS;
  currentStage: MaterialRequirementStage;
  itemCode: string;
  lineNumber: number;
  openNcrCount: number;
  operativeCommitmentDate: string | null;
  requiredDate: string;
  requiredQuantity: string;
  shortage: string;
  workPackageId: string | null;
}

export interface ReadinessCalculationInput {
  calculationDate: string;
  lines: readonly ReadinessLineInput[];
  scopeId: string;
  scopeType: "PROJECT" | "WORK_PACKAGE";
  unresolvedProjectNcrCount: number;
}

export interface ReadinessBlocker {
  bomLineId: string | null;
  code: string;
  explanation: string;
}

export interface RecommendedAction {
  bomLineId: string | null;
  code: RecommendedActionCode;
  action: string;
}

export interface ReadinessLineExplanation {
  blockerCodes: string[];
  bomLineId: string;
  criticality: keyof typeof CRITICALITY_WEIGHTS;
  currentStage: MaterialRequirementStage;
  itemCode: string;
  lineNumber: number;
  reasonCodes: ReadinessReasonCode[];
  stageScore: number;
  weightedPoints: number;
}

export interface ReadinessCalculation {
  blockerCount: number;
  blockers: ReadinessBlocker[];
  calculationDate: string;
  calculatorVersion: string;
  criticalLineCount: number;
  explanation: string;
  lineCount: number;
  lineExplanations: ReadinessLineExplanation[];
  readyCriticalLineCount: number;
  reasonCodes: ReadinessReasonCode[];
  recommendedActions: RecommendedAction[];
  ruleVersion: string;
  score: number;
  status: ReadinessStatus;
}

const actionByBlocker: Record<
  MaterialRequirementBlocker,
  { code: RecommendedActionCode; action: string }
> = {
  ACCEPTANCE_SHORTFALL: {
    code: "COMPLETE_INSPECTION",
    action: "Complete quality disposition for the remaining received quantity.",
  },
  ALLOCATION_SHORTFALL: {
    code: "ALLOCATE_ACCEPTED_MATERIAL",
    action:
      "Allocate accepted, certificate-complete material to the requirement.",
  },
  CERTIFICATE_INCOMPLETE: {
    code: "COMPLETE_CERTIFICATE_REVIEW",
    action: "Obtain and approve the required certificate evidence.",
  },
  INSPECTION_PENDING: {
    code: "COMPLETE_INSPECTION",
    action: "Complete the receiving inspection and disposition.",
  },
  ORDER_SHORTFALL: {
    code: "PLACE_ORDER",
    action: "Place purchase orders for the uncovered requirement quantity.",
  },
  QUARANTINED_MATERIAL: {
    code: "RESOLVE_QUARANTINE",
    action: "Resolve quarantined material or secure replacement supply.",
  },
  RECEIPT_SHORTFALL: {
    code: "RECEIVE_MATERIAL",
    action: "Receive the outstanding dispatched or ordered quantity.",
  },
  REJECTED_MATERIAL: {
    code: "REPLACE_REJECTED_MATERIAL",
    action: "Replace rejected material and close the quality disposition.",
  },
  REQUISITION_SHORTFALL: {
    code: "RAISE_REQUISITION",
    action:
      "Create or approve requisitions for the uncovered requirement quantity.",
  },
  SHIPMENT_SHORTFALL: {
    code: "EXPEDITE_SHIPMENT",
    action: "Expedite shipment of the outstanding confirmed quantity.",
  },
  SUPPLIER_CONFIRMATION_MISSING: {
    code: "OBTAIN_SUPPLIER_CONFIRMATION",
    action: "Obtain a current supplier commitment for the ordered quantity.",
  },
};

function dateOnly(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Invalid readiness date");
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  )
    throw new Error("Invalid readiness date");
  return value;
}

function quantity(value: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match || (match[2]?.length ?? 0) > 6)
    throw new Error("Invalid readiness quantity");
  return (
    BigInt(match[1]!) * 1_000_000n +
    BigInt((match[2] ?? "").padEnd(6, "0") || "0")
  );
}

function daysBetween(from: string, to: string): number {
  return Math.trunc(
    (new Date(`${to}T00:00:00.000Z`).valueOf() -
      new Date(`${from}T00:00:00.000Z`).valueOf()) /
      86_400_000,
  );
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

function lineBlockerExplanation(line: ReadinessLineInput): string {
  return `${line.itemCode} line ${line.lineNumber}: ${line.blockerReason!.toLowerCase().replaceAll("_", " ")}.`;
}

export function calculateReadiness(
  input: ReadinessCalculationInput,
): ReadinessCalculation {
  const calculationDate = dateOnly(input.calculationDate);
  if (
    !Number.isInteger(input.unresolvedProjectNcrCount) ||
    input.unresolvedProjectNcrCount < 0
  )
    throw new Error("Invalid project NCR count");

  const lines = [...input.lines].sort((left, right) =>
    left.bomLineId.localeCompare(right.bomLineId),
  );
  if (new Set(lines.map(({ bomLineId }) => bomLineId)).size !== lines.length)
    throw new Error("Duplicate readiness line");

  if (lines.length === 0) {
    return {
      blockerCount: 1,
      blockers: [
        {
          bomLineId: null,
          code: "NO_RELEASED_REQUIREMENTS",
          explanation:
            "The scope has no current released material requirements.",
        },
      ],
      calculationDate,
      calculatorVersion: READINESS_CALCULATOR_VERSION,
      criticalLineCount: 0,
      explanation:
        "No current released material requirements are available for readiness calculation.",
      lineCount: 0,
      lineExplanations: [],
      readyCriticalLineCount: 0,
      reasonCodes: ["NO_RELEASED_REQUIREMENTS"],
      recommendedActions: [
        {
          bomLineId: null,
          code: "RELEASE_REQUIREMENT",
          action:
            "Release the current approved BOM revision before relying on readiness.",
        },
      ],
      ruleVersion: READINESS_RULE_VERSION,
      score: 0,
      status: "RED",
    };
  }

  const blockers: ReadinessBlocker[] = [];
  const actions: RecommendedAction[] = [];
  const reasons: ReadinessReasonCode[] = [];
  const lineExplanations: ReadinessLineExplanation[] = [];
  let weightedPoints = 0;
  let totalWeight = 0;
  let readyCriticalLineCount = 0;
  let redGate = false;
  let onlyFutureLowPriorityShortage = true;

  if (input.unresolvedProjectNcrCount > 0) {
    reasons.push("OPEN_NCR");
    blockers.push({
      bomLineId: null,
      code: "OPEN_NCR",
      explanation: `${input.unresolvedProjectNcrCount} unresolved project-level NCR(s) remain open.`,
    });
    actions.push({
      bomLineId: null,
      code: "RESOLVE_NCR",
      action: "Resolve the open project-level NCRs and recalculate readiness.",
    });
    onlyFutureLowPriorityShortage = false;
  }

  for (const line of lines) {
    dateOnly(line.requiredDate);
    if (line.operativeCommitmentDate) dateOnly(line.operativeCommitmentDate);
    if (!Number.isInteger(line.openNcrCount) || line.openNcrCount < 0)
      throw new Error("Invalid line NCR count");
    const required = quantity(line.requiredQuantity);
    const accepted = quantity(line.acceptedQuantity);
    const allocated = quantity(line.allocatedQuantity);
    const certificateComplete = quantity(line.certificateCompleteQuantity);
    const shortage = quantity(line.shortage);
    const expectedShortage = required > allocated ? required - allocated : 0n;
    if (
      required <= 0n ||
      certificateComplete > accepted ||
      shortage !== expectedShortage
    )
      throw new Error("Invalid readiness line quantities");

    const weight = CRITICALITY_WEIGHTS[line.criticality];
    const stageScore = STAGE_SCORES[line.currentStage];
    weightedPoints += stageScore * weight;
    totalWeight += weight;
    const lineReasons: ReadinessReasonCode[] = [];
    const lineBlockers: string[] = [];
    const complete = line.currentStage === "COMPLETE" && shortage === 0n;
    if (line.criticality === "CRITICAL" && complete)
      readyCriticalLineCount += 1;

    if (line.blockerReason) {
      lineBlockers.push(line.blockerReason);
      blockers.push({
        bomLineId: line.bomLineId,
        code: line.blockerReason,
        explanation: lineBlockerExplanation(line),
      });
      const action = actionByBlocker[line.blockerReason];
      actions.push({ bomLineId: line.bomLineId, ...action });
    }
    if (accepted > 0n && accepted < required) {
      lineReasons.push("PARTIAL_ACCEPTANCE");
      reasons.push("PARTIAL_ACCEPTANCE");
    }
    if (line.openNcrCount > 0) {
      const code =
        line.criticality === "CRITICAL" ? "CRITICAL_OPEN_NCR" : "OPEN_NCR";
      lineReasons.push(code);
      reasons.push(code);
      lineBlockers.push("OPEN_NCR");
      blockers.push({
        bomLineId: line.bomLineId,
        code: "OPEN_NCR",
        explanation: `${line.itemCode} has ${line.openNcrCount} unresolved NCR(s).`,
      });
      actions.push({
        bomLineId: line.bomLineId,
        code: "RESOLVE_NCR",
        action:
          "Resolve the NCR and verify the resulting material disposition.",
      });
      if (line.criticality === "CRITICAL") redGate = true;
      onlyFutureLowPriorityShortage = false;
    }
    if (
      line.operativeCommitmentDate &&
      line.operativeCommitmentDate > line.requiredDate
    ) {
      const code =
        line.criticality === "CRITICAL"
          ? "CRITICAL_LATE_COMMITMENT"
          : "LATE_COMMITMENT";
      lineReasons.push(code);
      reasons.push(code);
      lineBlockers.push("LATE_COMMITMENT");
      blockers.push({
        bomLineId: line.bomLineId,
        code: "LATE_COMMITMENT",
        explanation: `${line.itemCode} is committed for ${line.operativeCommitmentDate}, after its ${line.requiredDate} required date.`,
      });
      actions.push({
        bomLineId: line.bomLineId,
        code: "EXPEDITE_LATE_COMMITMENT",
        action:
          "Negotiate and retain an earlier supplier commitment or approved recovery plan.",
      });
      if (line.criticality === "CRITICAL") redGate = true;
      onlyFutureLowPriorityShortage = false;
    }
    if (
      line.criticality === "CRITICAL" &&
      line.blockerReason === "REJECTED_MATERIAL"
    ) {
      lineReasons.push("CRITICAL_REJECTED_MATERIAL");
      reasons.push("CRITICAL_REJECTED_MATERIAL");
      redGate = true;
    }
    if (
      line.criticality === "CRITICAL" &&
      line.blockerReason === "QUARANTINED_MATERIAL"
    ) {
      lineReasons.push("CRITICAL_QUARANTINED_MATERIAL");
      reasons.push("CRITICAL_QUARANTINED_MATERIAL");
      redGate = true;
    }
    if (
      line.criticality === "CRITICAL" &&
      line.certificateRequired &&
      certificateComplete < required
    ) {
      lineReasons.push("CRITICAL_CERTIFICATE_MISSING");
      reasons.push("CRITICAL_CERTIFICATE_MISSING");
      redGate = true;
      if (!lineBlockers.includes("CERTIFICATE_INCOMPLETE")) {
        lineBlockers.push("CERTIFICATE_INCOMPLETE");
        blockers.push({
          bomLineId: line.bomLineId,
          code: "CERTIFICATE_INCOMPLETE",
          explanation: `${line.itemCode} is critical and lacks complete approved certificate evidence.`,
        });
        actions.push({
          bomLineId: line.bomLineId,
          code: "COMPLETE_CERTIFICATE_REVIEW",
          action:
            "Obtain, approve, and link the required certificate evidence.",
        });
      }
    }
    if (shortage > 0n) {
      const dueInDays = daysBetween(calculationDate, line.requiredDate);
      if (line.criticality === "CRITICAL" && dueInDays <= 0) {
        lineReasons.push("CRITICAL_SHORTAGE_DUE");
        reasons.push("CRITICAL_SHORTAGE_DUE");
        redGate = true;
      } else if (dueInDays <= 30) {
        lineReasons.push("SHORTAGE_DUE_SOON");
        reasons.push("SHORTAGE_DUE_SOON");
      } else if (line.criticality === "LOW") {
        lineReasons.push("FUTURE_LOW_PRIORITY_SHORTAGE");
        reasons.push("FUTURE_LOW_PRIORITY_SHORTAGE");
      } else {
        onlyFutureLowPriorityShortage = false;
      }
      if (!(line.criticality === "LOW" && dueInDays > 30))
        onlyFutureLowPriorityShortage = false;
    } else if (!complete) {
      onlyFutureLowPriorityShortage = false;
    }

    lineExplanations.push({
      blockerCodes: unique(lineBlockers),
      bomLineId: line.bomLineId,
      criticality: line.criticality,
      currentStage: line.currentStage,
      itemCode: line.itemCode,
      lineNumber: line.lineNumber,
      reasonCodes: unique(lineReasons),
      stageScore,
      weightedPoints: stageScore * weight,
    });
  }

  const score = Math.round((weightedPoints / totalWeight) * 100) / 100;
  const allComplete =
    lines.every(
      (line) =>
        line.currentStage === "COMPLETE" &&
        quantity(line.shortage) === 0n &&
        line.blockerReason === null &&
        line.openNcrCount === 0 &&
        (!line.operativeCommitmentDate ||
          line.operativeCommitmentDate <= line.requiredDate),
    ) && input.unresolvedProjectNcrCount === 0;
  let status: ReadinessStatus;
  if (allComplete) status = "COMPLETE";
  else if (redGate || score < 60) {
    status = "RED";
    if (!redGate) reasons.push("WEIGHTED_SCORE_RED");
  } else if (onlyFutureLowPriorityShortage && score >= 85) status = "GREEN";
  else if (score < 85 || blockers.length > 0) {
    status = "AMBER";
    if (score < 85) reasons.push("WEIGHTED_SCORE_AMBER");
  } else status = "GREEN";

  const uniqueReasons = unique(reasons);
  const uniqueActions = actions.filter(
    (action, index) =>
      actions.findIndex(
        (candidate) =>
          candidate.bomLineId === action.bomLineId &&
          candidate.code === action.code,
      ) === index,
  );
  return {
    blockerCount: blockers.length,
    blockers,
    calculationDate,
    calculatorVersion: READINESS_CALCULATOR_VERSION,
    criticalLineCount: lines.filter(
      ({ criticality }) => criticality === "CRITICAL",
    ).length,
    explanation: `${status} readiness at ${score.toFixed(2)}%; ${blockers.length} blocker(s), ${uniqueReasons.length} risk reason(s).`,
    lineCount: lines.length,
    lineExplanations,
    readyCriticalLineCount,
    reasonCodes: uniqueReasons,
    recommendedActions: uniqueActions,
    ruleVersion: READINESS_RULE_VERSION,
    score,
    status,
  };
}
