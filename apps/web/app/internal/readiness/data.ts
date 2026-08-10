import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface ReadinessBlocker {
  bomLineId: string | null;
  code: string;
  explanation: string;
}

export interface ReadinessAction {
  bomLineId: string | null;
  code: string;
  action: string;
}

export interface ReadinessSnapshot {
  batchId: string;
  blockerCount: number;
  blockers: ReadinessBlocker[];
  calculatedAt: string;
  calculationDate: string;
  calculatorVersion: string;
  criticalLineCount: number;
  explanation: string;
  id: string;
  inputHash: string;
  lineCount: number;
  materialProjectionVersion: string;
  project: { code: string; id: string; name: string };
  readyCriticalLineCount: number;
  reasonCodes: string[];
  recommendedActions: ReadinessAction[];
  ruleVersion: string;
  scopeType: "PROJECT" | "WORK_PACKAGE";
  score: number;
  status: "RED" | "AMBER" | "GREEN" | "COMPLETE";
  trigger: "EVENT" | "SCHEDULED";
  workPackage: null | { code: string; id: string; name: string };
}

export interface ReadinessMaterialLine {
  acceptedQuantity: string;
  allocatedQuantity: string;
  blockerReason: string | null;
  bomLineId: string;
  certificateCompleteQuantity: string;
  certificateRequired: boolean;
  confirmedQuantity: string;
  criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
  currentStage: string;
  itemCode: string;
  itemName: string;
  lineNumber: number;
  openNcrCount: number;
  operativeCommitmentDate: string | null;
  orderedQuantity: string;
  receivedQuantity: string;
  requiredDate: string;
  requiredQuantity: string;
  requisitionedQuantity: string;
  shippedQuantity: string;
  shortage: string;
  unitCode: string;
  unitSymbol: string;
  workPackageCode: string | null;
  workPackageId: string | null;
  workPackageName: string | null;
}

export interface ReadinessLineExplanation {
  blockerCodes: string[];
  bomLineId: string;
  criticality: string;
  currentStage: string;
  itemCode: string;
  lineNumber: number;
  reasonCodes: string[];
  stageScore: number;
  weightedPoints: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Readiness data is unavailable");
  return (await result.json()) as T;
}

export const managementReadiness = (query: URLSearchParams) =>
  response<{
    data: ReadinessSnapshot[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/v1/readiness/management?${query.toString()}`);

export const projectReadiness = (projectId: string) =>
  response<{
    latest: ReadinessSnapshot | null;
    workPackages: ReadinessSnapshot[];
  }>(`/api/v1/projects/${projectId}/readiness`);

export const materialReadiness = (projectId: string) =>
  response<{
    latest: ReadinessSnapshot | null;
    lineExplanations: ReadinessLineExplanation[];
    lines: ReadinessMaterialLine[];
  }>(`/api/v1/projects/${projectId}/readiness/materials`);

export const readinessHistory = (projectId: string) =>
  response<{ data: ReadinessSnapshot[] }>(
    `/api/v1/projects/${projectId}/readiness/history`,
  ).then(({ data }) => data);
