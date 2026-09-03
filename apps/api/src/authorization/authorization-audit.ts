import type { Prisma } from "@mecoflow/database";
import type { AuthorizationContext } from "./authorization-context.js";

export function toAuditData(
  ctx: AuthorizationContext,
  base: {
    action: string;
    entityType: string;
    entityId: string;
    organizationId?: string | null;
    outcome?: string;
    changes?: Prisma.InputJsonValue;
  },
): Prisma.AuditEventCreateInput {
  return {
    action: base.action,
    actorMembershipId: ctx.actorMembershipId ?? null,
    actorUserId: ctx.actorUserId ?? null,
    changes: (base.changes ?? {}) as Prisma.InputJsonValue,
    correlationId: ctx.correlationId,
    entityId: base.entityId,
    entityType: base.entityType,
    organizationId: base.organizationId ?? ctx.organizationId,
    outcome: base.outcome ?? "SUCCESS",
    requestId: ctx.requestId,
    systemPrincipal: ctx.systemPrincipal ?? null,
  } as unknown as Prisma.AuditEventCreateInput;
}

export function toAuditCreateData(
  ctx: AuthorizationContext,
  base: {
    action: string;
    entityType: string;
    entityId: string;
    organizationId?: string | null;
    outcome?: string;
    changes?: Prisma.InputJsonValue;
  },
) {
  return {
    action: base.action,
    actorMembershipId: ctx.actorMembershipId,
    actorUserId: ctx.actorUserId,
    changes: base.changes ?? {},
    correlationId: ctx.correlationId,
    entityId: base.entityId,
    entityType: base.entityType,
    organizationId: base.organizationId ?? ctx.organizationId,
    outcome: base.outcome ?? "SUCCESS",
    requestId: ctx.requestId,
    systemPrincipal: ctx.systemPrincipal ?? null,
  };
}
