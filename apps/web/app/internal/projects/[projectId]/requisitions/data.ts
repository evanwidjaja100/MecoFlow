import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export type RequisitionStatus =
  "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface RequisitionRequirement {
  bomLineId: string;
  bomRevision: { id: string; revisionNumber: number; title: string };
  coveredQuantity: string;
  item: { code: string; id: string; name: string };
  lineNumber: number;
  outstandingQuantity: string;
  requiredQuantity: string;
  unitOfMeasure: {
    code: string;
    id: string;
    name: string;
    symbol: string;
  };
  workPackage: { code: string; id: string; name: string } | null;
}

export interface RequisitionSummary {
  _count: { lines: number };
  approver: { displayName: string; id: string } | null;
  id: string;
  requisitionNumber: number;
  requester: { displayName: string; id: string };
  status: RequisitionStatus;
  title: string;
  updatedAt: string;
  version: number;
}

export interface RequisitionDetail extends RequisitionSummary {
  approvedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  notes: string;
  project: {
    code: string;
    id: string;
    name: string;
    state: string;
  };
  rejectedAt: string | null;
  submittedAt: string | null;
  lines: Array<{
    bomLine: {
      bomRevision: {
        bom: {
          workPackage: { code: string; id: string; name: string } | null;
        };
        id: string;
        revisionNumber: number;
        title: string;
      };
      item: { code: string; id: string; name: string };
      lineNumber: number;
      quantity: string;
      unitOfMeasure: { code: string; id: string; name: string; symbol: string };
    };
    coveredQuantity: string;
    coveredQuantitySnapshot: string;
    id: string;
    lineNumber: number;
    outstandingQuantity: string;
    outstandingQuantitySnapshot: string;
    overNeedOverride: boolean;
    overrideAuthorizedBy: { displayName: string; id: string } | null;
    overrideReason: string | null;
    quantity: string;
    requiredQuantitySnapshot: string;
  }>;
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    occurredAt: string;
    reason: string;
    sourceStatus: RequisitionStatus;
    targetStatus: RequisitionStatus;
  }>;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Purchase requisition data is unavailable");
  return (await result.json()) as T;
}

export async function requisitionWorkspace(projectId: string) {
  const [requirements, requisitions] = await Promise.all([
    response<{ data: RequisitionRequirement[] }>(
      `/api/v1/projects/${projectId}/requisition-requirements`,
    ),
    response<{ data: RequisitionSummary[] }>(
      `/api/v1/projects/${projectId}/requisitions`,
    ),
  ]);
  return { requirements: requirements.data, requisitions: requisitions.data };
}

export const requisitionDetail = (id: string) =>
  response<RequisitionDetail>(`/api/v1/purchase-requisitions/${id}`);
