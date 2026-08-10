import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export interface Ncr {
  id: string;
  number: string;
  title: string;
  description: string;
  internalDispositionNotes: string;
  shareInternalNotes: boolean;
  sourceType: "PROJECT" | "INVENTORY_LOT" | "RECEIVING_INSPECTION";
  status: "DRAFT" | "ISSUED" | "SUPPLIER_RESPONDED" | "CLOSED" | "CANCELLED";
  supplierOrganization: { code: string; id: string; name: string };
  supplierResponses: Array<{
    correctiveAction: string;
    createdAt: string;
    id: string;
    message: string;
    revisionNumber: number;
    rootCause: string;
    submittedBy: { displayName: string; id: string };
  }>;
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    occurredAt: string;
    reason: string;
    sourceStatus: string;
    targetStatus: string;
  }>;
  version: number;
}

export interface MaterialAllocation {
  id: string;
  status: "ALLOCATED" | "RELEASED" | "CONSUMED";
  quantity: string;
  version: number;
  conditionalUseReason: string | null;
  conditionalUseAuthorizedBy: null | { displayName: string; id: string };
  inventoryLot: {
    availableQuantity: string;
    id: string;
    item: { code: string; id: string; name: string };
    lotNumber: number;
    status: string;
    unitOfMeasure: { symbol: string };
  };
  bomLine: {
    id: string;
    lineNumber: number;
    bomRevision: {
      revisionNumber: number;
      bom: { workPackage: null | { code: string; name: string } };
    };
  };
  transitions: Array<{
    id: string;
    quantitySnapshot: string;
    reason: string;
    sourceStatus: string;
    targetStatus: string;
  }>;
}

export interface AllocationOptions {
  inventoryLots: Array<{
    acceptedQuantity: string;
    availableQuantity: string;
    id: string;
    item: { code: string; id: string; name: string };
    lotNumber: number;
    status: "ACCEPTED" | "CONDITIONALLY_ACCEPTED";
    unitOfMeasure: { id: string; symbol: string };
  }>;
  bomLines: Array<{
    id: string;
    item: { code: string; id: string; name: string };
    lineNumber: number;
    quantity: string;
    unitOfMeasure: { id: string; symbol: string };
    bomRevision: {
      revisionNumber: number;
      bom: { workPackage: null | { code: string; name: string } };
    };
  }>;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Quality and allocation data is unavailable");
  return (await result.json()) as T;
}

export const ncrList = (projectId: string) =>
  response<{ data: Ncr[] }>(`/api/v1/projects/${projectId}/ncrs`).then(
    ({ data }) => data,
  );

export const ncrDetail = (id: string) => response<Ncr>(`/api/v1/ncrs/${id}`);

export const allocationList = (projectId: string) =>
  response<{ data: MaterialAllocation[] }>(
    `/api/v1/projects/${projectId}/material-allocations`,
  ).then(({ data }) => data);

export const allocationOptions = (projectId: string) =>
  response<AllocationOptions>(
    `/api/v1/projects/${projectId}/material-allocation-options`,
  );
