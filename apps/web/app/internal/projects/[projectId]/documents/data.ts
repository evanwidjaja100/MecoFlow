import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export type DocumentStatus =
  | "QUARANTINED"
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED"
  | "SCAN_FAILED";

export interface ProjectDocument {
  associations: Array<{
    entityId: string;
    entityType:
      | "ADVANCE_SHIPMENT_NOTICE"
      | "GOODS_RECEIPT"
      | "PROJECT"
      | "WORK_PACKAGE"
      | "BOM"
      | "PURCHASE_REQUISITION"
      | "PURCHASE_ORDER";
    id: string;
  }>;
  category: string;
  createdAt: string;
  currentVersionNumber: number;
  description: string;
  id: string;
  ownerOrganization: {
    code: string;
    id: string;
    name: string;
    type: "INTERNAL" | "SUPPLIER";
  };
  title: string;
  version: number;
  versions: Array<{
    byteSize: number;
    createdAt: string;
    createdBy: { displayName: string; id: string };
    declaredMimeType: string;
    detectedMimeType: string | null;
    extension: string;
    id: string;
    originalFileName: string;
    reviewReason: string;
    reviewedAt: string | null;
    reviewedBy: { displayName: string; id: string } | null;
    scanResultCode: string | null;
    scanStatus: "PENDING" | "CLEAN" | "INFECTED" | "ERROR";
    sha256: string;
    status: DocumentStatus;
    version: number;
    versionNumber: number;
  }>;
}

export async function projectDocuments(projectId: string) {
  const result = await apiRequest(`/api/v1/projects/${projectId}/documents`);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Document data is unavailable");
  return (await result.json()) as ProjectDocument[];
}
