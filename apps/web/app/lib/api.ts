import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function writeApi<T = undefined>(
  path: string,
  {
    body,
    extraHeaders,
    method = "POST",
  }: {
    body?: unknown;
    extraHeaders?: Record<string, string>;
    method?: "PATCH" | "POST" | "PUT";
  } = {},
): Promise<T> {
  const csrf = (await cookies()).get("mecoflow_csrf")?.value;
  const result = await apiRequest(path, {
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      "x-csrf-token": csrf ?? "",
      ...extraHeaders,
    },
    method,
  });
  if (!result.ok) {
    const error = (await result.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(
      error?.error?.message ?? "The change could not be completed",
    );
  }
  if (result.status === 204) return undefined as T;
  return (await result.json()) as T;
}

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

const apiInternalBaseUrl = process.env.API_INTERNAL_URL ?? apiBaseUrl;

export async function apiRequest(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const cookieHeader = (await cookies()).toString();
  return fetch(`${apiInternalBaseUrl}${path}`, {
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
