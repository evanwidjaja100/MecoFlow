import { describe, expect, it } from "vitest";
import {
  calculateReadiness,
  CRITICALITY_WEIGHTS,
  READINESS_CALCULATOR_VERSION,
  READINESS_RULE_VERSION,
  STAGE_SCORES,
  type ReadinessLineInput,
} from "./readiness-calculator.js";
import { MATERIAL_REQUIREMENT_STAGES } from "./material-requirement-status.js";

function line(overrides: Partial<ReadinessLineInput> = {}): ReadinessLineInput {
  return {
    acceptedQuantity: "10",
    allocatedQuantity: "10",
    blockerReason: null,
    bomLineId: "line-1",
    certificateCompleteQuantity: "10",
    certificateRequired: false,
    criticality: "NORMAL",
    currentStage: "COMPLETE",
    itemCode: "ITEM-1",
    lineNumber: 1,
    openNcrCount: 0,
    operativeCommitmentDate: "2026-08-01",
    requiredDate: "2026-08-01",
    requiredQuantity: "10",
    shortage: "0",
    workPackageId: null,
    ...overrides,
  };
}

function calculate(lines: ReadinessLineInput[], unresolvedProjectNcrCount = 0) {
  return calculateReadiness({
    calculationDate: "2026-07-22",
    lines,
    scopeId: "project-1",
    scopeType: "PROJECT",
    unresolvedProjectNcrCount,
  });
}

describe("readiness calculator", () => {
  it("is versioned and maps every material stage to its documented score", () => {
    for (const [index, stage] of MATERIAL_REQUIREMENT_STAGES.entries()) {
      const result = calculate([
        line({
          allocatedQuantity: stage === "COMPLETE" ? "10" : "0",
          bomLineId: `line-${index}`,
          certificateCompleteQuantity: stage === "COMPLETE" ? "10" : "0",
          currentStage: stage,
          shortage: stage === "COMPLETE" ? "0" : "10",
        }),
      ]);
      expect(result.lineExplanations[0]?.stageScore).toBe(STAGE_SCORES[stage]);
      expect(result.score).toBe(STAGE_SCORES[stage]);
      expect(result.calculatorVersion).toBe(READINESS_CALCULATOR_VERSION);
      expect(result.ruleVersion).toBe(READINESS_RULE_VERSION);
    }
  });

  it("applies all documented criticality weights", () => {
    expect(CRITICALITY_WEIGHTS).toEqual({
      CRITICAL: 8,
      HIGH: 4,
      LOW: 1,
      NORMAL: 2,
    });
    const result = calculate([
      line({ bomLineId: "critical", criticality: "CRITICAL" }),
      line({
        allocatedQuantity: "0",
        bomLineId: "low",
        certificateCompleteQuantity: "0",
        criticality: "LOW",
        currentStage: "NOT_STARTED",
        requiredDate: "2027-01-01",
        shortage: "10",
      }),
    ]);
    expect(result.score).toBe(88.89);
  });

  it("keeps an approximately 99 percent score RED when a critical item is rejected", () => {
    const ready = Array.from({ length: 92 }, (_, index) =>
      line({
        bomLineId: `ready-${index}`,
        criticality: "LOW",
        lineNumber: index + 2,
      }),
    );
    const result = calculate([
      line({
        blockerReason: "REJECTED_MATERIAL",
        bomLineId: "critical-rejected",
        criticality: "CRITICAL",
        currentStage: "ALLOCATED",
      }),
      ...ready,
    ]);
    expect(result.score).toBeGreaterThan(99);
    expect(result.status).toBe("RED");
    expect(result.reasonCodes).toContain("CRITICAL_REJECTED_MATERIAL");
  });

  it("blocks a certificate-required critical line with missing evidence", () => {
    const result = calculate([
      line({
        blockerReason: "CERTIFICATE_INCOMPLETE",
        bomLineId: "critical-certificate",
        certificateCompleteQuantity: "0",
        certificateRequired: true,
        criticality: "CRITICAL",
        currentStage: "ALLOCATED",
      }),
    ]);
    expect(result.status).toBe("RED");
    expect(result.reasonCodes).toContain("CRITICAL_CERTIFICATE_MISSING");
    expect(result.recommendedActions.map(({ code }) => code)).toContain(
      "COMPLETE_CERTIFICATE_REVIEW",
    );
  });

  it("explains partial accepted quantity and preserves allocation shortage", () => {
    const result = calculate([
      line({
        acceptedQuantity: "4",
        allocatedQuantity: "4",
        blockerReason: "ACCEPTANCE_SHORTFALL",
        certificateCompleteQuantity: "4",
        currentStage: "ALLOCATED",
        shortage: "6",
      }),
    ]);
    expect(result.reasonCodes).toContain("PARTIAL_ACCEPTANCE");
    expect(result.blockers.map(({ code }) => code)).toContain(
      "ACCEPTANCE_SHORTFALL",
    );
  });

  it("creates deterministic risk when commitment is after the required date", () => {
    const result = calculate([
      line({
        operativeCommitmentDate: "2026-08-02",
        requiredDate: "2026-08-01",
      }),
    ]);
    expect(result.reasonCodes).toContain("LATE_COMMITMENT");
    expect(result.recommendedActions.map(({ code }) => code)).toContain(
      "EXPEDITE_LATE_COMMITMENT",
    );
  });

  it("removes the configured NCR blocker once the NCR is resolved", () => {
    const open = calculate([line({ openNcrCount: 1 })]);
    const resolved = calculate([line({ openNcrCount: 0 })]);
    expect(open.status).toBe("AMBER");
    expect(open.reasonCodes).toContain("OPEN_NCR");
    expect(resolved.status).toBe("COMPLETE");
    expect(resolved.reasonCodes).not.toContain("OPEN_NCR");
  });

  it("uses the documented 30-day rule for a future low-priority shortage", () => {
    const future = calculate([
      line({ criticality: "CRITICAL" }),
      line({
        allocatedQuantity: "0",
        blockerReason: "REQUISITION_SHORTFALL",
        bomLineId: "future-low",
        certificateCompleteQuantity: "0",
        criticality: "LOW",
        currentStage: "NOT_STARTED",
        requiredDate: "2026-09-01",
        shortage: "10",
      }),
    ]);
    const near = calculate([
      line({ criticality: "CRITICAL" }),
      line({
        allocatedQuantity: "0",
        blockerReason: "REQUISITION_SHORTFALL",
        bomLineId: "near-low",
        certificateCompleteQuantity: "0",
        criticality: "LOW",
        currentStage: "NOT_STARTED",
        requiredDate: "2026-08-01",
        shortage: "10",
      }),
    ]);
    expect(future.status).toBe("GREEN");
    expect(future.reasonCodes).toContain("FUTURE_LOW_PRIORITY_SHORTAGE");
    expect(near.status).toBe("AMBER");
    expect(near.reasonCodes).toContain("SHORTAGE_DUE_SOON");
  });

  it("applies critical rejected, quarantined, certificate, NCR, late, and due-shortage gates", () => {
    const scenarios: Array<[Partial<ReadinessLineInput>, string]> = [
      [{ blockerReason: "REJECTED_MATERIAL" }, "CRITICAL_REJECTED_MATERIAL"],
      [
        { blockerReason: "QUARANTINED_MATERIAL" },
        "CRITICAL_QUARANTINED_MATERIAL",
      ],
      [
        {
          blockerReason: "CERTIFICATE_INCOMPLETE",
          certificateCompleteQuantity: "0",
          certificateRequired: true,
        },
        "CRITICAL_CERTIFICATE_MISSING",
      ],
      [{ openNcrCount: 1 }, "CRITICAL_OPEN_NCR"],
      [{ operativeCommitmentDate: "2026-08-02" }, "CRITICAL_LATE_COMMITMENT"],
      [
        {
          allocatedQuantity: "0",
          blockerReason: "ALLOCATION_SHORTFALL",
          requiredDate: "2026-07-22",
          shortage: "10",
        },
        "CRITICAL_SHORTAGE_DUE",
      ],
    ];
    for (const [overrides, reason] of scenarios) {
      const result = calculate([
        line({ criticality: "CRITICAL", ...overrides }),
      ]);
      expect(result.status).toBe("RED");
      expect(result.reasonCodes).toContain(reason);
    }
  });

  it("is deterministic and fails closed on invalid or inconsistent inputs", () => {
    const input = [line({ bomLineId: "stable" })];
    expect(calculate(input)).toEqual(calculate(input));
    expect(() => calculate([line({ shortage: "1" })])).toThrow(
      "Invalid readiness line quantities",
    );
    expect(() => calculate([line(), line()])).toThrow(
      "Duplicate readiness line",
    );
  });
});
