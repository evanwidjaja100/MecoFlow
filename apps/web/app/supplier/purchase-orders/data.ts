import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface SupplierPurchaseOrder {
  acknowledgedAt: string | null;
  id: string;
  project: { code: string; id: string; name: string; state: string };
  purchaseOrderNumber: number;
  revision: {
    commitments: Array<{
      createdAt: string;
      id: string;
      lines: Array<{ committedDate: string; purchaseOrderLineId: string }>;
      note: string;
      revisionNumber: number;
    }>;
    id: string;
    lines: Array<{
      id: string;
      item: { code: string; id: string; name: string };
      latestCommitmentDate: string | null;
      lineNumber: number;
      orderedQuantity: string;
      originalCommitmentDate: string | null;
      requiredDate: string;
      unitOfMeasure: { code: string; id: string; name: string; symbol: string };
    }>;
    revisionNumber: number;
    sentAt: string;
    supplierMessage: string;
    title: string;
  };
  sentAt: string;
  status: "SENT" | "ACKNOWLEDGED";
  supplierOrganization: { code: string; id: string; name: string };
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok)
    throw new Error("Supplier purchase order data is unavailable");
  return (await result.json()) as T;
}

export const supplierPurchaseOrders = () =>
  response<{ data: SupplierPurchaseOrder[] }>(
    "/api/v1/supplier/purchase-orders",
  ).then(({ data }) => data);

export const supplierPurchaseOrder = (id: string) =>
  response<SupplierPurchaseOrder>(`/api/v1/supplier/purchase-orders/${id}`);
