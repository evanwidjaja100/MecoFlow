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

export interface OwnSupplierScorecard {
  filters: Record<string, string>;
  generatedAt: string;
  kpis: SupplierKpis;
  modelVersion: string;
  supplier: { code: string; id: string; name: string };
  trends: Array<{ kpis: SupplierKpis; month: string }>;
}

export async function ownScorecard(
  query: URLSearchParams,
): Promise<OwnSupplierScorecard> {
  const result = await apiRequest(
    `/api/v1/supplier/scorecard?${query.toString()}`,
  );
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Supplier scorecard is unavailable");
  return ((await result.json()) as { data: OwnSupplierScorecard }).data;
}
