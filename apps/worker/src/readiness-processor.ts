import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@mecoflow/database";
import {
  calculateReadiness,
  READINESS_CALCULATOR_VERSION,
  READINESS_RULE_VERSION,
  type ReadinessCalculation,
} from "@mecoflow/readiness";
import {
  ReadinessInputRepository,
  type ReadinessProjectSource,
  type ReadinessSourceLine,
} from "./readiness-input.repository.js";

export interface ClaimedReadinessEvent {
  attempts: number;
  lockedAt: Date;
  projectId: string;
}

interface RecalculationResult {
  batchId: string | null;
  changed: boolean;
  projectId: string;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function scopeInput(
  source: ReadinessProjectSource,
  calculationDate: string,
  scopeType: "PROJECT" | "WORK_PACKAGE",
  scopeId: string,
  lines: ReadinessSourceLine[],
) {
  return {
    calculationDate,
    lines,
    scopeId,
    scopeType,
    unresolvedProjectNcrCount:
      scopeType === "PROJECT" ? source.unresolvedProjectNcrCount : 0,
  } as const;
}

export class ReadinessProcessor {
  constructor(
    private readonly database: PrismaClient,
    private readonly inputs = new ReadinessInputRepository(),
  ) {}

  async claim(): Promise<ClaimedReadinessEvent | null> {
    return this.database.$transaction(async (transaction) => {
      const candidates = await transaction.$queryRaw<
        Array<{ attempts: number; projectId: string }>
      >`
        SELECT attempts, "aggregateId" AS "projectId"
        FROM outbox_events
        WHERE "eventType" = 'READINESS_RECALCULATION_REQUESTED'
          AND (
            ("status" = 'PENDING' AND "availableAt" <= CURRENT_TIMESTAMP AND attempts < 5) OR
            ("status" = 'PROCESSING' AND "lockedAt" < CURRENT_TIMESTAMP - INTERVAL '5 minutes')
          )
        ORDER BY "createdAt"
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const candidate = candidates[0];
      if (!candidate) return null;
      const lockedAt = new Date();
      await transaction.outboxEvent.updateMany({
        data: {
          attempts: { increment: 1 },
          lastErrorCode: null,
          lockedAt,
          status: "PROCESSING",
        },
        where: {
          aggregateId: candidate.projectId,
          eventType: "READINESS_RECALCULATION_REQUESTED",
          OR: [
            { attempts: { lt: 5 }, status: "PENDING" },
            {
              lockedAt: { lt: new Date(Date.now() - 5 * 60_000) },
              status: "PROCESSING",
            },
          ],
        },
      });
      return {
        attempts: candidate.attempts + 1,
        lockedAt,
        projectId: candidate.projectId,
      };
    });
  }

  async process(event: ClaimedReadinessEvent): Promise<RecalculationResult> {
    try {
      return await this.recalculate(
        event.projectId,
        "EVENT",
        new Date(),
        event,
      );
    } catch (error) {
      await this.fail(event, error);
      throw error;
    }
  }

  recalculateScheduled(
    projectId: string,
    now = new Date(),
  ): Promise<RecalculationResult> {
    return this.recalculate(projectId, "SCHEDULED", now, null);
  }

  async scheduledProjectIds(): Promise<string[]> {
    const projects = await this.database.project.findMany({
      orderBy: { id: "asc" },
      select: { id: true },
      where: {
        boms: { some: { revisions: { some: { status: "RELEASED" } } } },
      },
    });
    return projects.map(({ id }) => id);
  }

  private async recalculate(
    projectId: string,
    trigger: "EVENT" | "SCHEDULED",
    now: Date,
    event: ClaimedReadinessEvent | null,
  ): Promise<RecalculationResult> {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.recalculateOnce(projectId, trigger, now, event);
      } catch (error) {
        const retryable =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";
        if (!retryable || attempt === 3) throw error;
      }
    }
    throw new Error("Readiness recalculation retry exhausted");
  }

  private async recalculateOnce(
    projectId: string,
    trigger: "EVENT" | "SCHEDULED",
    now: Date,
    event: ClaimedReadinessEvent | null,
  ): Promise<RecalculationResult> {
    return this.database.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtextextended(${projectId}, 0))
        `;
        const source = await this.inputs.load(transaction, projectId);
        if (!source) {
          if (event) await this.completeEvents(transaction, event);
          return { batchId: null, changed: false, projectId };
        }
        const calculationDate = dateOnly(now);
        const projectInput = scopeInput(
          source,
          calculationDate,
          "PROJECT",
          projectId,
          source.lines,
        );
        const inputHash = stableHash({
          materialProjectionVersion: source.materialProjectionVersion,
          ...projectInput,
        });
        const latest = await transaction.readinessSnapshot.findFirst({
          orderBy: [{ calculatedAt: "desc" }, { id: "desc" }],
          select: {
            calculatorVersion: true,
            inputHash: true,
            ruleVersion: true,
          },
          where: { projectId, scopeKey: "PROJECT" },
        });
        if (
          latest?.inputHash === inputHash &&
          latest.calculatorVersion === READINESS_CALCULATOR_VERSION &&
          latest.ruleVersion === READINESS_RULE_VERSION
        ) {
          if (event) await this.completeEvents(transaction, event);
          return { batchId: null, changed: false, projectId };
        }

        const batchId = randomUUID();
        const projectCalculation = calculateReadiness(projectInput);
        await this.createSnapshot(transaction, {
          batchId,
          calculation: projectCalculation,
          inputHash,
          inputs: projectInput,
          materialProjectionVersion: source.materialProjectionVersion,
          projectId,
          scopeKey: "PROJECT",
          trigger,
          workPackageId: null,
        });

        const workPackageIds = [
          ...new Set(
            source.lines
              .map(({ workPackageId }) => workPackageId)
              .filter((id): id is string => id !== null),
          ),
        ].sort();
        for (const workPackageId of workPackageIds) {
          const workPackageLines = source.lines.filter(
            (line) => line.workPackageId === workPackageId,
          );
          const input = scopeInput(
            source,
            calculationDate,
            "WORK_PACKAGE",
            workPackageId,
            workPackageLines,
          );
          await this.createSnapshot(transaction, {
            batchId,
            calculation: calculateReadiness(input),
            inputHash: stableHash({
              materialProjectionVersion: source.materialProjectionVersion,
              ...input,
            }),
            inputs: input,
            materialProjectionVersion: source.materialProjectionVersion,
            projectId,
            scopeKey: `WORK_PACKAGE:${workPackageId}`,
            trigger,
            workPackageId,
          });
        }

        await (transaction.auditEvent.create as any)({
          data: {
            action: "READINESS_RECALCULATED",
            actorMembershipId: null,
            actorUserId: null,
            systemPrincipal: "WORKER_READINESS",
            changes: {
              blockerCount: projectCalculation.blockerCount,
              calculatorVersion: projectCalculation.calculatorVersion,
              inputHash,
              ruleVersion: projectCalculation.ruleVersion,
              score: projectCalculation.score,
              status: projectCalculation.status,
              trigger,
            },
            correlationId: `worker:readiness:${batchId}`,
            entityId: batchId,
            entityType: "ReadinessSnapshotBatch",
            organizationId: source.organizationId,
            outcome: "SUCCESS",
            requestId: `worker:readiness:${batchId}`,
          },
        });
        if (event) await this.completeEvents(transaction, event);
        return { batchId, changed: true, projectId };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private createSnapshot(
    transaction: Prisma.TransactionClient,
    input: {
      batchId: string;
      calculation: ReadinessCalculation;
      inputHash: string;
      inputs: unknown;
      materialProjectionVersion: string;
      projectId: string;
      scopeKey: string;
      trigger: "EVENT" | "SCHEDULED";
      workPackageId: string | null;
    },
  ) {
    return transaction.readinessSnapshot.create({
      data: {
        batchId: input.batchId,
        blockerCount: input.calculation.blockerCount,
        blockers: input.calculation
          .blockers as unknown as Prisma.InputJsonValue,
        calculationDate: new Date(
          `${input.calculation.calculationDate}T00:00:00.000Z`,
        ),
        calculatorVersion: input.calculation.calculatorVersion,
        criticalLineCount: input.calculation.criticalLineCount,
        explanation: {
          lineExplanations: input.calculation.lineExplanations,
          summary: input.calculation.explanation,
        } as unknown as Prisma.InputJsonValue,
        inputHash: input.inputHash,
        inputs: input.inputs as Prisma.InputJsonValue,
        lineCount: input.calculation.lineCount,
        materialProjectionVersion: input.materialProjectionVersion,
        projectId: input.projectId,
        readyCriticalLineCount: input.calculation.readyCriticalLineCount,
        reasonCodes: input.calculation.reasonCodes,
        recommendedActions: input.calculation
          .recommendedActions as unknown as Prisma.InputJsonValue,
        ruleVersion: input.calculation.ruleVersion,
        scopeKey: input.scopeKey,
        scopeType: input.workPackageId ? "WORK_PACKAGE" : "PROJECT",
        score: input.calculation.score,
        status: input.calculation.status,
        trigger: input.trigger,
        workPackageId: input.workPackageId,
      },
    });
  }

  private completeEvents(
    transaction: Prisma.TransactionClient,
    event: ClaimedReadinessEvent,
  ) {
    return transaction.outboxEvent.updateMany({
      data: {
        lastErrorCode: null,
        processedAt: new Date(),
        status: "PROCESSED",
      },
      where: {
        aggregateId: event.projectId,
        eventType: "READINESS_RECALCULATION_REQUESTED",
        lockedAt: event.lockedAt,
        status: "PROCESSING",
      },
    });
  }

  private async fail(event: ClaimedReadinessEvent, error: unknown) {
    const terminal = event.attempts >= 5;
    const errorCode =
      error instanceof Error && error.message
        ? "READINESS_CALCULATION_FAILED"
        : "READINESS_UNKNOWN_FAILURE";
    await this.database.outboxEvent.updateMany({
      data: terminal
        ? {
            lastErrorCode: errorCode,
            processedAt: new Date(),
            status: "FAILED",
          }
        : {
            availableAt: new Date(Date.now() + event.attempts * 2_000),
            lastErrorCode: errorCode,
            lockedAt: null,
            status: "PENDING",
          },
      where: {
        aggregateId: event.projectId,
        eventType: "READINESS_RECALCULATION_REQUESTED",
        lockedAt: event.lockedAt,
        status: "PROCESSING",
      },
    });
  }
}
