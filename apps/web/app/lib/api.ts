import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface MeResponse {
  memberships: Array<{
    id: string;
    organization: {
      code: string;
      id: string;
      name: string;
      type: "INTERNAL" | "SUPPLIER";
    };
    permissions: string[];
    roles: string[];
  }>;
  shell: "INTERNAL" | "SUPPLIER";
  user: { displayName: string; email: string; id: string; locale: string };
}

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${apiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: { cookie: cookieHeader, ...init?.headers },
  });
}

export async function requireMe(
  shell?: "INTERNAL" | "SUPPLIER",
): Promise<MeResponse> {
  const response = await apiRequest("/api/v1/me");
  if (response.status === 401) redirect("/login");
  if (!response.ok) redirect("/access-denied");
  const me = (await response.json()) as MeResponse;
  if (shell && me.shell !== shell) redirect("/access-denied");
  return me;
}
