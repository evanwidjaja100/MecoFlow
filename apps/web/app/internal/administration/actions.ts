"use server";

import { revalidatePath } from "next/cache";
import { writeApi } from "../../lib/api";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createOrganization(formData: FormData): Promise<void> {
  await writeApi("/api/v1/administration/organizations", {
    method: "POST",
    body: {
      code: field(formData, "code").trim().toUpperCase(),
      name: field(formData, "name").trim(),
      type: field(formData, "type"),
    },
  });
  revalidatePath("/internal/administration/organizations");
}

export async function createMembership(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  await writeApi(
    `/api/v1/administration/organizations/${organizationId}/memberships`,
    { method: "POST", body: { userId: field(formData, "userId") } },
  );
  revalidatePath("/internal/administration/memberships");
}

export async function assignRoles(formData: FormData): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await writeApi(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/roles`,
    {
      method: "PUT",
      body: {
        expectedVersion: Number(field(formData, "expectedVersion")),
        roleCodes: formData
          .getAll("roleCodes")
          .filter((value): value is string => typeof value === "string"),
      },
    },
  );
  revalidatePath("/internal/administration/roles");
}

export async function updateMembershipStatus(
  formData: FormData,
): Promise<void> {
  const organizationId = field(formData, "organizationId");
  const membershipId = field(formData, "membershipId");
  await writeApi(
    `/api/v1/administration/organizations/${organizationId}/memberships/${membershipId}/status`,
    {
      method: "PATCH",
      body: {
        expectedVersion: Number(field(formData, "expectedVersion")),
        status: field(formData, "status"),
      },
    },
  );
  revalidatePath("/internal/administration/memberships");
}
