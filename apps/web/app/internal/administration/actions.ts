"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { apiRequest } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function write(
  path: string,
  method: "PATCH" | "POST" | "PUT",
  body: unknown,
): Promise<void> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const response = await apiRequest(path, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", "x-csrf-token": csrf ?? "" },
    method,
  });
  if (!response.ok)
    throw new Error("The authorized change could not be completed");
}

export async function createOrganization(formData: FormData): Promise<void> {
  await write("/api/v1/administration/organizations", "POST", {
    code: field(formData, "code").trim().toUpperCase(),
    name: field(formData, "name").trim(),
    type: field(formData, "type"),
  });
  revalidatePath("/internal/administration/organizations");
}

export async function createMembership(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships`,
    "POST",
    {
      userId: field(formData, "userId"),
    },
  );
  revalidatePath("/internal/administration/memberships");
}

export async function assignRoles(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/roles`,
    "PUT",
    {
      expectedVersion: Number(field(formData, "expectedVersion")),
      roleCodes: formData
        .getAll("roleCodes")
        .filter((value): value is string => typeof value === "string"),
    },
  );
  revalidatePath("/internal/administration/roles");
}

export async function updateMembershipStatus(
  formData: FormData,
): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await write(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/status`,
    "PATCH",
    {
      expectedVersion: Number(field(formData, "expectedVersion")),
      status: field(formData, "status"),
    },
  );
  revalidatePath("/internal/administration/memberships");
}
