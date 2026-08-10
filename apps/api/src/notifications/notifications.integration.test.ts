import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { NotificationsRepository } from "./notifications.repository.js";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://mecoflow_local:local_only_change_me@127.0.0.1:5432/mecoflow?schema=public";

describe.sequential(
  "Phase 8A notification authorization and preferences",
  () => {
    let database: PrismaClient;
    let repository: NotificationsRepository;

    beforeAll(() => {
      database = createDatabaseClient(databaseUrl);
      repository = new NotificationsRepository({
        DATABASE_URL: databaseUrl,
      } as ServiceEnvironment);
    });

    afterAll(async () => {
      await disconnectDatabaseClient();
    });

    it("keeps the inbox own-user scoped and rechecks current project assignment", async () => {
      const unique = randomUUID();
      const membership = await database.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            organizationId: localFixtures.internalOrganizationId,
            userId: localFixtures.internalAdminUserId,
          },
        },
      });
      const project = await database.project.create({
        data: {
          code: `P8A-AUTH-${unique.slice(0, 8).toUpperCase()}`,
          createdByUserId: localFixtures.internalAdminUserId,
          name: `Notification authorization ${unique}`,
          organizationId: localFixtures.internalOrganizationId,
          plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        },
      });
      const member = await database.projectMember.create({
        data: {
          addedByUserId: localFixtures.internalAdminUserId,
          membershipId: membership.id,
          projectId: project.id,
          role: "PROJECT_MANAGER",
        },
      });
      const event = await database.outboxEvent.create({
        data: {
          aggregateId: randomUUID(),
          aggregateType: "ReadinessSnapshot",
          eventType: "READINESS_ALERT_REQUESTED",
          payload: { projectId: project.id },
          status: "PROCESSED",
        },
      });
      const notification = await database.notification.create({
        data: {
          actionUrl: `/internal/projects/${project.id}/readiness`,
          message: "Authorized notification",
          projectId: project.id,
          sourceOutboxEventId: event.id,
          title: "Readiness status update",
          type: "READINESS_ALERT",
          userId: localFixtures.internalAdminUserId,
        },
      });
      const principal = {
        memberships: [
          {
            id: membership.id,
            organization: {
              id: localFixtures.internalOrganizationId,
              type: "INTERNAL",
            },
          },
        ],
        user: { id: localFixtures.internalAdminUserId },
      } as unknown as AuthenticatedPrincipal;
      const visibleNotifications = (
        await repository.list(principal, {
          page: 1,
          pageSize: 20,
          unreadOnly: false,
        })
      ).data;
      expect(visibleNotifications).toContainEqual(
        expect.objectContaining({ id: notification.id }),
      );

      const otherPrincipal = {
        ...principal,
        user: { id: localFixtures.internalReadonlyUserId },
      } as AuthenticatedPrincipal;
      await expect(
        repository.markRead(otherPrincipal, notification.id),
      ).rejects.toMatchObject({ status: 404 });

      await database.projectMember.update({
        data: { status: "INACTIVE", version: { increment: 1 } },
        where: { id: member.id },
      });
      expect(
        (
          await repository.list(principal, {
            page: 1,
            pageSize: 20,
            unreadOnly: false,
          })
        ).data.some(({ id }) => id === notification.id),
      ).toBe(false);
    });

    it("expected-version checks and audits own-user preferences", async () => {
      const unique = randomUUID();
      const user = await database.userProfile.create({
        data: {
          displayName: "Phase 8A preference user",
          email: `phase8a-${unique}@example.test`,
          issuer: localFixtures.mockIssuer,
          subject: `phase8a-${unique}`,
        },
      });
      await database.membership.create({
        data: {
          organizationId: localFixtures.internalOrganizationId,
          userId: user.id,
        },
      });
      const context = {
        correlationId: `phase8a:${randomUUID()}`,
        requestId: `phase8a:${randomUUID()}`,
      };
      const created = await repository.updatePreference({
        actorUserId: user.id,
        context,
        emailEnabled: true,
        expectedVersion: 1,
        inAppEnabled: true,
        organizationId: localFixtures.internalOrganizationId,
        type: "READINESS_REMINDER",
      });
      expect(created).toMatchObject({
        emailEnabled: true,
        inAppEnabled: true,
        version: 1,
      });
      await expect(
        repository.updatePreference({
          actorUserId: user.id,
          context,
          emailEnabled: false,
          expectedVersion: 99,
          inAppEnabled: true,
          organizationId: localFixtures.internalOrganizationId,
          type: "READINESS_REMINDER",
        }),
      ).rejects.toMatchObject({ status: 409 });
      expect(
        await database.auditEvent.count({
          where: {
            action: "NOTIFICATION_PREFERENCE_UPDATED",
            correlationId: context.correlationId,
          },
        }),
      ).toBe(1);
    });
  },
);
