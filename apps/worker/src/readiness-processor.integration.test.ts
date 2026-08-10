import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseThreeAFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import {
  READINESS_CALCULATOR_VERSION,
  READINESS_RULE_VERSION,
} from "@mecoflow/readiness";
import { ReadinessProcessor } from "./readiness-processor.js";
import { ReadinessInputRepository } from "./readiness-input.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase(
  "Phase 7B readiness event and scheduled recalculation",
  () => {
    let database: PrismaClient;
    let processor: ReadinessProcessor;

    beforeAll(() => {
      database = createDatabaseClient(databaseUrl!);
      processor = new ReadinessProcessor(database);
    });

    afterAll(async () => {
      await disconnectDatabaseClient();
    });

    it("persists reproducible project/work-package batches, coalesces events, and schedules idempotently", async () => {
      const unique = randomUUID();
      const project = await database.project.create({
        data: {
          code: `P7B-${unique.slice(0, 8).toUpperCase()}`,
          createdByUserId: localFixtures.internalAdminUserId,
          name: `Phase 7B integration ${unique}`,
          organizationId: localFixtures.internalOrganizationId,
          plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-01T00:00:00.000Z"),
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        },
      });
      const workPackage = await database.workPackage.create({
        data: {
          code: `WP-${unique.slice(0, 8).toUpperCase()}`,
          name: "Readiness integration work package",
          plannedEndDate: new Date("2026-11-30T00:00:00.000Z"),
          plannedStartDate: new Date("2026-09-15T00:00:00.000Z"),
          projectId: project.id,
        },
      });
      const item = await database.item.create({
        data: {
          code: `P7B-${unique.slice(0, 8).toUpperCase()}`,
          createdByUserId: localFixtures.internalAdminUserId,
          itemCategoryId: phaseThreeAFixtures.demoItemCategoryId,
          name: "Readiness integration material",
          unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
        },
      });
      const bom = await database.bom.create({
        data: { projectId: project.id, workPackageId: workPackage.id },
      });
      const superseded = await database.bomRevision.create({
        data: {
          bomId: bom.id,
          createdByUserId: localFixtures.internalAdminUserId,
          lines: {
            create: {
              criticality: "CRITICAL",
              itemId: item.id,
              lineNumber: 1,
              quantity: "99",
              unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
            },
          },
          revisionNumber: 1,
          title: "Superseded readiness revision",
        },
        include: { lines: true },
      });
      await database.bomRevision.update({
        data: { status: "IN_REVIEW", version: { increment: 1 } },
        where: { id: superseded.id },
      });
      await database.bomRevision.update({
        data: {
          releasedAt: new Date("2026-07-20T00:00:00.000Z"),
          status: "RELEASED",
          version: { increment: 1 },
        },
        where: { id: superseded.id },
      });
      const current = await database.bomRevision.create({
        data: {
          bomId: bom.id,
          createdByUserId: localFixtures.internalAdminUserId,
          lines: {
            create: {
              criticality: "HIGH",
              itemId: item.id,
              lineNumber: 1,
              quantity: "2",
              unitOfMeasureId: phaseThreeAFixtures.eachUnitId,
            },
          },
          revisionNumber: 2,
          title: "Current readiness revision",
        },
        include: { lines: true },
      });
      await database.bomRevision.update({
        data: { status: "IN_REVIEW", version: { increment: 1 } },
        where: { id: current.id },
      });
      await database.$transaction([
        database.bomRevision.update({
          data: {
            status: "SUPERSEDED",
            supersededAt: new Date("2026-07-21T00:00:00.000Z"),
            version: { increment: 1 },
          },
          where: { id: superseded.id },
        }),
        database.bomRevision.update({
          data: {
            releasedAt: new Date("2026-07-21T00:00:00.000Z"),
            status: "RELEASED",
            version: { increment: 1 },
          },
          where: { id: current.id },
        }),
      ]);

      const source = await database.$transaction((transaction) =>
        new ReadinessInputRepository().load(transaction, project.id),
      );
      expect(source?.lines).toHaveLength(1);
      expect(source?.lines[0]).toMatchObject({
        bomLineId: current.lines[0]!.id,
        requiredQuantity: "2",
      });
      expect(
        source?.lines.some(
          ({ bomLineId }) => bomLineId === superseded.lines[0]!.id,
        ),
      ).toBe(false);

      const pending = await database.outboxEvent.count({
        where: {
          aggregateId: project.id,
          eventType: "READINESS_RECALCULATION_REQUESTED",
          status: "PENDING",
        },
      });
      expect(pending).toBeGreaterThan(1);
      const lockedAt = new Date();
      await database.outboxEvent.updateMany({
        data: { attempts: { increment: 1 }, lockedAt, status: "PROCESSING" },
        where: {
          aggregateId: project.id,
          eventType: "READINESS_RECALCULATION_REQUESTED",
          status: "PENDING",
        },
      });
      const processed = await processor.process({
        attempts: 1,
        lockedAt,
        projectId: project.id,
      });
      expect(processed.changed).toBe(true);
      const snapshots = await database.readinessSnapshot.findMany({
        orderBy: { scopeKey: "asc" },
        where: { batchId: processed.batchId! },
      });
      expect(snapshots).toHaveLength(2);
      expect(snapshots.map(({ scopeType }) => scopeType)).toEqual([
        "PROJECT",
        "WORK_PACKAGE",
      ]);
      expect(snapshots[0]).toMatchObject({
        calculatorVersion: READINESS_CALCULATOR_VERSION,
        lineCount: 1,
        materialProjectionVersion: "material-requirement-status-v1",
        ruleVersion: READINESS_RULE_VERSION,
        status: "RED",
        trigger: "EVENT",
      });
      expect(
        await database.outboxEvent.count({
          where: {
            aggregateId: project.id,
            eventType: "READINESS_RECALCULATION_REQUESTED",
            status: "PROCESSED",
          },
        }),
      ).toBeGreaterThan(1);
      expect(
        await database.auditEvent.count({
          where: {
            action: "READINESS_RECALCULATED",
            entityId: processed.batchId!,
          },
        }),
      ).toBe(1);

      const beforeSchedule = await database.readinessSnapshot.count({
        where: { projectId: project.id },
      });
      const sameDay = await processor.recalculateScheduled(
        project.id,
        new Date(
          `${snapshots[0]!.calculationDate.toISOString().slice(0, 10)}T12:00:00.000Z`,
        ),
      );
      expect(sameDay.changed).toBe(false);
      expect(
        await database.readinessSnapshot.count({
          where: { projectId: project.id },
        }),
      ).toBe(beforeSchedule);

      const nextDay = await processor.recalculateScheduled(
        project.id,
        new Date("2026-07-23T12:00:00.000Z"),
      );
      expect(nextDay.changed).toBe(true);
      expect(
        await database.readinessSnapshot.count({
          where: { batchId: nextDay.batchId! },
        }),
      ).toBe(2);

      const concurrent = await Promise.all([
        processor.recalculateScheduled(
          project.id,
          new Date("2026-07-24T12:00:00.000Z"),
        ),
        processor.recalculateScheduled(
          project.id,
          new Date("2026-07-24T12:00:00.000Z"),
        ),
      ]);
      expect(concurrent.filter(({ changed }) => changed)).toHaveLength(1);
      expect(
        await database.readinessSnapshot.count({
          where: {
            calculationDate: new Date("2026-07-24T00:00:00.000Z"),
            projectId: project.id,
            scopeType: "PROJECT",
          },
        }),
      ).toBe(1);

      await expect(
        database.readinessSnapshot.update({
          data: { score: 100 },
          where: { id: snapshots[0]!.id },
        }),
      ).rejects.toThrow();
    });
  },
);
