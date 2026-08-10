import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface SupplierNcr {
  id: string;
  number: string;
  title: string;
  description: string;
  status: "ISSUED" | "SUPPLIER_RESPONDED" | "CLOSED";
  sourceType: string;
  sharedDispositionNotes: string | null;
  project: { code: string; id: string; name: string };
  inventoryLot: null | {
    id: string;
    lotNumber: number;
    status: string;
    item: { code: string; id: string; name: string };
  };
  supplierResponses: Array<{
    correctiveAction: string;
    createdAt: string;
    id: string;
    message: string;
    revisionNumber: number;
    rootCause: string;
    submittedBy: { displayName: string; id: string };
  }>;
  version: number;
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Supplier NCR data is unavailable");
  return (await result.json()) as T;
}

export const supplierNcrs = () =>
  response<{ data: SupplierNcr[] }>("/api/v1/supplier/ncrs").then(
    ({ data }) => data,
  );
export const supplierNcr = (id: string) =>
  response<SupplierNcr>(`/api/v1/supplier/ncrs/${id}`);
