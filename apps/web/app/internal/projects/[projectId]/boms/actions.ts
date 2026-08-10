"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function uploadBom(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024)
    throw new Error("Choose a CSV or XLSX file up to 5 MiB");
  const workPackageId = field(formData, "workPackageId");
  const bomImport = await writeApi<{ id: string }>(
    `/api/v1/projects/${projectId}/bom-imports`,
    {
      method: "POST",
      body: {
        contentBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        fileName: file.name,
        mimeType:
          file.type ||
          (file.name.toLowerCase().endsWith(".csv") ? "text/csv" : ""),
        ...(workPackageId ? { workPackageId } : {}),
      },
    },
  );
  redirect(`/internal/projects/${projectId}/boms/imports/${bomImport.id}`);
}

export async function confirmBomImport(formData: FormData): Promise<void> {
  const importId = field(formData, "importId");
  const projectId = field(formData, "projectId");
  const revision = await writeApi<{ id: string }>(
    `/api/v1/bom-imports/${importId}/confirm`,
    {
      method: "POST",
      body: {
        confirmed: field(formData, "confirmed") === "true",
        expectedVersion: Number(field(formData, "expectedVersion")),
        notes: field(formData, "notes"),
        title: field(formData, "title"),
      },
    },
  );
  redirect(`/internal/projects/${projectId}/boms/revisions/${revision.id}`);
}

export async function correctBomLine(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const revisionId = field(formData, "revisionId");
  const lineId = field(formData, "lineId");
  await writeApi(`/api/v1/bom-revisions/${revisionId}/lines/${lineId}`, {
    method: "PATCH",
    body: {
      criticality: field(formData, "criticality"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      notes: field(formData, "notes"),
      quantity: field(formData, "quantity"),
      unitOfMeasureId: field(formData, "unitOfMeasureId"),
    },
  });
  revalidatePath(
    `/internal/projects/${projectId}/boms/revisions/${revisionId}`,
  );
}

async function lifecycle(
  formData: FormData,
  command: "cancel" | "release" | "review" | "supersede",
) {
  const projectId = field(formData, "projectId");
  const revisionId = field(formData, "revisionId");
  await writeApi(`/api/v1/bom-revisions/${revisionId}/${command}`, {
    method: "POST",
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/boms`);
  revalidatePath(
    `/internal/projects/${projectId}/boms/revisions/${revisionId}`,
  );
}

export async function reviewBomRevision(formData: FormData): Promise<void> {
  await lifecycle(formData, "review");
}

export async function releaseBomRevision(formData: FormData): Promise<void> {
  await lifecycle(formData, "release");
}

export async function supersedeBomRevision(formData: FormData): Promise<void> {
  await lifecycle(formData, "supersede");
}

export async function cancelBomRevision(formData: FormData): Promise<void> {
  await lifecycle(formData, "cancel");
}
