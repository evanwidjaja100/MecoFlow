"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write<T>(path: string, body?: unknown): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      "x-csrf-token": csrf ?? "",
    },
    method: "POST",
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(error?.error?.message ?? "Document operation failed");
  }
  return (await result.json()) as T;
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
  await write(`/api/v1/document-versions/${session.versionId}/complete`, {
    expectedVersion: session.version,
  });
}

export async function uploadDocument(formData: FormData) {
  const projectId = field(formData, "projectId");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 10 * 1024 * 1024)
    throw new Error("Select a file up to 10 MiB");
  const body = Buffer.from(await file.arrayBuffer());
  const initiated = await write<{
    document: { id: string };
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/projects/${projectId}/documents/uploads`, {
    byteSize: file.size,
    category: field(formData, "category"),
    description: field(formData, "description"),
    fileName: file.name,
    mimeType: file.type,
    sha256: createHash("sha256").update(body).digest("hex"),
    title: field(formData, "title"),
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
  const initiated = await write<{
    upload: {
      headers: Record<string, string>;
      url: string;
      version: number;
      versionId: string;
    };
  }>(`/api/v1/documents/${field(formData, "documentId")}/supersede`, {
    byteSize: file.size,
    expectedDocumentVersion: Number(field(formData, "expectedDocumentVersion")),
    fileName: file.name,
    mimeType: file.type,
    reason: field(formData, "reason"),
    sha256: createHash("sha256").update(body).digest("hex"),
  });
  await upload(file, initiated.upload);
  revalidatePath(`/internal/projects/${projectId}/documents`);
}

async function lifecycle(
  formData: FormData,
  command: "approve" | "reject" | "submit-review",
) {
  const projectId = field(formData, "projectId");
  await write(
    `/api/v1/document-versions/${field(formData, "versionId")}/${command}`,
    {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
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
  const signed = await write<{ url: string }>(
    `/api/v1/document-versions/${field(formData, "versionId")}/download-url`,
  );
  redirect(signed.url);
}
