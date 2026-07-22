"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function write<T>(
  path: string,
  method: "PATCH" | "POST",
  body: unknown,
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf ?? "",
    },
    method,
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The project change could not be completed",
    );
  }
  return (await result.json()) as T;
}

export async function createProductCategory(formData: FormData): Promise<void> {
  await write("/api/v1/product-categories", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
  });
  revalidatePath("/internal/projects");
}

export async function updateProductCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await write(`/api/v1/product-categories/${categoryId}`, "PATCH", {
    active: field(formData, "active") === "true",
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
  });
  revalidatePath("/internal/projects");
}

export async function createProject(formData: FormData): Promise<void> {
  const project = await write<{ id: string }>("/api/v1/projects", "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
    organizationId: field(formData, "organizationId"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
    productCategoryId: field(formData, "productCategoryId"),
  });
  redirect(`/internal/projects/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}`, "PATCH", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    expectedVersion: Number(field(formData, "expectedVersion")),
    name: field(formData, "name"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
    productCategoryId: field(formData, "productCategoryId"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function transitionProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}/transitions`, "POST", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    reason: field(formData, "reason"),
    targetState: field(formData, "targetState"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function addProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const candidate = field(formData, "candidate").split("|");
  await write(`/api/v1/projects/${projectId}/members`, "POST", {
    membershipId: candidate[0],
    role: candidate[1] === "SUPPLIER" ? "SUPPLIER" : field(formData, "role"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const memberId = field(formData, "memberId");
  await write(`/api/v1/projects/${projectId}/members/${memberId}`, "PATCH", {
    expectedVersion: Number(field(formData, "expectedVersion")),
    role: field(formData, "role"),
    status: field(formData, "status"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await write(`/api/v1/projects/${projectId}/milestones`, "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    name: field(formData, "name"),
    targetDate: field(formData, "targetDate"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await write(
    `/api/v1/projects/${projectId}/milestones/${milestoneId}`,
    "PATCH",
    {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
      targetDate: field(formData, "targetDate"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await write(`/api/v1/projects/${projectId}/work-packages`, "POST", {
    code: field(formData, "code").toUpperCase(),
    description: field(formData, "description"),
    ...(milestoneId ? { milestoneId } : {}),
    name: field(formData, "name"),
    plannedEndDate: field(formData, "plannedEndDate"),
    plannedStartDate: field(formData, "plannedStartDate"),
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const workPackageId = field(formData, "workPackageId");
  const milestoneId = field(formData, "milestoneId");
  await write(
    `/api/v1/projects/${projectId}/work-packages/${workPackageId}`,
    "PATCH",
    {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      ...(milestoneId ? { milestoneId } : {}),
      name: field(formData, "name"),
      plannedEndDate: field(formData, "plannedEndDate"),
      plannedStartDate: field(formData, "plannedStartDate"),
    },
  );
  revalidatePath(`/internal/projects/${projectId}`);
}
