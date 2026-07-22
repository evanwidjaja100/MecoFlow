import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export type PurchaseOrderStatus =
  "DRAFT" | "SENT" | "ACKNOWLEDGED" | "CANCELLED";

export interface PurchaseOrderRequirement {
  approvedQuantity: string;
  availableQuantity: string;
  item: { code: string; id: string; name: string };
  orderedQuantity: string;
  purchaseRequisition: { id: string; requisitionNumber: number; title: string };
  purchaseRequisitionLineId: string;
  requiredDate: string;
  unitOfMeasure: {
    code: string;
    decimalPrecision: number;
    id: string;
    name: string;
    symbol: string;
  };
}

export interface PurchaseOrderSummary {
  _count: { revisions: number };
  currentRevisionNumber: number;
  id: string;
  purchaseOrderNumber: number;
  revisions: Array<{ revisionNumber: number; title: string }>;
  status: PurchaseOrderStatus;
  supplierOrganization: { code: string; id: string; name: string };
  updatedAt: string;
  version: number;
}

export interface PurchaseOrderException {
  item: { code: string; id: string; name: string };
  latestCommitmentDate: string;
  originalCommitmentDate: string;
  purchaseOrderId: string;
  purchaseOrderLineId: string;
  purchaseOrderNumber: number;
  requiredDate: string;
  revisionNumber: number;
  supplierOrganization: { code: string; id: string; name: string };
  title: string;
}

export interface PurchaseOrderDetail extends PurchaseOrderSummary {
  acknowledgedAt: string | null;
  cancelledAt: string | null;
  createdBy: { displayName: string; id: string };
  currentRevision: PurchaseOrderRevision;
  project: { code: string; id: string; name: string; state: string };
  revisions: PurchaseOrderRevision[];
  sentAt: string | null;
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    reason: string;
    sourceStatus: PurchaseOrderStatus;
    targetStatus: PurchaseOrderStatus;
  }>;
}

export interface PurchaseOrderRevision {
  commitments: Array<{
    createdAt: string;
    id: string;
    note: string;
    revisionNumber: number;
  }>;
  createdAt: string;
  current: boolean;
  id: string;
  internalCommercialTerms: string;
  internalNotes: string;
  lines: Array<{
    allocations: Array<{
      approvedQuantitySnapshot: string;
      availableQuantitySnapshot: string;
      overOrderOverride: boolean;
      overrideAuthorizedBy: { displayName: string; id: string } | null;
      overrideReason: string | null;
      purchaseRequisitionLine: {
        purchaseRequisition: {
          id: string;
          requisitionNumber: number;
          title: string;
        };
      };
      quantity: string;
      requiredDateSnapshot: string;
    }>;
    id: string;
    internalLineNotes: string;
    internalUnitPrice: string | null;
    isLate: boolean;
    item: { code: string; id: string; name: string };
    latestCommitmentDate: string | null;
    lineNumber: number;
    orderedQuantity: string;
    originalCommitmentDate: string | null;
    requiredDate: string;
    unitOfMeasure: { code: string; id: string; name: string; symbol: string };
  }>;
  revisionNumber: number;
  revisionReason: string;
  sentAt: string | null;
  supplierMessage: string;
  title: string;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Purchase order data is unavailable");
  return (await result.json()) as T;
}

export async function purchaseOrderWorkspace(
  projectId: string,
  includeExceptions: boolean,
) {
  const [requirements, purchaseOrders, exceptions] = await Promise.all([
    response<{ data: PurchaseOrderRequirement[] }>(
      `/api/v1/projects/${projectId}/purchase-order-requirements`,
    ),
    response<{ data: PurchaseOrderSummary[] }>(
      `/api/v1/projects/${projectId}/purchase-orders`,
    ),
    includeExceptions
      ? response<{ data: PurchaseOrderException[] }>(
          `/api/v1/projects/${projectId}/purchase-order-exceptions`,
        )
      : Promise.resolve({ data: [] }),
  ]);
  return {
    exceptions: exceptions.data,
    purchaseOrders: purchaseOrders.data,
    requirements: requirements.data,
  };
}

export const purchaseOrderDetail = (id: string) =>
  response<PurchaseOrderDetail>(`/api/v1/purchase-orders/${id}`);
