import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN";

export interface UnitOfMeasure {
  active: boolean;
  code: string;
  decimalPrecision: number;
  id: string;
  name: string;
  symbol: string;
  version: number;
}

export interface SpecificationAttributeDefinition {
  active: boolean;
  code: string;
  dataType: SpecificationDataType;
  decimalPrecision: number | null;
  description: string;
  id: string;
  name: string;
  required: boolean;
  sortOrder: number;
  unitOfMeasure: Pick<
    UnitOfMeasure,
    "code" | "decimalPrecision" | "id" | "name" | "symbol"
  > | null;
  unitOfMeasureId: string | null;
  version: number;
}

export interface ItemCategory {
  active: boolean;
  code: string;
  description: string;
  id: string;
  name: string;
  specificationAttributes: SpecificationAttributeDefinition[];
  version: number;
}

export interface ItemListItem {
  active: boolean;
  code: string;
  description: string;
  id: string;
  itemCategory: Pick<ItemCategory, "code" | "id" | "name">;
  name: string;
  unitOfMeasure: Pick<
    UnitOfMeasure,
    "code" | "decimalPrecision" | "id" | "name" | "symbol"
  >;
  updatedAt: string;
  version: number;
}

export interface ItemDetail extends ItemListItem {
  specificationValues: Array<{
    attributeDefinition: SpecificationAttributeDefinition;
    attributeDefinitionId: string;
    value: string | boolean;
  }>;
}

export interface ItemListResponse {
  data: ItemListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Item-master data is unavailable");
  return (await result.json()) as T;
}

export const itemCategories = async () =>
  (await response<{ data: ItemCategory[] }>("/api/v1/item-categories")).data;

export const unitsOfMeasure = async () =>
  (await response<{ data: UnitOfMeasure[] }>("/api/v1/units-of-measure")).data;

export const itemList = (query: URLSearchParams) =>
  response<ItemListResponse>(`/api/v1/items?${query.toString()}`);

export const itemDetail = (itemId: string) =>
  response<ItemDetail>(`/api/v1/items/${itemId}`);

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  }).format(new Date(value));
}

export function specificationStep(decimalPrecision: number | null): string {
  const precision = Math.max(0, Math.min(decimalPrecision ?? 0, 6));
  return precision === 0 ? "1" : `0.${"0".repeat(precision - 1)}1`;
}
