import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

export type ProjectState =
  "DRAFT" | "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface ProductCategory {
  active: boolean;
  code: string;
  description: string;
  id: string;
  name: string;
  version: number;
}

export interface ProjectListItem {
  code: string;
  id: string;
  name: string;
  plannedEndDate: string;
  plannedStartDate: string;
  productCategory: Pick<ProductCategory, "code" | "id" | "name">;
  state: ProjectState;
  updatedAt: string;
  version: number;
}

export interface ProjectOverview extends ProjectListItem {
  description: string;
  members: Array<{
    id: string;
    membership: {
      organization: {
        code: string;
        id: string;
        name: string;
        type: "INTERNAL" | "SUPPLIER";
      };
      user: { displayName: string; email: string; id: string };
    };
    role: "PROJECT_MANAGER" | "CONTRIBUTOR" | "VIEWER" | "SUPPLIER";
    status: "ACTIVE" | "INACTIVE";
    version: number;
  }>;
  milestones: Array<{
    code: string;
    description: string;
    id: string;
    name: string;
    targetDate: string;
    version: number;
  }>;
  organization: { code: string; id: string; name: string };
  transitions: Array<{
    actor: { displayName: string; id: string };
    id: string;
    occurredAt: string;
    reason: string;
    sourceState: ProjectState;
    targetState: ProjectState;
  }>;
  workPackages: Array<{
    code: string;
    description: string;
    id: string;
    milestoneId: string | null;
    name: string;
    plannedEndDate: string;
    plannedStartDate: string;
    version: number;
  }>;
}

export interface MemberCandidate {
  id: string;
  organization: {
    code: string;
    id: string;
    name: string;
    type: "INTERNAL" | "SUPPLIER";
  };
  user: { displayName: string; email: string; id: string };
}

async function response<T>(path: string): Promise<T> {
  const result = await apiRequest(path);
  if (result.status === 401) redirect("/login");
  if ([403, 404].includes(result.status)) redirect("/access-denied");
  if (!result.ok) throw new Error("Project data is unavailable");
  return (await result.json()) as T;
}

export const productCategories = async () =>
  (await response<{ data: ProductCategory[] }>("/api/v1/product-categories"))
    .data;

export const projectList = (query: URLSearchParams) =>
  response<{
    data: ProjectListItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }>(`/api/v1/projects?${query.toString()}`);

export const projectOverview = (projectId: string) =>
  response<ProjectOverview>(`/api/v1/projects/${projectId}`);

export const memberCandidates = async (projectId: string) =>
  (
    await response<{ data: MemberCandidate[] }>(
      `/api/v1/projects/${projectId}/member-candidates`,
    )
  ).data;

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: process.env.APP_TIMEZONE ?? "Asia/Jakarta",
  }).format(new Date(value));
}

export function dateInput(value: string): string {
  return value.slice(0, 10);
}
