"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";
import type { SpecificationDataType } from "./data";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return field(formData, name) === "true";
}

async function write<T>(
  path: string,
  method: "PATCH" | "POST",
  body: unknown,
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf ?? "",
    },
    method,
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The item-master change could not be completed",
    );
  }
  return (result.status === 204 ? undefined : await result.json()) as T;
}

function specificationDefinitionBody(formData: FormData) {
  const dataType = field(formData, "dataType") as SpecificationDataType;
  const unitOfMeasureId = field(formData, "attributeUnitOfMeasureId");
  const decimalPrecision = field(formData, "attributeDecimalPrecision");
  return {
    code: field(formData, "attributeCode").toUpperCase(),
    dataType,
    description: field(formData, "attributeDescription"),
    name: field(formData, "attributeName"),
    required: checked(formData, "attributeRequired"),
    sortOrder: Number(field(formData, "attributeSortOrder")),
    ...(dataType === "NUMBER" && decimalPrecision !== ""
      ? { decimalPrecision: Number(decimalPrecision) }
      : {}),
    ...(dataType === "NUMBER" && unitOfMeasureId ? { unitOfMeasureId } : {}),
  };
}

function specificationValues(formData: FormData) {
  const values: Array<{
    attributeDefinitionId: string;
    value: string | boolean;
  }> = [];
  const seen = new Set<string>();
  for (const entry of formData.getAll("specificationAttribute")) {
    if (typeof entry !== "string") continue;
    const [attributeDefinitionId, dataType] = entry.split("|");
    if (
      !attributeDefinitionId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        attributeDefinitionId,
      ) ||
      !dataType ||
      !(["TEXT", "NUMBER", "BOOLEAN"] as string[]).includes(dataType) ||
      seen.has(attributeDefinitionId)
    ) {
      throw new Error("The specification input is invalid");
    }
    seen.add(attributeDefinitionId);
    const name = `specificationValue.${attributeDefinitionId}`;
    if (dataType === "BOOLEAN") {
      values.push({
        attributeDefinitionId,
        value: field(formData, name) === "true",
      });
      continue;
    }
    const value = field(formData, name);
    if (value !== "") values.push({ attributeDefinitionId, value });
  }
  return values;
}

export async function createItemCategory(formData: FormData): Promise<void> {
  await write("/api/v1/item-categories", "POST", {
    code: field(formData, "categoryCode").toUpperCase(),
    description: field(formData, "categoryDescription"),
    name: field(formData, "categoryName"),
  });
  revalidatePath("/internal/items");
}

export async function updateItemCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(`/api/v1/item-categories/${categoryId}`, "PATCH", {
    active: checked(formData, "categoryActive"),
    code: field(formData, "categoryCode").toUpperCase(),
    description: field(formData, "categoryDescription"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "categoryName"),
  });
  revalidatePath("/internal/items");
}

export async function createUnitOfMeasure(formData: FormData): Promise<void> {
  await write("/api/v1/units-of-measure", "POST", {
    code: field(formData, "unitCode").toUpperCase(),
    decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
    name: field(formData, "unitName"),
    symbol: field(formData, "unitSymbol"),
  });
  revalidatePath("/internal/items");
}

export async function updateUnitOfMeasure(formData: FormData): Promise<void> {
  const unitOfMeasureId = field(formData, "unitOfMeasureId");
  await write(`/api/v1/units-of-measure/${unitOfMeasureId}`, "PATCH", {
    active: checked(formData, "unitActive"),
    code: field(formData, "unitCode").toUpperCase(),
    decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "unitName"),
    symbol: field(formData, "unitSymbol"),
  });
  revalidatePath("/internal/items");
}

export async function createSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(
    `/api/v1/item-categories/${categoryId}/specification-attributes`,
    "POST",
    specificationDefinitionBody(formData),
  );
  revalidatePath("/internal/items");
}

export async function updateSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  const attributeDefinitionId = field(formData, "attributeDefinitionId");
  await write(
    `/api/v1/item-categories/${categoryId}/specification-attributes/${attributeDefinitionId}`,
    "PATCH",
    {
      ...specificationDefinitionBody(formData),
      active: checked(formData, "attributeActive"),
      expectedVersion: Number(field(formData, "expectedVersion")),
    },
  );
  revalidatePath("/internal/items");
}

export async function createItem(formData: FormData): Promise<void> {
  const item = await write<{ id: string }>("/api/v1/items", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    itemCategoryId: field(formData, "itemCategoryId"),
    name: field(formData, "name"),
    specificationValues: specificationValues(formData),
    unitOfMeasureId: field(formData, "unitOfMeasureId"),
  });
  redirect(`/internal/items/${item.id}`);
}

export async function updateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await write(`/api/v1/items/${itemId}`, "PATCH", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
    specificationValues: specificationValues(formData),
    unitOfMeasureId: field(formData, "unitOfMeasureId"),
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}

export async function deactivateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await write(`/api/v1/items/${itemId}/deactivate`, "POST", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}
