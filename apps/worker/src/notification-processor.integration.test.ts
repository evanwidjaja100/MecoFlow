import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import {
  NotificationProcessor,
  type ClaimedNotificationEvent,
} from "./notification-processor.js";
import type { EmailMessage, EmailSender } from "./smtp-email-sender.js";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public";

class RecordingEmailSender implements EmailSender {
  readonly messages: EmailMessage[] = [];
  fail = false;

  send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
    return this.fail
      ? Promise.reject(new Error("SMTP_TEST_FAILURE"))
      : Promise.resolve();
  }
}

describe.sequential("Phase 8A notification outbox processing", () => {
  let database: PrismaClient;
  let email: RecordingEmailSender;
  let processor: NotificationProcessor;

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl);
    email = new RecordingEmailSender();
    processor = new NotificationProcessor(
      database,
      email,
      true,
      "http://localhost:3000",
    );
    await database.outboxEvent.updateMany({
      data: {
        lockedAt: null,
        processedAt: new Date(),
        status: "PROCESSED",
      },
      where: {
        eventType: {
          in: ["READINESS_ALERT_REQUESTED", "READINESS_REMINDER_REQUESTED"],
        },
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  async function fixture() {
    const unique = randomUUID();
    const project = await database.project.create({
      data: {
        code: `P8A-${unique.slice(0, 8).toUpperCase()}`,
        createdByUserId: localFixtures.internalAdminUserId,
        name: `Phase 8A integration ${unique}`,
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
        plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
    });
    const membership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: membership.id,
        projectId: project.id,
        role: "PROJECT_MANAGER",
      },
    });
    return project;
  }

  async function createSnapshot(
    projectId: string,
    trigger: "EVENT" | "SCHEDULED",
    id = randomUUID(),
  ) {
    return database.$transaction(async (transaction) => {
      const snapshot = await transaction.readinessSnapshot.create({
        data: {
          batchId: randomUUID(),
          blockerCount: 1,
          blockers: [],
          calculationDate: new Date("2026-07-27T00:00:00.000Z"),
          calculatorVersion: "readiness-calculator-v1",
          criticalLineCount: 1,
          explanation: { summary: "Notification integration" },
          id,
          inputHash: randomUUID()
            .replaceAll("-", "")
            .padEnd(64, "0")
            .slice(0, 64),
          inputs: { lines: [] },
          lineCount: 1,
          materialProjectionVersion: "material-requirement-status-v1",
          projectId,
          readyCriticalLineCount: 0,
          reasonCodes: ["ALLOCATION_SHORTFALL"],
          recommendedActions: [],
          ruleVersion: "readiness-rules-v1",
          scopeKey: "PROJECT",
          scopeType: "PROJECT",
          score: "60",
          status: "AMBER",
          trigger,
        },
      });
      await transaction.outboxEvent.updateMany({
        data: { availableAt: new Date(0) },
        where: {
          aggregateId: snapshot.id,
          aggregateType: "ReadinessSnapshot",
        },
      });
      return snapshot;
    });
  }

  async function claimRequired(): Promise<ClaimedNotificationEvent> {
    const claimed = await processor.claim();
    expect(claimed).not.toBeNull();
    return claimed!;
  }

  it("rolls back the event with its business transaction and commits both atomically", async () => {
    const project = await fixture();
    const rolledBackId = randomUUID();
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.readinessSnapshot.create({
          data: {
            batchId: randomUUID(),
            blockerCount: 0,
            blockers: [],
            calculationDate: new Date("2026-07-27T00:00:00.000Z"),
            calculatorVersion: "readiness-calculator-v1",
            criticalLineCount: 0,
            explanation: {},
            id: rolledBackId,
            inputHash: "a".repeat(64),
            inputs: {},
            lineCount: 0,
            materialProjectionVersion: "material-requirement-status-v1",
            projectId: project.id,
            readyCriticalLineCount: 0,
            reasonCodes: [],
            recommendedActions: [],
            ruleVersion: "readiness-rules-v1",
            scopeKey: "PROJECT",
            scopeType: "PROJECT",
            score: "100",
            status: "COMPLETE",
            trigger: "EVENT",
          },
        });
        throw new Error("FORCED_ROLLBACK");
      }),
    ).rejects.toThrow("FORCED_ROLLBACK");
    expect(
      await database.outboxEvent.count({
        where: { aggregateId: rolledBackId },
      }),
    ).toBe(0);

    const committed = await createSnapshot(project.id, "EVENT");
    const event = await database.outboxEvent.findFirst({
      where: {
        aggregateId: committed.id,
        eventType: "READINESS_ALERT_REQUESTED",
      },
    });
    expect(event?.status).toBe("PENDING");
    await database.outboxEvent.update({
      data: { processedAt: new Date(), status: "PROCESSED" },
      where: { id: event!.id },
    });
  });

  it("honors preferences and prevents duplicate in-app and email delivery on replay", async () => {
    const project = await fixture();
    const readonlyMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: readonlyMembership.id,
        projectId: project.id,
        role: "VIEWER",
      },
    });
    await database.notificationPreference.upsert({
      create: {
        emailEnabled: true,
        inAppEnabled: true,
        type: "READINESS_ALERT",
        userId: localFixtures.internalAdminUserId,
      },
      update: { emailEnabled: true, inAppEnabled: true },
      where: {
        userId_type: {
          type: "READINESS_ALERT",
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    await database.notificationPreference.upsert({
      create: {
        emailEnabled: true,
        inAppEnabled: true,
        type: "READINESS_ALERT",
        userId: localFixtures.internalReadonlyUserId,
      },
      update: { emailEnabled: true, inAppEnabled: true },
      where: {
        userId_type: {
          type: "READINESS_ALERT",
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    const snapshot = await createSnapshot(project.id, "EVENT");
    const claimed = await claimRequired();
    expect(claimed.eventId).toBe(
      (
        await database.outboxEvent.findFirstOrThrow({
          where: { aggregateId: snapshot.id },
        })
      ).id,
    );
    await processor.process(claimed);
    const event = await database.outboxEvent.findUniqueOrThrow({
      where: { id: claimed.eventId },
    });
    expect(event.status).toBe("PROCESSED");
    expect(
      await database.notification.count({
        where: { sourceOutboxEventId: event.id },
      }),
    ).toBe(2);
    expect(
      await database.notificationEmailDelivery.count({
        where: { notification: { sourceOutboxEventId: event.id } },
      }),
    ).toBe(2);
    const sentBeforeReplay = email.messages.length;

    const replayLock = new Date();
    await database.outboxEvent.update({
      data: {
        attempts: 1,
        lockedAt: replayLock,
        processedAt: null,
        status: "PROCESSING",
      },
      where: { id: event.id },
    });
    await processor.process({
      attempts: 1,
      eventId: event.id,
      lockedAt: replayLock,
    });
    expect(email.messages).toHaveLength(sentBeforeReplay);
    expect(
      await database.notification.count({
        where: { sourceOutboxEventId: event.id },
      }),
    ).toBe(2);
  });

  it("creates no recipient artifact when both preference channels are disabled", async () => {
    const project = await fixture();
    await database.notificationPreference.upsert({
      create: {
        emailEnabled: false,
        inAppEnabled: false,
        type: "READINESS_ALERT",
        userId: localFixtures.internalAdminUserId,
      },
      update: { emailEnabled: false, inAppEnabled: false },
      where: {
        userId_type: {
          type: "READINESS_ALERT",
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    const snapshot = await createSnapshot(project.id, "EVENT");
    const source = await database.outboxEvent.findFirstOrThrow({
      where: { aggregateId: snapshot.id },
    });
    const claimed = await claimRequired();
    expect(claimed.eventId).toBe(source.id);
    await processor.process(claimed);
    expect(
      await database.notification.count({
        where: { sourceOutboxEventId: source.id },
      }),
    ).toBe(0);
    expect(
      await database.outboxEvent.findUniqueOrThrow({
        where: { id: source.id },
      }),
    ).toMatchObject({ status: "PROCESSED" });
  });

  it("bounds retries, exposes dead letters, and creates scheduled reminder events", async () => {
    const project = await fixture();
    await database.notificationPreference.upsert({
      create: {
        emailEnabled: true,
        inAppEnabled: false,
        type: "READINESS_REMINDER",
        userId: localFixtures.internalAdminUserId,
      },
      update: { emailEnabled: true, inAppEnabled: false },
      where: {
        userId_type: {
          type: "READINESS_REMINDER",
          userId: localFixtures.internalAdminUserId,
        },
      },
    });
    const snapshot = await createSnapshot(project.id, "SCHEDULED");
    const source = await database.outboxEvent.findFirstOrThrow({
      where: { aggregateId: snapshot.id },
    });
    expect(source.eventType).toBe("READINESS_REMINDER_REQUESTED");
    email.fail = true;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await database.outboxEvent.update({
        data: { availableAt: new Date(0) },
        where: { id: source.id },
      });
      await database.notificationEmailDelivery.updateMany({
        data: { availableAt: new Date(0) },
        where: { notification: { sourceOutboxEventId: source.id } },
      });
      const claimed = await claimRequired();
      expect(claimed.eventId).toBe(source.id);
      await processor.process(claimed);
    }
    const deadLetter = await database.outboxEvent.findUniqueOrThrow({
      where: { id: source.id },
    });
    expect(deadLetter.attempts).toBe(5);
    expect(deadLetter.status).toBe("DEAD_LETTER");
    expect(deadLetter.deadLetteredAt).not.toBeNull();
    expect(
      await database.notificationEmailDelivery.findFirst({
        where: { notification: { sourceOutboxEventId: source.id } },
      }),
    ).toMatchObject({ attempts: 5, status: "DEAD_LETTER" });
    email.fail = false;
  });
});
