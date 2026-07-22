import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

export type RevisionStatus =
  "DRAFT" | "IN_REVIEW" | "RELEASED" | "SUPERSEDED" | "CANCELLED";

export interface BomWorkspace {
  boms: Array<{
    id: string;
    revisions: Array<{
      createdAt: string;
      id: string;
      revisionNumber: number;
      status: RevisionStatus;
      title: string;
      updatedAt: string;
      version: number;
    }>;
    version: number;
    workPackage: { code: string; id: string; name: string } | null;
  }>;
  imports: BomImport[];
}

export interface BomImport {
  createdAt: string;
  createdRevision: {
    bomId: string;
    id: string;
    revisionNumber: number;
    status: RevisionStatus;
  } | null;
  errorCount: number;
  failureCode: string | null;
  id: string;
  projectId: string;
  rowCount: number;
  sourceFile: {
    byteSize: number;
    id: string;
    mimeType?: string;
    originalFileName: string;
    sha256: string;
    status: "QUARANTINED" | "VALIDATED" | "REJECTED";
  };
  status: "QUEUED" | "PARSING" | "READY" | "FAILED" | "CONFIRMED";
  version: number;
  warningCount: number;
  workPackage: { code: string; id: string; name: string } | null;
}

export interface ImportDetail extends BomImport {
  rows: Array<{
    criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW" | null;
    errors: Array<{ code: string; field: string; message: string }>;
    id: string;
    notes: string;
    quantity: string | null;
    rawData: Record<string, string>;
    rowNumber: number;
    warnings: Array<{ code: string; field: string; message: string }>;
  }>;
}

export interface RevisionDetail {
  bom: {
    id: string;
    project: { code: string; id: string; name: string };
    workPackage: { code: string; id: string; name: string } | null;
  };
  createdBy: { displayName: string; id: string };
  id: string;
  lines: Array<{
    affectsOfficialReadiness: boolean;
    criticality: "CRITICAL" | "HIGH" | "NORMAL" | "LOW";
    id: string;
    item: { code: string; id: string; name: string };
    lineNumber: number;
    notes: string;
    procurementCoverage: {
      allocatedQuantity: string;
      orderedQuantity: string;
      placeholder: true;
      status: "NOT_STARTED";
    };
    quantity: string;
    unitOfMeasure: { code: string; id: string; name: string; symbol: string };
    unitOfMeasureId: string;
    version: number;
  }>;
  notes: string;
  revisionNumber: number;
  sourceChecksum: string | null;
  sourceFile: BomImport["sourceFile"] | null;
  status: RevisionStatus;
  title: string;
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    occurredAt: string;
    reason: string;
    sourceStatus: RevisionStatus;
    targetStatus: RevisionStatus;
  }>;
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("BOM data is unavailable");
  return (await result.json()) as T;
}

export const bomWorkspace = (projectId: string) =>
  response<BomWorkspace>(`/api/v1/projects/${projectId}/boms`);

export const bomImportDetail = (importId: string) =>
  response<ImportDetail>(`/api/v1/bom-imports/${importId}`);

export const bomRevisionDetail = (revisionId: string) =>
  response<RevisionDetail>(`/api/v1/bom-revisions/${revisionId}`);

export const bomComparison = (
  bomId: string,
  fromRevisionId: string,
  toRevisionId: string,
) =>
  response<{
    changes: Array<{
      after: {
        criticality: string;
        notes: string;
        quantity: string;
        unitCode: string;
      } | null;
      before: {
        criticality: string;
        notes: string;
        quantity: string;
        unitCode: string;
      } | null;
      item: { code: string; id: string; name: string };
      kind: "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
    }>;
    from: { id: string; revisionNumber: number; status: RevisionStatus };
    summary: {
      added: number;
      changed: number;
      removed: number;
      unchanged: number;
    };
    to: { id: string; revisionNumber: number; status: RevisionStatus };
  }>(
    `/api/v1/boms/${bomId}/comparison?fromRevisionId=${encodeURIComponent(fromRevisionId)}&toRevisionId=${encodeURIComponent(toRevisionId)}`,
  );
