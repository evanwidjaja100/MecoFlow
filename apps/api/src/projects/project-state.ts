export const projectStates = [
  "DRAFT",
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProjectState = (typeof projectStates)[number];

const transitions: Readonly<Record<ProjectState, readonly ProjectState[]>> = {
  ACTIVE: ["ON_HOLD", "COMPLETED", "CANCELLED"],
  CANCELLED: [],
  COMPLETED: [],
  DRAFT: ["PLANNED", "CANCELLED"],
  ON_HOLD: ["ACTIVE", "CANCELLED"],
  PLANNED: ["ACTIVE", "ON_HOLD", "CANCELLED"],
};

export function allowedProjectTransitions(
  state: ProjectState,
): readonly ProjectState[] {
  return transitions[state];
}

export function canTransitionProject(
  source: ProjectState,
  target: ProjectState,
): boolean {
  return transitions[source].includes(target);
}

export function datesAreOrdered(startDate: Date, endDate: Date): boolean {
  return startDate.getTime() <= endDate.getTime();
}
