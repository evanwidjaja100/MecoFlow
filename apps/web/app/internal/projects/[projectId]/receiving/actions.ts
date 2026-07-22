"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write<T>(
  path: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const response = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf ?? "",
      ...extraHeaders,
    },
    method: "POST",
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(error?.error?.message ?? "Receiving operation failed");
  }
  return (await response.json()) as T;
}

function instant(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()))
    throw new Error("Enter a valid receipt time");
  return parsed.toISOString();
}

export async function arriveAsn(formData: FormData) {
  const id = field(formData, "asnId");
  const projectId = field(formData, "projectId");
  await write(`/api/v1/asns/${id}/arrive`, {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath(`/internal/projects/${projectId}/receiving`);
}

export async function createGoodsReceipt(formData: FormData) {
  const projectId = field(formData, "projectId");
  const lineIds = formData
    .getAll("advanceShipmentNoticeLineId")
    .filter((value): value is string => typeof value === "string");
  const created = await write<{ id: string }>(
    `/api/v1/projects/${projectId}/goods-receipts`,
    {
      advanceShipmentNoticeId: field(formData, "asnId"),
      lines: lineIds.map((advanceShipmentNoticeLineId) => ({
        advanceShipmentNoticeLineId,
        batchNumber: field(formData, `batch-${advanceShipmentNoticeLineId}`),
        heatNumber: field(formData, `heat-${advanceShipmentNoticeLineId}`),
        manufacturer: field(
          formData,
          `manufacturer-${advanceShipmentNoticeLineId}`,
        ),
        packageReference: field(
          formData,
          `package-${advanceShipmentNoticeLineId}`,
        ),
        receivedQuantity: field(
          formData,
          `quantity-${advanceShipmentNoticeLineId}`,
        ),
      })),
      notes: field(formData, "notes"),
      receivedAt: instant(field(formData, "receivedAt")),
      warehouseLocation: field(formData, "warehouseLocation"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}/receiving`);
  redirect(`/internal/projects/${projectId}/receiving/${created.id}`);
}

export async function postGoodsReceipt(formData: FormData) {
  const id = field(formData, "receiptId");
  const projectId = field(formData, "projectId");
  await write(
    `/api/v1/goods-receipts/${id}/post`,
    { expectedVersion: Number(field(formData, "expectedVersion")) },
    { "idempotency-key": randomUUID() },
  );
  revalidatePath(`/internal/projects/${projectId}/receiving`);
  revalidatePath(`/internal/projects/${projectId}/receiving/${id}`);
}

export async function createCorrection(formData: FormData) {
  const receiptId = field(formData, "receiptId");
  const projectId = field(formData, "projectId");
  const lineIds = formData
    .getAll("goodsReceiptLineId")
    .filter((value): value is string => typeof value === "string");
  const created = await write<{ id: string }>(
    `/api/v1/goods-receipts/${receiptId}/corrections`,
    {
      lines: lineIds.map((goodsReceiptLineId) => ({
        batchNumber: field(formData, `batch-${goodsReceiptLineId}`),
        goodsReceiptLineId,
        heatNumber: field(formData, `heat-${goodsReceiptLineId}`),
        manufacturer: field(formData, `manufacturer-${goodsReceiptLineId}`),
        packageReference: field(formData, `package-${goodsReceiptLineId}`),
        quantityDelta: field(formData, `delta-${goodsReceiptLineId}`),
      })),
      notes: field(formData, "notes"),
      reason: field(formData, "reason"),
      receivedAt: instant(field(formData, "receivedAt")),
      warehouseLocation: field(formData, "warehouseLocation"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}/receiving`);
  redirect(`/internal/projects/${projectId}/receiving/${created.id}`);
}

export async function uploadReceiptPhoto(formData: FormData) {
  const receiptId = field(formData, "receiptId");
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select a photograph up to 10 MiB");
  const bytes = Buffer.from(await file.arrayBuffer());
  const initiated = await write<{
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/projects/${projectId}/documents/uploads`, {
    associations: [{ entityId: receiptId, entityType: "GOODS_RECEIPT" }],
    byteSize: file.size,
    category: "RECEIPT_PHOTOGRAPH",
    description: `Secure receiving photograph for receipt ${receiptId}`,
    fileName: file.name,
    mimeType: file.type,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    title: field(formData, "title"),
  });
  const uploaded = await fetch(initiated.upload.url, {
    body: bytes,
    headers: initiated.upload.headers,
    method: "PUT",
  });
  if (!uploaded.ok) throw new Error("Private object upload failed");
  await write(
    `/api/v1/document-versions/${initiated.upload.versionId}/complete`,
    {
      expectedVersion: initiated.upload.version,
    },
  );
  revalidatePath(`/internal/projects/${projectId}/receiving/${receiptId}`);
}
