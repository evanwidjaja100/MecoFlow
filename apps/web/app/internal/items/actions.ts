"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../lib/api";
import type { SpecificationDataType } from "./data";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function checked(formData: FormData, name: string): boolean {
  return field(formData, name) === "true";
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
  await writeApi("/api/v1/item-categories", {
    method: "POST",
    body: {
      code: field(formData, "categoryCode").toUpperCase(),
      description: field(formData, "categoryDescription"),
      name: field(formData, "categoryName"),
    },
  });
  revalidatePath("/internal/items");
}

export async function updateItemCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await writeApi(`/api/v1/item-categories/${categoryId}`, {
    method: "PATCH",
    body: {
      active: checked(formData, "categoryActive"),
      code: field(formData, "categoryCode").toUpperCase(),
      description: field(formData, "categoryDescription"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "categoryName"),
    },
  });
  revalidatePath("/internal/items");
}

export async function createUnitOfMeasure(formData: FormData): Promise<void> {
  await writeApi("/api/v1/units-of-measure", {
    method: "POST",
    body: {
      code: field(formData, "unitCode").toUpperCase(),
      decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
      name: field(formData, "unitName"),
      symbol: field(formData, "unitSymbol"),
    },
  });
  revalidatePath("/internal/items");
}

export async function updateUnitOfMeasure(formData: FormData): Promise<void> {
  const unitOfMeasureId = field(formData, "unitOfMeasureId");
  await writeApi(`/api/v1/units-of-measure/${unitOfMeasureId}`, {
    method: "PATCH",
    body: {
      active: checked(formData, "unitActive"),
      code: field(formData, "unitCode").toUpperCase(),
      decimalPrecision: Number(field(formData, "unitDecimalPrecision")),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "unitName"),
      symbol: field(formData, "unitSymbol"),
    },
  });
  revalidatePath("/internal/items");
}

export async function createSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await writeApi(
    `/api/v1/item-categories/${categoryId}/specification-attributes`,
    { method: "POST", body: specificationDefinitionBody(formData) },
  );
  revalidatePath("/internal/items");
}

export async function updateSpecificationAttribute(
  formData: FormData,
): Promise<void> {
  const categoryId = field(formData, "categoryId");
  const attributeDefinitionId = field(formData, "attributeDefinitionId");
  await writeApi(
    `/api/v1/item-categories/${categoryId}/specification-attributes/${attributeDefinitionId}`,
    {
      method: "PATCH",
      body: {
        ...specificationDefinitionBody(formData),
        active: checked(formData, "attributeActive"),
        expectedVersion: Number(field(formData, "expectedVersion")),
      },
    },
  );
  revalidatePath("/internal/items");
}

export async function createItem(formData: FormData): Promise<void> {
  const item = await writeApi<{ id: string }>("/api/v1/items", {
    method: "POST",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      itemCategoryId: field(formData, "itemCategoryId"),
      name: field(formData, "name"),
      specificationValues: specificationValues(formData),
      unitOfMeasureId: field(formData, "unitOfMeasureId"),
    },
  });
  redirect(`/internal/items/${item.id}`);
}

export async function updateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await writeApi(`/api/v1/items/${itemId}`, {
    method: "PATCH",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
      specificationValues: specificationValues(formData),
      unitOfMeasureId: field(formData, "unitOfMeasureId"),
    },
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}

export async function deactivateItem(formData: FormData): Promise<void> {
  const itemId = field(formData, "itemId");
  await writeApi(`/api/v1/items/${itemId}/deactivate`, {
    method: "POST",
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
    },
  });
  revalidatePath(`/internal/items/${itemId}`);
  revalidatePath("/internal/items");
}
