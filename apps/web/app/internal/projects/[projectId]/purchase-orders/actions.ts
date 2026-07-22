"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write<T>(path: string, body: unknown): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const response = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-csrf-token": csrf ?? "" },
    method: "POST",
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The purchase order change failed",
    );
  }
  return (await response.json()) as T;
}

export async function createPurchaseOrder(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const ids = formData
    .getAll("purchaseRequisitionLineId")
    .filter((value): value is string => typeof value === "string");
  if (ids.length === 0)
    throw new Error("Select at least one approved requisition line");
  const order = await write<{ id: string }>(
    `/api/v1/projects/${projectId}/purchase-orders`,
    {
      internalCommercialTerms: field(formData, "internalCommercialTerms"),
      internalNotes: field(formData, "internalNotes"),
      lines: ids.map((purchaseRequisitionLineId) => ({
        allocations: [
          {
            purchaseRequisitionLineId,
            quantity: field(formData, `quantity-${purchaseRequisitionLineId}`),
            ...(field(formData, `override-${purchaseRequisitionLineId}`)
              ? {
                  overrideReason: field(
                    formData,
                    `override-${purchaseRequisitionLineId}`,
                  ),
                }
              : {}),
          },
        ],
        internalLineNotes: field(
          formData,
          `lineNotes-${purchaseRequisitionLineId}`,
        ),
        ...(field(formData, `unitPrice-${purchaseRequisitionLineId}`)
          ? {
              internalUnitPrice: field(
                formData,
                `unitPrice-${purchaseRequisitionLineId}`,
              ),
            }
          : {}),
        orderedQuantity: field(
          formData,
          `quantity-${purchaseRequisitionLineId}`,
        ),
      })),
      revisionReason: field(formData, "revisionReason"),
      supplierMessage: field(formData, "supplierMessage"),
      supplierOrganizationId: field(formData, "supplierOrganizationId"),
      title: field(formData, "title"),
    },
  );
  redirect(`/internal/projects/${projectId}/purchase-orders/${order.id}`);
}

async function command(formData: FormData, kind: "cancel" | "send") {
  const projectId = field(formData, "projectId");
  const purchaseOrderId = field(formData, "purchaseOrderId");
  await write(`/api/v1/purchase-orders/${purchaseOrderId}/${kind}`, {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath(`/internal/projects/${projectId}/purchase-orders`);
  revalidatePath(
    `/internal/projects/${projectId}/purchase-orders/${purchaseOrderId}`,
  );
}

export async function sendPurchaseOrder(formData: FormData) {
  await command(formData, "send");
}

export async function cancelPurchaseOrder(formData: FormData) {
  await command(formData, "cancel");
}
