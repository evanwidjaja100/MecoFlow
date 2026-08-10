import { Inject, Injectable } from "@nestjs/common";
import type { ServiceEnvironment } from "@mecoflow/config";
import {
  createDatabaseClient,
  Prisma,
  type PrismaClient,
} from "@mecoflow/database";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import { SERVICE_ENVIRONMENT } from "../tokens.js";

export interface ReportPeriodFilters {
  from: string;
  projectId?: string;
  to: string;
}

export interface SupplierFactsFilters extends ReportPeriodFilters {
  supplierOrganizationId?: string;
}

export type MaterialExceptionRow = Record<string, unknown> & {
  calculatedAt: string;
  itemCategory: { code: string; id: string; name: string } | null;
  project: { code: string; id: string; name: string };
};

type MaterialExceptionSourceLine = Omit<MaterialExceptionRow, "itemCategory">;

const date = (value: string) => new Date(`${value}T00:00:00.000+07:00`);
const endDate = (value: string) => new Date(`${value}T23:59:59.999+07:00`);
const storedString = (value: unknown): string =>
  typeof value === "string" ? value : "";

@Injectable()
export class ReportsRepository {
  private readonly database: PrismaClient;

  constructor(@Inject(SERVICE_ENVIRONMENT) environment: ServiceEnvironment) {
    this.database = createDatabaseClient(environment.DATABASE_URL);
  }

  private async boundedRead<T>(query: Prisma.PrismaPromise<T>): Promise<T> {
    const [, result] = await this.database.$transaction([
      this.database.$executeRaw`SET LOCAL statement_timeout = '5000ms'`,
      query,
    ]);
    return result;
  }

  private internalProjectWhere(
    principal: AuthenticatedPrincipal,
    permission: "report.export" | "report.read",
  ): Prisma.ProjectWhereInput {
    const memberships = principal.memberships.filter(
      (membership) =>
        membership.organization.type === "INTERNAL" &&
        membership.permissions.has(permission) &&
        membership.permissions.has("project.read") &&
        membership.permissions.has("readiness.read") &&
        membership.permissions.has("bom.read"),
    );
    const OR: Prisma.ProjectWhereInput[] = [];
    const systemAdministrator = memberships.some((membership) =>
      membership.roles.includes("SYSTEM_ADMIN"),
    );
    if (systemAdministrator) OR.push({ organization: { type: "INTERNAL" } });
    const managementOrganizationIds = memberships
      .filter((membership) => membership.roles.includes("MECO_MANAGEMENT"))
      .map((membership) => membership.organization.id);
    if (managementOrganizationIds.length)
      OR.push({ organizationId: { in: managementOrganizationIds } });
    const membershipIds = memberships.map(({ id }) => id);
    if (membershipIds.length)
      OR.push({
        members: {
          some: { membershipId: { in: membershipIds }, status: "ACTIVE" },
        },
      });
    return OR.length ? { OR } : { id: { in: [] } };
  }

  private supplierProjectWhere(
    membership: PrincipalMembership,
  ): Prisma.ProjectWhereInput {
    return {
      members: {
        some: { membershipId: membership.id, status: "ACTIVE" },
      },
    };
  }

  async projectReadiness(
    principal: AuthenticatedPrincipal,
    filters: ReportPeriodFilters & {
      status?: "AMBER" | "COMPLETE" | "GREEN" | "RED";
    },
    exportMode = false,
  ) {
    const rows = await this.boundedRead(
      this.database.readinessSnapshot.findMany({
        distinct: ["projectId"],
        include: {
          project: { select: { code: true, id: true, name: true } },
        },
        orderBy: [
          { projectId: "asc" },
          { calculatedAt: "desc" },
          { id: "desc" },
        ],
        take: 10_001,
        where: {
          calculatedAt: { gte: date(filters.from), lte: endDate(filters.to) },
          project: {
            ...this.internalProjectWhere(
              principal,
              exportMode ? "report.export" : "report.read",
            ),
            ...(filters.projectId ? { id: filters.projectId } : {}),
          },
          scopeType: "PROJECT",
          ...(filters.status ? { status: filters.status } : {}),
        },
      }),
    );
    return rows.map((row) => {
      const explanation = row.explanation as { summary?: string };
      return {
        blockerCount: row.blockerCount,
        calculatedAt: row.calculatedAt.toISOString(),
        calculationDate: row.calculationDate.toISOString().slice(0, 10),
        calculatorVersion: row.calculatorVersion,
        explanation:
          explanation.summary ?? "Readiness explanation unavailable.",
        inputHash: row.inputHash,
        materialProjectionVersion: row.materialProjectionVersion,
        project: row.project,
        reasonCodes: row.reasonCodes as string[],
        recommendedActions: row.recommendedActions,
        ruleVersion: row.ruleVersion,
        score: Number(row.score),
        status: row.status,
      };
    });
  }

  async materialExceptions(
    principal: AuthenticatedPrincipal,
    filters: ReportPeriodFilters & {
      blockerType?: string;
      item?: string;
      itemCategoryId?: string;
      workPackageId?: string;
    },
    exportMode = false,
  ): Promise<MaterialExceptionRow[]> {
    const snapshots = await this.boundedRead(
      this.database.readinessSnapshot.findMany({
        distinct: ["projectId"],
        include: { project: { select: { code: true, id: true, name: true } } },
        orderBy: [
          { projectId: "asc" },
          { calculatedAt: "desc" },
          { id: "desc" },
        ],
        take: 10_001,
        where: {
          calculatedAt: { gte: date(filters.from), lte: endDate(filters.to) },
          project: {
            ...this.internalProjectWhere(
              principal,
              exportMode ? "report.export" : "report.read",
            ),
            ...(filters.projectId ? { id: filters.projectId } : {}),
          },
          scopeType: "PROJECT",
        },
      }),
    );
    const rawLines: MaterialExceptionSourceLine[] = snapshots.flatMap(
      (snapshot) => {
        const inputs = snapshot.inputs as {
          lines?: Array<Record<string, unknown>>;
        };
        return (inputs.lines ?? []).map((line) => ({
          ...line,
          calculatedAt: snapshot.calculatedAt.toISOString(),
          project: snapshot.project,
        }));
      },
    );
    const bomLineIds = rawLines
      .map(({ bomLineId }) => String(bomLineId))
      .filter(Boolean);
    const bomLines = await this.boundedRead(
      this.database.bomLine.findMany({
        select: {
          id: true,
          item: {
            select: {
              itemCategory: { select: { code: true, id: true, name: true } },
            },
          },
        },
        where: { id: { in: bomLineIds } },
      }),
    );
    const categoryByLine = new Map(
      bomLines.map((line) => [line.id, line.item.itemCategory]),
    );
    return rawLines
      .filter((line) => {
        const shortage = Number(line.shortage ?? "0");
        const exceptional =
          line.blockerReason !== null ||
          shortage > 0 ||
          Number(line.openNcrCount ?? 0) > 0 ||
          (Boolean(line.certificateRequired) &&
            Number(line.certificateCompleteQuantity ?? "0") <
              Number(line.acceptedQuantity ?? "0"));
        if (!exceptional) return false;
        if (
          filters.blockerType &&
          storedString(line.blockerReason) !== filters.blockerType
        )
          return false;
        if (
          filters.workPackageId &&
          storedString(line.workPackageId) !== filters.workPackageId
        )
          return false;
        const category = categoryByLine.get(String(line.bomLineId));
        if (filters.itemCategoryId && category?.id !== filters.itemCategoryId)
          return false;
        if (filters.item) {
          const query = filters.item.toLocaleLowerCase();
          if (
            !storedString(line.itemCode).toLocaleLowerCase().includes(query) &&
            !storedString(line.itemName).toLocaleLowerCase().includes(query)
          )
            return false;
        }
        return true;
      })
      .map((line) => ({
        ...line,
        itemCategory: categoryByLine.get(String(line.bomLineId)) ?? null,
      }))
      .slice(0, 10_001) as MaterialExceptionRow[];
  }

  async supplierFacts(
    principal: AuthenticatedPrincipal,
    filters: SupplierFactsFilters,
    options:
      | { exportMode: boolean; internal: true }
      | { membership: PrincipalMembership; internal: false },
  ) {
    const projectWhere = options.internal
      ? this.internalProjectWhere(
          principal,
          options.exportMode ? "report.export" : "report.read",
        )
      : this.supplierProjectWhere(options.membership);
    const supplierOrganizationId = options.internal
      ? filters.supplierOrganizationId
      : options.membership.organization.id;
    const commonPurchaseOrderWhere = {
      project: {
        ...projectWhere,
        ...(filters.projectId ? { id: filters.projectId } : {}),
      },
      ...(supplierOrganizationId ? { supplierOrganizationId } : {}),
    } satisfies Prisma.PurchaseOrderWhereInput;
    const lines = await this.boundedRead(
      this.database.purchaseOrderLine.findMany({
        include: {
          allocations: { select: { requiredDateSnapshot: true } },
          commitmentLines: {
            include: {
              supplierCommitmentRevision: {
                select: { revisionNumber: true },
              },
            },
          },
          item: { select: { code: true, id: true, name: true } },
          purchaseOrderRevision: {
            include: {
              purchaseOrder: {
                include: {
                  project: { select: { code: true, id: true, name: true } },
                  supplierOrganization: {
                    select: { code: true, id: true, name: true },
                  },
                },
              },
            },
          },
          shipmentNoticeLines: {
            include: {
              advanceShipmentNotice: {
                select: { arrivedAt: true, status: true },
              },
            },
          },
        },
        orderBy: [{ id: "asc" }],
        take: 10_001,
        where: {
          purchaseOrderRevision: {
            purchaseOrder: commonPurchaseOrderWhere,
          },
        },
      }),
    );

    const inspections = await this.boundedRead(
      this.database.receivingInspection.findMany({
        include: {
          inventoryLot: {
            include: {
              advanceShipmentNoticeLine: {
                include: {
                  advanceShipmentNotice: {
                    include: {
                      project: { select: { code: true, id: true, name: true } },
                      supplierOrganization: {
                        select: { code: true, id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        take: 10_001,
        where: {
          finalizedAt: { gte: date(filters.from), lte: endDate(filters.to) },
          status: "FINALIZED",
          inventoryLot: {
            advanceShipmentNoticeLine: {
              advanceShipmentNotice: {
                project: {
                  ...projectWhere,
                  ...(filters.projectId ? { id: filters.projectId } : {}),
                },
                ...(supplierOrganizationId ? { supplierOrganizationId } : {}),
              },
            },
          },
        },
      }),
    );

    const ncrs = await this.boundedRead(
      this.database.ncr.findMany({
        include: {
          project: { select: { code: true, id: true, name: true } },
          supplierOrganization: {
            select: { code: true, id: true, name: true },
          },
          supplierResponses: { select: { id: true } },
        },
        take: 10_001,
        where: {
          issuedAt: { gte: date(filters.from), lte: endDate(filters.to) },
          project: {
            ...projectWhere,
            ...(filters.projectId ? { id: filters.projectId } : {}),
          },
          ...(supplierOrganizationId ? { supplierOrganizationId } : {}),
          status: { not: "DRAFT" },
        },
      }),
    );
    return { inspections, lines, ncrs };
  }

  async auditExport(input: {
    actorUserId: string;
    context: RequestContext;
    filters: Record<string, string>;
    format: string;
    generatedAt: string;
    organizationId: string;
    reportKey: string;
    rowCount: number;
  }): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      await transaction.auditEvent.create({
        data: {
          action: "REPORT_EXPORTED",
          actorUserId: input.actorUserId,
          changes: {
            filters: input.filters,
            format: input.format,
            generatedAt: input.generatedAt,
            reportKey: input.reportKey,
            rowCount: input.rowCount,
          },
          correlationId: input.context.correlationId,
          entityId: `${input.reportKey}:${input.generatedAt}`.slice(0, 100),
          entityType: "ReportExport",
          organizationId: input.organizationId,
          outcome: "SUCCESS",
          requestId: input.context.requestId,
        },
      });
    });
  }
}
