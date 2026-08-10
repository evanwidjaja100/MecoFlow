export type MaterialAllocationStatus = "ALLOCATED" | "CONSUMED" | "RELEASED";

export function canTransitionAllocation(
  source: MaterialAllocationStatus,
  target: MaterialAllocationStatus,
) {
  return source === "ALLOCATED" && ["CONSUMED", "RELEASED"].includes(target);
}
