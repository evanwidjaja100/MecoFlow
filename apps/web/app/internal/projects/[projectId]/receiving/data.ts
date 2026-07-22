import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export interface InternalAsn {
  arrivedAt: string | null;
  carrier: string;
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
    shippedQuantity: string;
  }>;
  purchaseOrder: { id: string; purchaseOrderNumber: number; status: string };
  status: "DRAFT" | "SUBMITTED" | "IN_TRANSIT" | "ARRIVED" | "CANCELLED";
  supplierOrganization: { code: string; id: string; name: string };
  supplierReference: string;
  trackingNumber: string;
  version: number;
}

export interface GoodsReceipt {
  advanceShipmentNotice: {
    id: string;
    supplierReference: string;
    supplierOrganization: { code: string; id: string; name: string };
  };
  correctionReason: string | null;
  corrections: Array<{ id: string; receiptNumber: number; status: string }>;
  createdAt: string;
  createdBy: { displayName: string; id: string };
  id: string;
  kind: "RECEIPT" | "CORRECTION";
  lines: Array<{
    advanceShipmentNoticeLine: {
      purchaseOrderLine: {
        item: { code: string; id: string; name: string };
        unitOfMeasure: {
          code: string;
          id: string;
          name: string;
          symbol: string;
        };
      };
    };
    advanceShipmentNoticeLineId: string;
    batchNumber: string;
    heatNumber: string;
    id: string;
    inventoryLot: null | {
      adjustments: Array<{ id: string; quantityDelta: string }>;
      id: string;
      lotNumber: number;
      quantity: string;
      status: "AWAITING_INSPECTION";
    };
    inventoryLotAdjustment: null | {
      inventoryLot: { id: string; lotNumber: number };
      quantityDelta: string;
    };
    manufacturer: string;
    packageReference: string;
    quantityDelta: string;
  }>;
  notes: string;
  postedAt: string | null;
  postedBy: { displayName: string; id: string } | null;
  project: { code: string; id: string; name: string };
  receiptNumber: number;
  receivedAt: string;
  status: "DRAFT" | "POSTED";
  version: number;
  warehouseLocation: string;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Receiving data is unavailable");
  return (await result.json()) as T;
}

export async function receivingWorkspace(projectId: string) {
  const [asns, receipts] = await Promise.all([
    response<{ data: InternalAsn[] }>(`/api/v1/projects/${projectId}/asns`),
    response<{ data: GoodsReceipt[] }>(
      `/api/v1/projects/${projectId}/goods-receipts`,
    ),
  ]);
  return { asns: asns.data, receipts: receipts.data };
}

export const goodsReceipt = (id: string) =>
  response<GoodsReceipt>(`/api/v1/goods-receipts/${id}`);
