import { Inject, Injectable } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

type SnapshotRecord = Prisma.ReadinessSnapshotGetPayload<{
  include: {
    project: { select: { code: true; id: true; name: true } };
    workPackage: { select: { code: true; id: true; name: true } };
  };
}>;

@Injectable()
export class ReadinessRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private accessWhere(
    principal: AuthenticatedPrincipal,
  ): Prisma.ProjectWhereInput {
    const readableMemberships = principal.memberships.filter(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has("project.read") &&
        membership.permissions.has("readiness.read"),
    );
    const membershipIds = readableMemberships.map(({ id }) => id);
    const managementOrganizationIds = readableMemberships
      .filter((membership) => membership.roles.includes("MECO_MANAGEMENT"))
      .map((membership) => membership.organization.id);
    const systemAdministrator = readableMemberships.some((membership) =>
      membership.roles.includes("SYSTEM_ADMIN"),
    );
    const OR: Prisma.ProjectWhereInput[] = [];
    if (systemAdministrator) OR.push({ organization: { type: "INTERNAL" } });
    if (managementOrganizationIds.length > 0)
      OR.push({ organizationId: { in: managementOrganizationIds } });
    if (membershipIds.length > 0)
      OR.push({
        members: {
          some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
        },
      });
    return OR.length > 0 ? { OR } : { id: { in: [] } };
  }

  async management(
    principal: AuthenticatedPrincipal,
    input: { page: number; pageSize: number },
  ) {
    const where: Prisma.ProjectWhereInput = {
      AND: [
        this.accessWhere(principal),
        { readinessSnapshots: { some: { scopeType: "PROJECT" } } },
      ],
    };
    return this.database.$transaction(
      async (transaction) => {
        await transaction.$executeRaw`SET LOCAL statement_timeout = '5000ms'`;
        const projects = await transaction.project.findMany({
          orderBy: [{ code: "asc" }, { id: "asc" }],
          select: {
            code: true,
            id: true,
            name: true,
            readinessSnapshots: {
              orderBy: [{ calculatedAt: "desc" }, { id: "desc" }],
              take: 1,
              where: { scopeType: "PROJECT" },
            },
          },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          where,
        });
        const total = await transaction.project.count({ where });
        return {
          data: projects.flatMap((project) => {
            const snapshot = project.readinessSnapshots[0];
            return snapshot
              ? [
                  this.map({
                    ...snapshot,
                    project: {
                      code: project.code,
                      id: project.id,
                      name: project.name,
                    },
                    workPackage: null,
                  }),
                ]
              : [];
          }),
          total,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: 2_000,
        timeout: 10_000,
      },
    );
  }

  async overview(projectId: string) {
    const latest = await this.latestProjectSnapshot(projectId);
    if (!latest) return { latest: null, workPackages: [] };
    const workPackages = await this.database.readinessSnapshot.findMany({
      include: {
        project: { select: { code: true, id: true, name: true } },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      orderBy: [{ scopeKey: "asc" }, { id: "asc" }],
      where: { batchId: latest.batchId, scopeType: "WORK_PACKAGE" },
    });
    return {
      latest: this.map(latest),
      workPackages: workPackages.map((snapshot) => this.map(snapshot)),
    };
  }

  async materials(projectId: string) {
    const latest = await this.latestProjectSnapshot(projectId);
    if (!latest) return { latest: null, lines: [] };
    const inputs = latest.inputs as {
      lines?: unknown[];
    };
    const explanation = latest.explanation as {
      lineExplanations?: unknown[];
    };
    return {
      latest: this.map(latest),
      lineExplanations: explanation.lineExplanations ?? [],
      lines: inputs.lines ?? [],
    };
  }

  async history(projectId: string) {
    const snapshots = await this.database.readinessSnapshot.findMany({
      include: {
        project: { select: { code: true, id: true, name: true } },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      orderBy: [{ calculatedAt: "desc" }, { scopeKey: "asc" }, { id: "desc" }],
      take: 100,
      where: { projectId },
    });
    return { data: snapshots.map((snapshot) => this.map(snapshot)) };
  }

  private latestProjectSnapshot(projectId: string) {
    return this.database.readinessSnapshot.findFirst({
      include: {
        project: { select: { code: true, id: true, name: true } },
        workPackage: { select: { code: true, id: true, name: true } },
      },
      orderBy: [{ calculatedAt: "desc" }, { id: "desc" }],
      where: { projectId, scopeType: "PROJECT" },
    });
  }

  private map(snapshot: SnapshotRecord) {
    const explanation = snapshot.explanation as { summary?: string };
    return {
      batchId: snapshot.batchId,
      blockerCount: snapshot.blockerCount,
      blockers: snapshot.blockers,
      calculatedAt: snapshot.calculatedAt.toISOString(),
      calculationDate: snapshot.calculationDate.toISOString().slice(0, 10),
      calculatorVersion: snapshot.calculatorVersion,
      criticalLineCount: snapshot.criticalLineCount,
      explanation: explanation.summary ?? "Readiness explanation unavailable.",
      id: snapshot.id,
      inputHash: snapshot.inputHash,
      lineCount: snapshot.lineCount,
      materialProjectionVersion: snapshot.materialProjectionVersion,
      project: snapshot.project,
      readyCriticalLineCount: snapshot.readyCriticalLineCount,
      reasonCodes: snapshot.reasonCodes,
      recommendedActions: snapshot.recommendedActions,
      ruleVersion: snapshot.ruleVersion,
      scopeType: snapshot.scopeType,
      score: Number(snapshot.score),
      status: snapshot.status,
      trigger: snapshot.trigger,
      workPackage: snapshot.workPackage,
    };
  }
}
