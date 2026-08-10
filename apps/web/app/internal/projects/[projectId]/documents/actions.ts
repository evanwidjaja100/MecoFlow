"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function upload(
  file: File,
  session: {
    headers: Record<string, string>;
    url: string;
    version: number;
    versionId: string;
  },
) {
  const response = await fetch(session.url, {
    body: Buffer.from(await file.arrayBuffer()),
    headers: session.headers,
    method: "PUT",
  });
  if (!response.ok) throw new Error("Private object upload failed");
  await writeApi(`/api/v1/document-versions/${session.versionId}/complete`, {
    body: { expectedVersion: session.version },
  });
}

export async function uploadDocument(formData: FormData) {
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select a file up to 10 MiB");
  const body = Buffer.from(await file.arrayBuffer());
  const initiated = await writeApi<{
    document: { id: string };
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/projects/${projectId}/documents/uploads`, {
    body: {
      byteSize: file.size,
      category: field(formData, "category"),
      description: field(formData, "description"),
      fileName: file.name,
      mimeType: file.type,
      sha256: createHash("sha256").update(body).digest("hex"),
      title: field(formData, "title"),
    },
  });
  await upload(file, initiated.upload);
  revalidatePath(`/internal/projects/${projectId}/documents`);
}

export async function supersedeDocument(formData: FormData) {
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select a file up to 10 MiB");
  const body = Buffer.from(await file.arrayBuffer());
  const initiated = await writeApi<{
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/documents/${field(formData, "documentId")}/supersede`, {
    body: {
      byteSize: file.size,
      expectedDocumentVersion: Number(
        field(formData, "expectedDocumentVersion"),
      ),
      fileName: file.name,
      mimeType: file.type,
      reason: field(formData, "reason"),
      sha256: createHash("sha256").update(body).digest("hex"),
    },
  });
  await upload(file, initiated.upload);
  revalidatePath(`/internal/projects/${projectId}/documents`);
}

async function lifecycle(
  formData: FormData,
  command: "approve" | "reject" | "submit-review",
) {
  const projectId = field(formData, "projectId");
  await writeApi(
    `/api/v1/document-versions/${field(formData, "versionId")}/${command}`,
    {
      body: {
        expectedVersion: Number(field(formData, "expectedVersion")),
        reason: field(formData, "reason"),
      },
    },
  );
  revalidatePath(`/internal/projects/${projectId}/documents`);
}

export async function submitDocumentReview(formData: FormData) {
  await lifecycle(formData, "submit-review");
}

export async function approveDocument(formData: FormData) {
  await lifecycle(formData, "approve");
}

export async function rejectDocument(formData: FormData) {
  await lifecycle(formData, "reject");
}

export async function downloadDocument(formData: FormData) {
  const signed = await writeApi<{ url: string }>(
    `/api/v1/document-versions/${field(formData, "versionId")}/download-url`,
  );
  redirect(signed.url);
}
