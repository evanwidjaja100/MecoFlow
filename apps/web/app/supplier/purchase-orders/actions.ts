"use server";

import { revalidatePath } from "next/cache";
import { writeApi } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function acknowledgePurchaseOrder(formData: FormData) {
  const id = field(formData, "purchaseOrderId");
  await writeApi(`/api/v1/supplier/purchase-orders/${id}/acknowledge`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
    },
  });
  revalidatePath("/supplier/purchase-orders");
  revalidatePath(`/supplier/purchase-orders/${id}`);
}

export async function appendCommitment(formData: FormData) {
  const id = field(formData, "purchaseOrderId");
  const lineIds = formData
    .getAll("purchaseOrderLineId")
    .filter((value): value is string => typeof value === "string");
  await writeApi(`/api/v1/supplier/purchase-orders/${id}/commitments`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      lines: lineIds.map((purchaseOrderLineId) => ({
        committedDate: field(formData, `committedDate-${purchaseOrderLineId}`),
        purchaseOrderLineId,
      })),
      note: field(formData, "note"),
    },
  });
  revalidatePath("/supplier/purchase-orders");
  revalidatePath(`/supplier/purchase-orders/${id}`);
}
