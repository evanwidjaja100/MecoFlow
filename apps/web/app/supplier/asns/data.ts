import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface SupplierAsn {
  arrivedAt: string | null;
  carrier: string;
  createdAt: string;
  departedAt: string | null;
  estimatedArrivalDate: string | null;
  id: string;
  lines: Array<{
    id: string;
    lineNumber: number;
    packageReference: string;
    purchaseOrderLine: {
      item: { code: string; id: string; name: string };
      unitOfMeasure: { code: string; id: string; name: string; symbol: string };
    };
    purchaseOrderLineId: string;
    shippedQuantity: string;
  }>;
  notes: string;
  project: { code: string; id: string; name: string };
  purchaseOrder: { id: string; purchaseOrderNumber: number; status: string };
  status: "DRAFT" | "SUBMITTED" | "IN_TRANSIT" | "ARRIVED" | "CANCELLED";
  submittedAt: string | null;
  supplierOrganization: { code: string; id: string; name: string };
  supplierReference: string;
  trackingNumber: string;
  transitions: Array<{
    id: string;
    occurredAt: string;
    reason: string;
    sourceStatus: string;
    targetStatus: string;
  }>;
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Shipment notice data is unavailable");
  return (await result.json()) as T;
}

export const supplierAsns = () =>
  response<{ data: SupplierAsn[] }>("/api/v1/supplier/asns").then(
    ({ data }) => data,
  );

export const supplierAsn = (id: string) =>
  response<SupplierAsn>(`/api/v1/supplier/asns/${id}`);
