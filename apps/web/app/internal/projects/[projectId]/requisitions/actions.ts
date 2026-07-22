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
  const result = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-csrf-token": csrf ?? "" },
    method: "POST",
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The requisition change could not be completed",
    );
  }
  return (await result.json()) as T;
}

export async function createRequisition(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const lineIds = formData
    .getAll("bomLineId")
    .filter((value): value is string => typeof value === "string");
  if (lineIds.length === 0) throw new Error("Select at least one BOM line");
  const requisition = await write<{ id: string }>(
    `/api/v1/projects/${projectId}/requisitions`,
    {
      lines: lineIds.map((bomLineId) => ({
        bomLineId,
        quantity: field(formData, `quantity-${bomLineId}`),
        ...(field(formData, `override-${bomLineId}`)
          ? { overrideReason: field(formData, `override-${bomLineId}`) }
          : {}),
      })),
      notes: field(formData, "notes"),
      title: field(formData, "title"),
    },
  );
  redirect(`/internal/projects/${projectId}/requisitions/${requisition.id}`);
}

async function lifecycle(
  formData: FormData,
  command: "approve" | "cancel" | "reject" | "submit",
) {
  const projectId = field(formData, "projectId");
  const requisitionId = field(formData, "requisitionId");
  await write(`/api/v1/purchase-requisitions/${requisitionId}/${command}`, {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
  });
  revalidatePath(`/internal/projects/${projectId}/requisitions`);
  revalidatePath(
    `/internal/projects/${projectId}/requisitions/${requisitionId}`,
  );
}

export async function submitRequisition(formData: FormData) {
  await lifecycle(formData, "submit");
}
export async function approveRequisition(formData: FormData) {
  await lifecycle(formData, "approve");
}
export async function rejectRequisition(formData: FormData) {
  await lifecycle(formData, "reject");
}
export async function cancelRequisition(formData: FormData) {
  await lifecycle(formData, "cancel");
}
