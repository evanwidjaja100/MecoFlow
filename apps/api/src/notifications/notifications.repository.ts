import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  createDatabaseClient,
  Prisma,
  type NotificationType,
  type PrismaClient,
} from "@mecoflow/database";
import type { ServiceEnvironment } from "@mecoflow/config";
import { SERVICE_ENVIRONMENT } from "../tokens.js";
import type {
  AuthenticatedPrincipal,
  RequestContext,
} from "../identity/identity.types.js";

@Injectable()
export class NotificationsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private accessibleWhere(
    principal: AuthenticatedPrincipal,
  ): Prisma.NotificationWhereInput {
    const membershipIds = principal.memberships.map(({ id }) => id);
    return {
      userId: principal.user.id,
      visibleInApp: true,
      project: {
        members: {
          some: {
            membershipId: { in: membershipIds },
            status: "ACTIVE",
          },
        },
      },
    };
  }

  async list(
    principal: AuthenticatedPrincipal,
    input: { page: number; pageSize: number; unreadOnly: boolean },
  ) {
    const where: Prisma.NotificationWhereInput = {
      ...this.accessibleWhere(principal),
      ...(input.unreadOnly ? { readAt: null } : {}),
    };
    const [data, total, unread] = await this.database.$transaction([
      this.database.notification.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          actionUrl: true,
          createdAt: true,
          id: true,
          message: true,
          projectId: true,
          readAt: true,
          title: true,
          type: true,
        },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        where,
      }),
      this.database.notification.count({ where }),
      this.database.notification.count({
        where: { ...this.accessibleWhere(principal), readAt: null },
      }),
    ]);
    return { data, total, unread };
  }

  async markRead(principal: AuthenticatedPrincipal, notificationId: string) {
    const current = await this.database.notification.findFirst({
      select: { id: true, readAt: true },
      where: {
        id: notificationId,
        ...this.accessibleWhere(principal),
      },
    });
    if (!current) throw new NotFoundException("Resource not found");
    if (current.readAt) return current;
    return this.database.notification.update({
      data: { readAt: new Date() },
      select: { id: true, readAt: true },
      where: { id: current.id },
    });
  }

  async preferences(userId: string) {
    const saved = await this.database.notificationPreference.findMany({
      orderBy: { type: "asc" },
      select: {
        emailEnabled: true,
        inAppEnabled: true,
        type: true,
        version: true,
      },
      where: { userId },
    });
    const byType = new Map(
      saved.map((preference) => [preference.type, preference]),
    );
    return (["READINESS_ALERT", "READINESS_REMINDER"] as const).map(
      (type) =>
        byType.get(type) ?? {
          emailEnabled: false,
          inAppEnabled: true,
          type,
          version: 1,
        },
    );
  }

  async updatePreference(input: {
    actorUserId: string;
    context: RequestContext;
    emailEnabled: boolean;
    expectedVersion: number;
    inAppEnabled: boolean;
    organizationId: string | null;
    type: NotificationType;
  }) {
    return this.database.$transaction(async (transaction) => {
      if ((input as any).actorMembershipId) {
        const __actorMembership = await transaction.membership.findFirst({
          where: { id: (input as any).actorMembershipId, status: "ACTIVE" },
        });
        if (!__actorMembership)
          throw new ConflictException("Concurrent modification");
      }
      await transaction.$queryRaw`
        SELECT id
        FROM user_profiles
        WHERE id = ${input.actorUserId as string}::uuid
        FOR UPDATE
      `;
      const current = await transaction.notificationPreference.findUnique({
        where: {
          userId_type: {
            type: input.type,
            userId: input.actorUserId as string,
          },
        },
      });
      if (!current) {
        if (input.expectedVersion !== 1)
          throw new ConflictException("Concurrent modification");
        const created = await transaction.notificationPreference.create({
          data: {
            emailEnabled: input.emailEnabled,
            inAppEnabled: input.inAppEnabled,
            type: input.type,
            userId: input.actorUserId as string,
          },
        });
        await this.auditPreference(transaction, input, created.id);
        return created;
      }
      const updated = await transaction.notificationPreference.updateMany({
        data: {
          emailEnabled: input.emailEnabled,
          inAppEnabled: input.inAppEnabled,
          version: { increment: 1 },
        },
        where: {
          id: current.id,
          version: input.expectedVersion,
        },
      });
      if (updated.count !== 1)
        throw new ConflictException("Concurrent modification");
      await this.auditPreference(transaction, input, current.id);
      return transaction.notificationPreference.findUniqueOrThrow({
        where: { id: current.id },
      });
    });
  }

  private auditPreference(
    transaction: Prisma.TransactionClient,
    input: {
      actorUserId: string;
      context: RequestContext;
      emailEnabled: boolean;
      inAppEnabled: boolean;
      organizationId: string | null;
      type: NotificationType;
    },
    entityId: string,
  ) {
    return (transaction.auditEvent.create as any)({
      data: {
        action: "NOTIFICATION_PREFERENCE_UPDATED",
        actorUserId: input.actorUserId as string,
        changes: {
          emailEnabled: input.emailEnabled,
          inAppEnabled: input.inAppEnabled,
          type: input.type,
        },
        correlationId: input.context.correlationId,
        entityId,
        entityType: "NotificationPreference",
        organizationId: input.organizationId,
        outcome: "SUCCESS",
        requestId: input.context.requestId,
      },
    });
  }
}
