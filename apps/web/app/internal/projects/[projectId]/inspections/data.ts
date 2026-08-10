import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export interface InspectionCheckDefinition {
  active: boolean;
  checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
  code: string;
  decimalPrecision: number | null;
  description: string;
  id: string;
  item: { code: string; id: string; name: string };
  maximumValue: string | null;
  minimumValue: string | null;
  name: string;
  required: boolean;
  unitOfMeasure: null | {
    code: string;
    id: string;
    name: string;
    symbol: string;
  };
  version: number;
}

export interface ReceivingInspection {
  acceptedQuantity: string;
  checks: Array<{
    certificateDecision: "ACCEPTED" | "REJECTED" | null;
    checkType: "CERTIFICATE" | "CHECKLIST" | "MEASUREMENT";
    checklistPassed: boolean | null;
    code: string;
    completedAt: string | null;
    conforming: boolean | null;
    decimalPrecision: number | null;
    description: string;
    evidenceDocumentId: string | null;
    id: string;
    maximumValue: string | null;
    measuredValue: string | null;
    minimumValue: string | null;
    name: string;
    notes: string;
    required: boolean;
    unitOfMeasure: null | { symbol: string };
  }>;
  conditionalAcceptanceAuthorizedBy: null | {
    displayName: string;
    id: string;
  };
  createdAt: string;
  createdBy: { displayName: string; id: string };
  disposition:
    "ACCEPTED" | "CONDITIONALLY_ACCEPTED" | "QUARANTINED" | "REJECTED" | null;
  evidenceDocuments: Array<{
    category: string;
    currentVersionNumber: number;
    id: string;
    title: string;
    versions: Array<{
      id: string;
      scanStatus: string;
      status: string;
      versionNumber: number;
    }>;
  }>;
  finalizedAt: string | null;
  finalizedBy: null | { displayName: string; id: string };
  finalizedReceivedQuantity: string | null;
  id: string;
  inventoryLot: {
    acceptedQuantity: string;
    batchNumber: string;
    effectiveQuantity: string;
    heatNumber: string;
    id: string;
    item: { code: string; id: string; name: string };
    lotNumber: number;
    quarantinedQuantity: string;
    rejectedQuantity: string;
    sourceGoodsReceipt: {
      id: string;
      receiptNumber: number;
      receivedAt: string;
    };
    status: string;
    unitOfMeasure: {
      decimalPrecision: number;
      id: string;
      symbol: string;
    };
  };
  project: { code: string; id: string; name: string };
  quarantinedQuantity: string;
  reason: string;
  rejectedQuantity: string;
  status: "FINALIZED" | "OPEN";
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Inspection data is unavailable");
  return (await result.json()) as T;
}

export const inspectionQueue = (projectId: string) =>
  response<{ data: ReceivingInspection[] }>(
    `/api/v1/projects/${projectId}/receiving-inspections`,
  ).then(({ data }) => data);

export const inspectionDetail = (inspectionId: string) =>
  response<ReceivingInspection>(
    `/api/v1/receiving-inspections/${inspectionId}`,
  );

export const inspectionDefinitions = () =>
  response<{ data: InspectionCheckDefinition[] }>(
    "/api/v1/inspection-check-definitions",
  ).then(({ data }) => data);

export const inspectionItems = () =>
  response<{ data: Array<{ code: string; id: string; name: string }> }>(
    "/api/v1/items?page=1&pageSize=100&active=true&sortBy=code&sortDirection=asc",
  ).then(({ data }) => data);
