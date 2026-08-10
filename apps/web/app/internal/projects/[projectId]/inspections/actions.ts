"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createCheckDefinition(formData: FormData) {
  const projectId = field(formData, "projectId");
  const itemId = field(formData, "itemId");
  const checkType = field(formData, "checkType");
  const precision = field(formData, "decimalPrecision");
  const minimum = field(formData, "minimumValue");
  const maximum = field(formData, "maximumValue");
  await writeApi(`/api/v1/items/${itemId}/inspection-check-definitions`, {
    body: {
      checkType,
      code: field(formData, "code"),
      description: field(formData, "description"),
      required: formData.get("required") === "on",
      name: field(formData, "name"),
      ...(checkType === "MEASUREMENT"
        ? {
            decimalPrecision: Number(precision || "0"),
            ...(minimum ? { minimumValue: minimum } : {}),
            ...(maximum ? { maximumValue: maximum } : {}),
          }
        : {}),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/inspections`);
}

export async function saveInspectionResults(formData: FormData) {
  const projectId = field(formData, "projectId");
  const inspectionId = field(formData, "inspectionId");
  const checkIds = formData
    .getAll("checkId")
    .filter((value): value is string => typeof value === "string");
  const results = checkIds.map((checkId) => {
    const type = field(formData, `type-${checkId}`);
    const common = { checkId, notes: field(formData, `notes-${checkId}`) };
    if (type === "CHECKLIST")
      return {
        ...common,
        checklistPassed: field(formData, `value-${checkId}`) === "PASS",
      };
    if (type === "MEASUREMENT")
      return { ...common, measuredValue: field(formData, `value-${checkId}`) };
    return {
      ...common,
      certificateDecision: field(formData, `value-${checkId}`),
      evidenceDocumentId: field(formData, `document-${checkId}`),
    };
  });
  await writeApi(`/api/v1/receiving-inspections/${inspectionId}/results`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      results,
    },
  });
  revalidatePath(`/internal/projects/${projectId}/inspections`);
  revalidatePath(`/internal/projects/${projectId}/inspections/${inspectionId}`);
}

export async function finalizeInspection(formData: FormData) {
  const projectId = field(formData, "projectId");
  const inspectionId = field(formData, "inspectionId");
  await writeApi(`/api/v1/receiving-inspections/${inspectionId}/finalize`, {
    body: {
      acceptedQuantity: field(formData, "acceptedQuantity"),
      disposition: field(formData, "disposition"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
      rejectedQuantity: field(formData, "rejectedQuantity"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/inspections`);
  revalidatePath(`/internal/projects/${projectId}/inspections/${inspectionId}`);
}

export async function uploadInspectionEvidence(formData: FormData) {
  const projectId = field(formData, "projectId");
  const inspectionId = field(formData, "inspectionId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select an evidence file up to 10 MiB");
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
        { entityId: inspectionId, entityType: "RECEIVING_INSPECTION" },
      ],
      byteSize: file.size,
      category: "INSPECTION_EVIDENCE",
      description: `Secure evidence for receiving inspection ${inspectionId}`,
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
  revalidatePath(`/internal/projects/${projectId}/inspections/${inspectionId}`);
}

export async function createExplicitInspection(formData: FormData) {
  const projectId = field(formData, "projectId");
  const lotId = field(formData, "inventoryLotId");
  const inspection = await writeApi<{ id: string }>(
    `/api/v1/inventory-lots/${lotId}/receiving-inspections`,
    { body: {} },
  );
  revalidatePath(`/internal/projects/${projectId}/inspections`);
  redirect(`/internal/projects/${projectId}/inspections/${inspection.id}`);
}
