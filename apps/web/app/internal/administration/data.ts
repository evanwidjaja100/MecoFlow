import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export interface Organization {
  active: boolean;
  code: string;
  id: string;
  name: string;
  type: "INTERNAL" | "SUPPLIER";
}

export interface Membership {
  id: string;
  organizationId: string;
  roles: Array<{ roleCode: string }>;
  status: "ACTIVE" | "INACTIVE";
  user: {
    displayName: string;
    email: string;
    id: string;
    status: "ACTIVE" | "INACTIVE";
  };
  version: number;
}

async function data<T>(path: string): Promise<T[]> {
  const response = await apiRequest(path);
  if (response.status === 403) redirect("/access-denied");
  if (!response.ok) throw new Error("Administration data is unavailable");
  return ((await response.json()) as { data: T[] }).data;
}

export const organizations = () =>
  data<Organization>("/api/v1/administration/organizations");
export const roles = () =>
  data<{ code: string; name: string; scope: string }>(
    "/api/v1/administration/roles",
  );
export const users = () =>
  data<{ displayName: string; email: string; id: string; status: string }>(
    "/api/v1/administration/users",
  );
export const memberships = (organizationId: string) =>
  data<Membership>(
    `/api/v1/administration/organizations/${organizationId}/memberships`,
  );
