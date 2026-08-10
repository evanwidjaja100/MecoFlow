"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../../../lib/api";

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createNcrFromInspection(formData: FormData) {
  const projectId = field(formData, "projectId");
  const created = await writeApi<{ id: string }>(
    `/api/v1/projects/${projectId}/ncrs`,
    {
      body: {
        description: field(formData, "description"),
        internalDispositionNotes: field(formData, "internalDispositionNotes"),
        receivingInspectionId: field(formData, "inspectionId"),
        shareInternalNotes: formData.get("shareInternalNotes") === "on",
        sourceType: "RECEIVING_INSPECTION",
        title: field(formData, "title"),
      },
    },
  );
  revalidatePath(`/internal/projects/${projectId}/quality`);
  redirect(`/internal/projects/${projectId}/quality/ncrs/${created.id}`);
}

async function ncrCommand(
  formData: FormData,
  command: "cancel" | "close" | "issue",
) {
  const projectId = field(formData, "projectId");
  const id = field(formData, "ncrId");
  await writeApi(`/api/v1/ncrs/${id}/${command}`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
      ...(command === "close"
        ? {
            internalDispositionNotes: field(
              formData,
              "internalDispositionNotes",
            ),
            shareInternalNotes: formData.get("shareInternalNotes") === "on",
          }
        : {}),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/quality`);
  revalidatePath(`/internal/projects/${projectId}/quality/ncrs/${id}`);
}

export async function issueNcr(formData: FormData) {
  await ncrCommand(formData, "issue");
}
export async function closeNcr(formData: FormData) {
  await ncrCommand(formData, "close");
}
export async function cancelNcr(formData: FormData) {
  await ncrCommand(formData, "cancel");
}

export async function createAllocation(formData: FormData) {
  const projectId = field(formData, "projectId");
  await writeApi(`/api/v1/projects/${projectId}/material-allocations`, {
    body: {
      bomLineId: field(formData, "bomLineId"),
      conditionalUseReason:
        field(formData, "conditionalUseReason") || undefined,
      inventoryLotId: field(formData, "inventoryLotId"),
      quantity: field(formData, "quantity"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/quality`);
}

async function allocationCommand(
  formData: FormData,
  command: "consume" | "release",
) {
  const projectId = field(formData, "projectId");
  const id = field(formData, "allocationId");
  await writeApi(`/api/v1/material-allocations/${id}/${command}`, {
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}/quality`);
}

export async function releaseAllocation(formData: FormData) {
  await allocationCommand(formData, "release");
}
export async function consumeAllocation(formData: FormData) {
  await allocationCommand(formData, "consume");
}
