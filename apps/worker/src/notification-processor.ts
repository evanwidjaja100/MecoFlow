import type { NotificationType, PrismaClient } from "@mecoflow/database";
import type { EmailSender } from "./smtp-email-sender.js";

const MAX_ATTEMPTS = 5;
const LOCK_TIMEOUT_MS = 5 * 60_000;

export interface ClaimedNotificationEvent {
  attempts: number;
  eventId: string;
  lockedAt: Date;
}

export interface NotificationProcessingResult {
  created: number;
  deadLettered: boolean;
  eventId: string;
  sent: number;
  skipped: number;
}

function errorCode(error: unknown): string {
  if (error instanceof Error && /^SMTP_[A-Z0-9_]+$/.test(error.message))
    return error.message.slice(0, 100);
  return "NOTIFICATION_DELIVERY_FAILED";
}

export class NotificationProcessor {
  constructor(
    private readonly database: PrismaClient,
    private readonly emailSender: EmailSender | null,
    private readonly smtpEnabled: boolean,
    private readonly webBaseUrl: string,
  ) {}

  async claim(): Promise<ClaimedNotificationEvent | null> {
    return this.database.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<
        Array<{ attempts: number; eventId: string }>
      >`
        SELECT attempts, id AS "eventId"
        FROM outbox_events
        WHERE "eventType" IN (
          'READINESS_ALERT_REQUESTED',
          'READINESS_REMINDER_REQUESTED'
        )
          AND (
            ("status" = 'PENDING' AND "availableAt" <= CURRENT_TIMESTAMP AND attempts < ${MAX_ATTEMPTS}) OR
            ("status" = 'PROCESSING' AND "lockedAt" < CURRENT_TIMESTAMP - INTERVAL '5 minutes')
          )
        ORDER BY "createdAt", id
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const candidate = rows[0];
      if (!candidate) return null;
      const lockedAt = new Date();
      const claimed = await transaction.outboxEvent.updateMany({
        data: {
          attempts: { increment: 1 },
          deadLetteredAt: null,
          lastErrorCode: null,
          lockedAt,
          status: "PROCESSING",
        },
        where: {
          id: candidate.eventId,
          OR: [
            { attempts: { lt: MAX_ATTEMPTS }, status: "PENDING" },
            {
              lockedAt: { lt: new Date(Date.now() - LOCK_TIMEOUT_MS) },
              status: "PROCESSING",
            },
          ],
        },
      });
      if (claimed.count !== 1) return null;
      return {
        attempts: candidate.attempts + 1,
        eventId: candidate.eventId,
        lockedAt,
      };
    });
  }

  async process(
    event: ClaimedNotificationEvent,
  ): Promise<NotificationProcessingResult> {
    try {
      const setup = await this.prepare(event);
      let sent = 0;
      let skipped = setup.skipped;
      for (const deliveryId of setup.deliveryIds) {
        const result = await this.deliver(deliveryId);
        if (result === "SENT") sent += 1;
        if (result === "SKIPPED") skipped += 1;
      }
      const terminal = await this.finish(event);
      return {
        created: setup.created,
        deadLettered: terminal === "DEAD_LETTER",
        eventId: event.eventId,
        sent,
        skipped,
      };
    } catch (error) {
      await this.failEvent(event, error);
      throw error;
    }
  }

  async observability() {
    const [outbox, email] = await Promise.all([
      this.database.outboxEvent.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          eventType: {
            in: ["READINESS_ALERT_REQUESTED", "READINESS_REMINDER_REQUESTED"],
          },
          status: { in: ["PENDING", "PROCESSING", "DEAD_LETTER"] },
        },
      }),
      this.database.notificationEmailDelivery.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: {
          status: { in: ["PENDING", "PROCESSING", "DEAD_LETTER"] },
        },
      }),
    ]);
    return { email, outbox };
  }

  private async prepare(event: ClaimedNotificationEvent) {
    return this.database.$transaction(async (transaction) => {
      const source = await transaction.outboxEvent.findUnique({
        select: {
          aggregateId: true,
          eventType: true,
          id: true,
          lockedAt: true,
          status: true,
        },
        where: { id: event.eventId },
      });
      if (
        !source ||
        source.status !== "PROCESSING" ||
        source.lockedAt?.getTime() !== event.lockedAt.getTime()
      )
        throw new Error("NOTIFICATION_EVENT_NOT_CLAIMED");
      const snapshot = await transaction.readinessSnapshot.findUnique({
        select: {
          id: true,
          project: {
            select: {
              code: true,
              id: true,
              members: {
                select: {
                  membership: {
                    select: {
                      user: {
                        select: {
                          email: true,
                          id: true,
                          notificationPreferences: {
                            select: {
                              emailEnabled: true,
                              inAppEnabled: true,
                              type: true,
                            },
                          },
                          status: true,
                        },
                      },
                    },
                  },
                },
                where: {
                  membership: {
                    organization: { active: true, type: "INTERNAL" },
                    status: "ACTIVE",
                    user: { status: "ACTIVE" },
                  },
                  status: "ACTIVE",
                },
              },
              name: true,
            },
          },
          score: true,
          status: true,
        },
        where: { id: source.aggregateId },
      });
      if (!snapshot) throw new Error("NOTIFICATION_SOURCE_MISSING");
      const type: NotificationType =
        source.eventType === "READINESS_REMINDER_REQUESTED"
          ? "READINESS_REMINDER"
          : "READINESS_ALERT";
      const recipients = new Map<
        string,
        {
          email: string;
          emailEnabled: boolean;
          inAppEnabled: boolean;
        }
      >();
      for (const member of snapshot.project.members) {
        const user = member.membership.user;
        const preference = user.notificationPreferences.find(
          (candidate) => candidate.type === type,
        );
        recipients.set(user.id, {
          email: user.email,
          emailEnabled: preference?.emailEnabled ?? false,
          inAppEnabled: preference?.inAppEnabled ?? true,
        });
      }

      const eligible = [...recipients].filter(
        ([, preference]) => preference.inAppEnabled || preference.emailEnabled,
      );
      const created = await transaction.notification.createMany({
        data: eligible.map(([userId, preference]) => ({
          actionUrl: `/internal/projects/${snapshot.project.id}/readiness`,
          message:
            type === "READINESS_REMINDER"
              ? `${snapshot.project.code} readiness is ${snapshot.status} at ${snapshot.score.toString()}%.`
              : `${snapshot.project.code} readiness changed to ${snapshot.status} at ${snapshot.score.toString()}%.`,
          projectId: snapshot.project.id,
          sourceOutboxEventId: source.id,
          title:
            type === "READINESS_REMINDER"
              ? "Daily readiness reminder"
              : "Readiness status update",
          type,
          userId,
          visibleInApp: preference.inAppEnabled,
        })),
        skipDuplicates: true,
      });
      const notifications = await transaction.notification.findMany({
        select: { id: true, userId: true },
        where: {
          sourceOutboxEventId: source.id,
          userId: { in: eligible.map(([userId]) => userId) },
        },
      });
      const notificationByUser = new Map(
        notifications.map((notification) => [
          notification.userId,
          notification,
        ]),
      );
      const emailRecipients = eligible.filter(
        ([userId, preference]) =>
          preference.emailEnabled && notificationByUser.has(userId),
      );
      await transaction.notificationEmailDelivery.createMany({
        data: emailRecipients.map(([userId, preference]) => {
          const notification = notificationByUser.get(userId)!;
          return {
            emailAddress: preference.email,
            lastErrorCode: this.smtpEnabled ? null : "SMTP_DISABLED",
            messageId: `notification-${notification.id}@mecoflow.local`,
            notificationId: notification.id,
            status: this.smtpEnabled
              ? ("PENDING" as const)
              : ("SKIPPED" as const),
          };
        }),
        skipDuplicates: true,
      });
      const deliveries = await transaction.notificationEmailDelivery.findMany({
        select: { id: true, status: true },
        where: {
          notificationId: {
            in: emailRecipients.map(
              ([userId]) => notificationByUser.get(userId)!.id,
            ),
          },
        },
      });
      return {
        created: created.count,
        deliveryIds: deliveries
          .filter(({ status }) => status !== "SKIPPED")
          .map(({ id }) => id),
        skipped: deliveries.filter(({ status }) => status === "SKIPPED").length,
      };
    });
  }

  private async deliver(
    deliveryId: string,
  ): Promise<"PENDING" | "SENT" | "SKIPPED"> {
    const delivery = await this.database.$transaction(async (transaction) => {
      const current = await transaction.notificationEmailDelivery.findUnique({
        include: { notification: true },
        where: { id: deliveryId },
      });
      if (
        !current ||
        ["SENT", "SKIPPED", "DEAD_LETTER"].includes(current.status)
      )
        return null;
      if (current.status === "PROCESSING") {
        await transaction.notificationEmailDelivery.update({
          data: {
            deadLetteredAt: new Date(),
            lastErrorCode: "AMBIGUOUS_DELIVERY_STATE",
            status: "DEAD_LETTER",
          },
          where: { id: current.id },
        });
        return null;
      }
      if (current.availableAt > new Date()) return null;
      return transaction.notificationEmailDelivery.update({
        data: {
          attempts: { increment: 1 },
          lastErrorCode: null,
          lockedAt: new Date(),
          status: "PROCESSING",
        },
        include: { notification: true },
        where: { id: current.id },
      });
    });
    if (!delivery) return "PENDING";
    if (!this.emailSender) {
      await this.database.notificationEmailDelivery.update({
        data: { lastErrorCode: "SMTP_DISABLED", status: "SKIPPED" },
        where: { id: delivery.id },
      });
      return "SKIPPED";
    }
    try {
      await this.emailSender.send({
        messageId: delivery.messageId,
        subject: delivery.notification.title,
        text: `${delivery.notification.message}\n\n${this.webBaseUrl}${delivery.notification.actionUrl}`,
        to: delivery.emailAddress,
      });
      await this.database.notificationEmailDelivery.update({
        data: {
          lastErrorCode: null,
          sentAt: new Date(),
          status: "SENT",
        },
        where: { id: delivery.id, status: "PROCESSING" },
      });
      return "SENT";
    } catch (error) {
      const terminal = delivery.attempts >= MAX_ATTEMPTS;
      await this.database.notificationEmailDelivery.update({
        data: terminal
          ? {
              deadLetteredAt: new Date(),
              lastErrorCode: errorCode(error),
              status: "DEAD_LETTER",
            }
          : {
              availableAt: new Date(
                Date.now() + 2 ** delivery.attempts * 1_000,
              ),
              lastErrorCode: errorCode(error),
              lockedAt: null,
              status: "PENDING",
            },
        where: { id: delivery.id, status: "PROCESSING" },
      });
      return "PENDING";
    }
  }

  private async finish(
    event: ClaimedNotificationEvent,
  ): Promise<"DEAD_LETTER" | "PENDING" | "PROCESSED"> {
    const deliveries = await this.database.notificationEmailDelivery.findMany({
      select: { availableAt: true, status: true },
      where: {
        notification: { sourceOutboxEventId: event.eventId },
      },
    });
    if (deliveries.some(({ status }) => status === "DEAD_LETTER")) {
      await this.database.outboxEvent.updateMany({
        data: {
          deadLetteredAt: new Date(),
          lastErrorCode: "EMAIL_DELIVERY_DEAD_LETTER",
          lockedAt: null,
          status: "DEAD_LETTER",
        },
        where: {
          id: event.eventId,
          lockedAt: event.lockedAt,
          status: "PROCESSING",
        },
      });
      return "DEAD_LETTER";
    }
    const pending = deliveries.filter(({ status }) =>
      ["PENDING", "PROCESSING"].includes(status),
    );
    if (pending.length > 0) {
      const next = pending.reduce(
        (earliest, delivery) =>
          delivery.availableAt < earliest ? delivery.availableAt : earliest,
        pending[0]!.availableAt,
      );
      await this.database.outboxEvent.updateMany({
        data: {
          availableAt: next,
          lastErrorCode: "EMAIL_DELIVERY_RETRY",
          lockedAt: null,
          status: "PENDING",
        },
        where: {
          id: event.eventId,
          lockedAt: event.lockedAt,
          status: "PROCESSING",
        },
      });
      return "PENDING";
    }
    await this.database.outboxEvent.updateMany({
      data: {
        lastErrorCode: null,
        lockedAt: null,
        processedAt: new Date(),
        status: "PROCESSED",
      },
      where: {
        id: event.eventId,
        lockedAt: event.lockedAt,
        status: "PROCESSING",
      },
    });
    return "PROCESSED";
  }

  private async failEvent(event: ClaimedNotificationEvent, error: unknown) {
    const terminal = event.attempts >= MAX_ATTEMPTS;
    await this.database.outboxEvent.updateMany({
      data: terminal
        ? {
            deadLetteredAt: new Date(),
            lastErrorCode: errorCode(error),
            lockedAt: null,
            status: "DEAD_LETTER",
          }
        : {
            availableAt: new Date(Date.now() + 2 ** event.attempts * 1_000),
            lastErrorCode: errorCode(error),
            lockedAt: null,
            status: "PENDING",
          },
      where: {
        id: event.eventId,
        lockedAt: event.lockedAt,
        status: "PROCESSING",
      },
    });
  }
}
