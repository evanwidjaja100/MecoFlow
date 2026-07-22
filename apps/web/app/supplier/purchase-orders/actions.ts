"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { apiRequest } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write(path: string, body: unknown) {
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
      error?.error?.message ?? "Supplier response could not be saved",
    );
  }
}

export async function acknowledgePurchaseOrder(formData: FormData) {
  const id = field(formData, "purchaseOrderId");
  await write(`/api/v1/supplier/purchase-orders/${id}/acknowledge`, {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath("/supplier/purchase-orders");
  revalidatePath(`/supplier/purchase-orders/${id}`);
}

export async function appendCommitment(formData: FormData) {
  const id = field(formData, "purchaseOrderId");
  const lineIds = formData
    .getAll("purchaseOrderLineId")
    .filter((value): value is string => typeof value === "string");
  await write(`/api/v1/supplier/purchase-orders/${id}/commitments`, {
    expectedVersion: Number(field(formData, "expectedVersion")),
    lines: lineIds.map((purchaseOrderLineId) => ({
      committedDate: field(formData, `committedDate-${purchaseOrderLineId}`),
      purchaseOrderLineId,
    })),
    note: field(formData, "note"),
  });
  revalidatePath("/supplier/purchase-orders");
  revalidatePath(`/supplier/purchase-orders/${id}`);
}
