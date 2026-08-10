"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createAsn(formData: FormData) {
  const purchaseOrderId = field(formData, "purchaseOrderId");
  const lineIds = formData
    .getAll("purchaseOrderLineId")
    .filter((value): value is string => typeof value === "string");
  const created = await writeApi<{ id: string }>(
    `/api/v1/supplier/purchase-orders/${purchaseOrderId}/asns`,
    {
      body: {
        carrier: field(formData, "carrier"),
        estimatedArrivalDate:
          field(formData, "estimatedArrivalDate") || undefined,
        lines: lineIds.map((purchaseOrderLineId) => ({
          packageReference: field(formData, `package-${purchaseOrderLineId}`),
          purchaseOrderLineId,
          shippedQuantity: field(formData, `quantity-${purchaseOrderLineId}`),
        })),
        notes: field(formData, "notes"),
        supplierReference: field(formData, "supplierReference"),
        trackingNumber: field(formData, "trackingNumber"),
      },
    },
  );
  revalidatePath("/supplier/asns");
  redirect(`/supplier/asns/${created.id}`);
}

async function transition(
  formData: FormData,
  command: "cancel" | "dispatch" | "submit",
) {
  const id = field(formData, "asnId");
  await writeApi(`/api/v1/supplier/asns/${id}/${command}`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
    },
  });
  revalidatePath("/supplier/asns");
  revalidatePath(`/supplier/asns/${id}`);
}

export async function submitAsn(formData: FormData) {
  await transition(formData, "submit");
}

export async function dispatchAsn(formData: FormData) {
  await transition(formData, "dispatch");
}

export async function cancelAsn(formData: FormData) {
  await transition(formData, "cancel");
}

export async function uploadAsnDocument(formData: FormData) {
  const asnId = field(formData, "asnId");
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select a file up to 10 MiB");
  const bytes = Buffer.from(await file.arrayBuffer());
  const initiated = await writeApi<{
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/projects/${projectId}/documents/uploads`, {
    body: {
      associations: [
        { entityId: asnId, entityType: "ADVANCE_SHIPMENT_NOTICE" },
      ],
      byteSize: file.size,
      category: field(formData, "category"),
      description: `Secure supplier shipment attachment for ASN ${asnId}`,
      fileName: file.name,
      mimeType: file.type,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      title: field(formData, "title"),
    },
  });
  const uploaded = await fetch(initiated.upload.url, {
    body: bytes,
    headers: initiated.upload.headers,
    method: "PUT",
  });
  if (!uploaded.ok) throw new Error("Private object upload failed");
  await writeApi(
    `/api/v1/document-versions/${initiated.upload.versionId}/complete`,
    { body: { expectedVersion: initiated.upload.version } },
  );
  revalidatePath(`/supplier/asns/${asnId}`);
}
