export type BomRevisionStatus =
  "DRAFT" | "IN_REVIEW" | "RELEASED" | "SUPERSEDED" | "CANCELLED";

const transitions: Record<BomRevisionStatus, readonly BomRevisionStatus[]> = {
  CANCELLED: [],
  DRAFT: ["IN_REVIEW", "CANCELLED"],
  IN_REVIEW: ["RELEASED", "CANCELLED"],
  RELEASED: ["SUPERSEDED"],
  SUPERSEDED: [],
};

export function canTransitionBom(
  source: BomRevisionStatus,
  target: BomRevisionStatus,
): boolean {
  return transitions[source].includes(target);
}

export function canReleaseBom(input: {
  lineCount: number;
  projectState: string;
  status: BomRevisionStatus;
}): boolean {
  return (
    input.status === "IN_REVIEW" &&
    input.lineCount > 0 &&
    !["COMPLETED", "CANCELLED"].includes(input.projectState)
  );
}
