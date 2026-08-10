"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeApi } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createProductCategory(formData: FormData): Promise<void> {
  await writeApi("/api/v1/product-categories", {
    method: "POST",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      name: field(formData, "name"),
    },
  });
  revalidatePath("/internal/projects");
}

export async function updateProductCategory(formData: FormData): Promise<void> {
  const categoryId = field(formData, "categoryId");
  await writeApi(`/api/v1/product-categories/${categoryId}`, {
    method: "PATCH",
    body: {
      active: field(formData, "active") === "true",
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
    },
  });
  revalidatePath("/internal/projects");
}

export async function createProject(formData: FormData): Promise<void> {
  const project = await writeApi<{ id: string }>("/api/v1/projects", {
    method: "POST",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      name: field(formData, "name"),
      organizationId: field(formData, "organizationId"),
      plannedEndDate: field(formData, "plannedEndDate"),
      plannedStartDate: field(formData, "plannedStartDate"),
      productCategoryId: field(formData, "productCategoryId"),
    },
  });
  redirect(`/internal/projects/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await writeApi(`/api/v1/projects/${projectId}`, {
    method: "PATCH",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
      plannedEndDate: field(formData, "plannedEndDate"),
      plannedStartDate: field(formData, "plannedStartDate"),
      productCategoryId: field(formData, "productCategoryId"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function transitionProject(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await writeApi(`/api/v1/projects/${projectId}/transitions`, {
    method: "POST",
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      reason: field(formData, "reason"),
      targetState: field(formData, "targetState"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
  revalidatePath("/internal/projects");
}

export async function addProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const candidate = field(formData, "candidate").split("|");
  await writeApi(`/api/v1/projects/${projectId}/members`, {
    method: "POST",
    body: {
      membershipId: candidate[0],
      role: candidate[1] === "SUPPLIER" ? "SUPPLIER" : field(formData, "role"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateProjectMember(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const memberId = field(formData, "memberId");
  await writeApi(`/api/v1/projects/${projectId}/members/${memberId}`, {
    method: "PATCH",
    body: {
      expectedVersion: Number(field(formData, "expectedVersion")),
      role: field(formData, "role"),
      status: field(formData, "status"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  await writeApi(`/api/v1/projects/${projectId}/milestones`, {
    method: "POST",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      name: field(formData, "name"),
      targetDate: field(formData, "targetDate"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateMilestone(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await writeApi(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, {
    method: "PATCH",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      expectedVersion: Number(field(formData, "expectedVersion")),
      name: field(formData, "name"),
      targetDate: field(formData, "targetDate"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function createWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const milestoneId = field(formData, "milestoneId");
  await writeApi(`/api/v1/projects/${projectId}/work-packages`, {
    method: "POST",
    body: {
      code: field(formData, "code").toUpperCase(),
      description: field(formData, "description"),
      ...(milestoneId ? { milestoneId } : {}),
      name: field(formData, "name"),
      plannedEndDate: field(formData, "plannedEndDate"),
      plannedStartDate: field(formData, "plannedStartDate"),
    },
  });
  revalidatePath(`/internal/projects/${projectId}`);
}

export async function updateWorkPackage(formData: FormData): Promise<void> {
  const projectId = field(formData, "projectId");
  const workPackageId = field(formData, "workPackageId");
  const milestoneId = field(formData, "milestoneId");
  await writeApi(
    `/api/v1/projects/${projectId}/work-packages/${workPackageId}`,
    {
      method: "PATCH",
      body: {
        code: field(formData, "code").toUpperCase(),
        description: field(formData, "description"),
        expectedVersion: Number(field(formData, "expectedVersion")),
        ...(milestoneId ? { milestoneId } : {}),
        name: field(formData, "name"),
        plannedEndDate: field(formData, "plannedEndDate"),
        plannedStartDate: field(formData, "plannedStartDate"),
      },
    },
  );
  revalidatePath(`/internal/projects/${projectId}`);
}
