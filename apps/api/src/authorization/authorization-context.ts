import type { OrganizationKind } from "../identity/identity.types.js";

export type AuthorizationSource = "MEMBERSHIP_QUALIFIED" | "SYSTEM_PRINCIPAL";

export type SystemPrincipal =
  | "WORKER_BOM_IMPORT"
  | "WORKER_READINESS"
  | "WORKER_NOTIFICATION"
  | "MIGRATION_SEED";

export interface AuthorizationContext {
  readonly actorUserId: string | null;
  readonly actorMembershipId: string | null;
  readonly organizationId: string;
  readonly organizationType: OrganizationKind;
  readonly projectId?: string;
  readonly supplierOrganizationId?: string;
  readonly roles: readonly string[];
  readonly permissions: ReadonlySet<string>;
  readonly requiredPermission: string;
  readonly resource: { type: string; id?: string };
  readonly source: AuthorizationSource;
  readonly systemPrincipal?: SystemPrincipal;
  readonly correlationId: string;
  readonly requestId: string;
}

export interface AuthorizationContextSet {
  readonly contexts: readonly AuthorizationContext[];
}

export function isSystemPrincipalContext(
  context: AuthorizationContext,
): boolean {
  return context.source === "SYSTEM_PRINCIPAL";
}

export function requireHumanContext(
  context: AuthorizationContext,
): asserts context is AuthorizationContext & {
  actorUserId: string;
  actorMembershipId: string;
} {
  if (
    context.source !== "MEMBERSHIP_QUALIFIED" ||
    !context.actorUserId ||
    !context.actorMembershipId
  ) {
    throw new Error("Human membership context required");
  }
}
