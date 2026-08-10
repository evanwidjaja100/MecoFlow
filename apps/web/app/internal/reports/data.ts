import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface RateMetric {
  denominator: string;
  numerator: string;
  percentage: number | null;
  unit: "COUNT" | "QUANTITY";
}

export interface SupplierKpis {
  commitmentRevisionRate: RateMetric;
  firstPassAcceptanceRate: RateMetric;
  latestCommitmentOnTimeRate: RateMetric;
  ncrResponseRate: RateMetric;
  originalCommitmentOnTimeRate: RateMetric;
  requiredDateDeliveryRate: RateMetric;
  usableAcceptanceRate: RateMetric;
}

export interface SupplierScorecard {
  deliveryLines?: Array<{
    currentAcknowledged: boolean;
    item: { code: string; id: string; name: string };
    latestCommitmentDate: string | null;
    orderedQuantity: string;
    originalCommitmentDate: string | null;
    project: { code: string; id: string; name: string };
    purchaseOrderLineId: string;
    purchaseOrderNumber: number;
    requiredDate: string;
    revisionNumber: number;
  }>;
  filters: Record<string, string>;
  generatedAt: string;
  kpis: SupplierKpis;
  modelVersion: string;
  supplier: { code: string; id: string; name: string };
  trends: Array<{ kpis: SupplierKpis; month: string }>;
}

export interface ProjectReadinessReportRow {
  blockerCount: number;
  calculatedAt: string;
  calculationDate: string;
  explanation: string;
  project: { code: string; id: string; name: string };
  reasonCodes: string[];
  score: number;
  status: "AMBER" | "COMPLETE" | "GREEN" | "RED";
}

export interface MaterialExceptionRow {
  blockerReason: string | null;
  criticality: string;
  itemCategory: { code: string; id: string; name: string } | null;
  itemCode: string;
  itemName: string;
  openNcrCount: number;
  project: { code: string; id: string; name: string };
  requiredDate: string;
  shortage: string;
  workPackageCode: string | null;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Report data is unavailable");
  return (await result.json()) as T;
}

export const projectReadinessReport = (query: URLSearchParams) =>
  response<{ data: ProjectReadinessReportRow[]; meta: ReportMeta }>(
    `/api/v1/reports/project-readiness?${query.toString()}`,
  );

export const materialExceptionsReport = (query: URLSearchParams) =>
  response<{ data: MaterialExceptionRow[]; meta: ReportMeta }>(
    `/api/v1/reports/material-exceptions?${query.toString()}`,
  );

export const supplierPerformanceReport = (query: URLSearchParams) =>
  response<{ data: SupplierScorecard[]; meta: ReportMeta }>(
    `/api/v1/reports/supplier-performance?${query.toString()}`,
  );

export interface ReportMeta {
  filters: Record<string, string>;
  generatedAt: string;
  reportKey: string;
}
