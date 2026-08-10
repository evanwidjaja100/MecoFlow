import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  PrincipalMembership,
  RequestContext,
} from "../identity/identity.types.js";
import {
  createReportCsv,
  createReportXlsx,
  type ExportCell,
  type ExportColumn,
  type ReportExport,
} from "./report-export.js";
import { ReportsAuthorizationPolicy } from "./reports-authorization.policy.js";
import type {
  MaterialExceptionsReportQueryDto,
  ProjectReadinessReportQueryDto,
  SupplierPerformanceReportQueryDto,
} from "./reports.dto.js";
import { ReportFormat } from "./reports.dto.js";
import { ReportsRepository } from "./reports.repository.js";
import {
  calculateSupplierScorecard,
  type SupplierDeliveryLineInput,
  type SupplierInspectionInput,
  type SupplierKpis,
  type SupplierNcrInput,
} from "./supplier-kpis.js";

const MAX_EXPORT_ROWS = 10_000;

type SupplierFacts = Awaited<ReturnType<ReportsRepository["supplierFacts"]>>;

interface SupplierIdentity {
  code: string;
  id: string;
  name: string;
}

interface SupplierScorecard {
  deliveryLines?: Array<{
    currentAcknowledged: boolean;
    item: { code: string; id: string; name: string };
    latestCommitmentDate: string | null;
    orderedQuantity: string;
    originalCommitmentDate: string | null;
    project: { code: string; id: string; name: string };
    purchaseOrderLineId: string;
    purchaseOrderNumber: number;
    requiredDate: string;
    revisionNumber: number;
  }>;
  filters: Record<string, string>;
  generatedAt: string;
  kpis: SupplierKpis;
  modelVersion: string;
  supplier: SupplierIdentity;
  trends: Array<{ kpis: SupplierKpis; month: string }>;
}

function validDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function period(input: { from: string; to: string }): {
  from: string;
  to: string;
} {
  if (!validDate(input.from) || !validDate(input.to) || input.from > input.to)
    throw new UnprocessableEntityException("Invalid report period");
  const from = new Date(`${input.from}T00:00:00.000Z`);
  const to = new Date(`${input.to}T00:00:00.000Z`);
  const days = Math.floor((to.valueOf() - from.valueOf()) / 86_400_000) + 1;
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    to.getUTCMonth() -
    from.getUTCMonth() +
    1;
  if (days > 366 || months > 12)
    throw new UnprocessableEntityException(
      "Report period must contain at most 366 days and 12 calendar months",
    );
  return { from: input.from, to: input.to };
}

function canonicalFilters(input: object): Record<string, string> {
  return Object.fromEntries(
    (Object.entries(input) as Array<[string, string | undefined]>)
      .filter((entry): entry is [string, string] => Boolean(entry[1]))
      .map(([key, value]): [string, string] => [key, value.trim()])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function assertRows(count: number): void {
  if (count > MAX_EXPORT_ROWS)
    throw new UnprocessableEntityException(
      `Report exceeds the ${MAX_EXPORT_ROWS}-row synchronous export limit`,
    );
}

function exportText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string")
    throw new Error("Invalid persisted report text");
  return value;
}

function auditableFilters(
  filters: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      key === "item" ? "[provided]" : value,
    ]),
  );
}

function minimumDate(values: Date[]): string {
  return [...values]
    .sort((left, right) => left.valueOf() - right.valueOf())[0]!
    .toISOString()
    .slice(0, 10);
}

function groupSupplierFacts(
  facts: SupplierFacts,
  query: SupplierPerformanceReportQueryDto,
  generatedAt: string,
  includeDeliveryDetails = false,
): SupplierScorecard[] {
  const groups = new Map<
    string,
    {
      deliveries: SupplierDeliveryLineInput[];
      deliveryLines: NonNullable<SupplierScorecard["deliveryLines"]>;
      inspections: SupplierInspectionInput[];
      ncrs: SupplierNcrInput[];
      supplier: SupplierIdentity;
    }
  >();
  const group = (supplier: SupplierIdentity) => {
    const existing = groups.get(supplier.id);
    if (existing) return existing;
    const created = {
      deliveries: [],
      deliveryLines: [],
      inspections: [],
      ncrs: [],
      supplier,
    };
    groups.set(supplier.id, created);
    return created;
  };

  for (const line of facts.lines) {
    const revision = line.purchaseOrderRevision;
    const purchaseOrder = revision.purchaseOrder;
    const supplier = purchaseOrder.supplierOrganization;
    const requiredDates = line.allocations.map(
      ({ requiredDateSnapshot }) => requiredDateSnapshot,
    );
    if (!requiredDates.length)
      throw new Error("Persisted purchase-order line has no allocation");
    const supplierGroup = group(supplier);
    const commitments = line.commitmentLines
      .map((commitment) => ({
        committedDate: commitment.committedDate.toISOString().slice(0, 10),
        revisionNumber: commitment.supplierCommitmentRevision.revisionNumber,
      }))
      .sort(
        (left, right) =>
          left.revisionNumber - right.revisionNumber ||
          left.committedDate.localeCompare(right.committedDate),
      );
    const requiredDate = minimumDate(requiredDates);
    supplierGroup.deliveries.push({
      arrivals: line.shipmentNoticeLines
        .filter(
          ({ advanceShipmentNotice }) =>
            advanceShipmentNotice.status === "ARRIVED" &&
            advanceShipmentNotice.arrivedAt !== null,
        )
        .map(({ advanceShipmentNotice, shippedQuantity }) => ({
          arrivedAt: advanceShipmentNotice.arrivedAt!.toISOString(),
          quantity: shippedQuantity.toString(),
        })),
      commitments,
      currentAcknowledged:
        revision.current && purchaseOrder.status === "ACKNOWLEDGED",
      orderedQuantity: line.orderedQuantity.toString(),
      purchaseOrderLineId: line.id,
      requiredDate,
    });
    if (includeDeliveryDetails)
      supplierGroup.deliveryLines.push({
        currentAcknowledged:
          revision.current && purchaseOrder.status === "ACKNOWLEDGED",
        item: line.item,
        latestCommitmentDate: commitments.at(-1)?.committedDate ?? null,
        orderedQuantity: line.orderedQuantity.toString(),
        originalCommitmentDate: commitments[0]?.committedDate ?? null,
        project: purchaseOrder.project,
        purchaseOrderLineId: line.id,
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        requiredDate,
        revisionNumber: revision.revisionNumber,
      });
  }
  for (const inspection of facts.inspections) {
    const asn =
      inspection.inventoryLot.advanceShipmentNoticeLine.advanceShipmentNotice;
    if (
      !inspection.disposition ||
      !inspection.finalizedAt ||
      !inspection.finalizedReceivedQuantity
    )
      throw new Error("Finalized inspection KPI state is incomplete");
    group(asn.supplierOrganization).inspections.push({
      acceptedQuantity: inspection.acceptedQuantity.toString(),
      disposition: inspection.disposition,
      finalizedAt: inspection.finalizedAt.toISOString(),
      finalizedReceivedQuantity:
        inspection.finalizedReceivedQuantity.toString(),
    });
  }
  for (const ncr of facts.ncrs) {
    if (!ncr.issuedAt) throw new Error("Issued NCR timestamp is missing");
    group(ncr.supplierOrganization).ncrs.push({
      issuedAt: ncr.issuedAt.toISOString(),
      responseCount: ncr.supplierResponses.length,
    });
  }

  const filters = canonicalFilters({
    from: query.from,
    projectId: query.projectId,
    supplierOrganizationId: query.supplierOrganizationId,
    to: query.to,
  });
  return [...groups.values()]
    .sort((left, right) =>
      left.supplier.code.localeCompare(right.supplier.code),
    )
    .map((entry) => {
      const scorecard = calculateSupplierScorecard({
        asOf: generatedAt,
        deliveries: entry.deliveries,
        from: query.from,
        inspections: entry.inspections,
        ncrs: entry.ncrs,
        to: query.to,
      });
      return {
        ...(includeDeliveryDetails
          ? { deliveryLines: entry.deliveryLines }
          : {}),
        filters,
        generatedAt,
        ...scorecard,
        supplier: entry.supplier,
      };
    });
}

function scorecardColumns(): Array<ExportColumn<SupplierScorecard>> {
  const metric = (
    header: string,
    key: keyof SupplierKpis,
  ): ExportColumn<SupplierScorecard> => ({
    header,
    value: (row) => row.kpis[key].percentage,
  });
  return [
    { header: "Supplier code", value: (row) => row.supplier.code },
    { header: "Supplier name", value: (row) => row.supplier.name },
    metric("Required-date delivery %", "requiredDateDeliveryRate"),
    metric("Original commitment on-time %", "originalCommitmentOnTimeRate"),
    metric("Latest commitment on-time %", "latestCommitmentOnTimeRate"),
    metric("Commitment revision %", "commitmentRevisionRate"),
    metric("First-pass acceptance %", "firstPassAcceptanceRate"),
    metric("Usable acceptance %", "usableAcceptanceRate"),
    metric("NCR response %", "ncrResponseRate"),
    { header: "Model version", value: (row) => row.modelVersion },
  ];
}

function trendExport(scorecards: SupplierScorecard[]) {
  const rows = scorecards.flatMap((scorecard) =>
    scorecard.trends.map((trend) => ({
      firstPass: trend.kpis.firstPassAcceptanceRate.percentage,
      latest: trend.kpis.latestCommitmentOnTimeRate.percentage,
      month: trend.month,
      ncr: trend.kpis.ncrResponseRate.percentage,
      original: trend.kpis.originalCommitmentOnTimeRate.percentage,
      required: trend.kpis.requiredDateDeliveryRate.percentage,
      supplierCode: scorecard.supplier.code,
      usable: trend.kpis.usableAcceptanceRate.percentage,
    })),
  );
  const columns: Array<ExportColumn<Record<string, ExportCell>>> = [
    { header: "Supplier code", value: (row) => row["supplierCode"] ?? null },
    { header: "Month", value: (row) => row["month"] ?? null },
    {
      header: "Required-date delivery %",
      value: (row) => row["required"] ?? null,
    },
    {
      header: "Original commitment %",
      value: (row) => row["original"] ?? null,
    },
    {
      header: "Latest commitment %",
      value: (row) => row["latest"] ?? null,
    },
    {
      header: "First-pass acceptance %",
      value: (row) => row["firstPass"] ?? null,
    },
    {
      header: "Usable acceptance %",
      value: (row) => row["usable"] ?? null,
    },
    { header: "NCR response %", value: (row) => row["ncr"] ?? null },
  ];
  return { columns, rows };
}

@Injectable()
export class ReportsService {
  constructor(
    @Inject(ReportsAuthorizationPolicy)
    private readonly policy: ReportsAuthorizationPolicy,
    @Inject(ReportsRepository)
    private readonly repository: ReportsRepository,
  ) {}

  async projectReadiness(
    principal: AuthenticatedPrincipal,
    input: ProjectReadinessReportQueryDto,
  ) {
    this.policy.requireInternalReportRead(principal);
    period(input);
    const generatedAt = new Date().toISOString();
    const data = await this.repository.projectReadiness(principal, input);
    return {
      data,
      meta: {
        filters: canonicalFilters(input),
        generatedAt,
        reportKey: "project-readiness",
      },
    };
  }

  async materialExceptions(
    principal: AuthenticatedPrincipal,
    input: MaterialExceptionsReportQueryDto,
  ) {
    this.policy.requireInternalReportRead(principal);
    period(input);
    const generatedAt = new Date().toISOString();
    const data = await this.repository.materialExceptions(principal, input);
    return {
      data,
      meta: {
        filters: canonicalFilters(input),
        generatedAt,
        reportKey: "material-exceptions",
      },
    };
  }

  async supplierPerformance(
    principal: AuthenticatedPrincipal,
    input: SupplierPerformanceReportQueryDto,
  ) {
    this.policy.requireInternalScorecard(principal);
    period(input);
    const generatedAt = new Date().toISOString();
    const facts = await this.repository.supplierFacts(principal, input, {
      exportMode: false,
      internal: true,
    });
    const data = groupSupplierFacts(facts, input, generatedAt, true);
    return {
      data,
      meta: {
        filters: canonicalFilters(input),
        generatedAt,
        reportKey: "supplier-performance",
      },
    };
  }

  async ownSupplierScorecard(
    principal: AuthenticatedPrincipal,
    input: SupplierPerformanceReportQueryDto,
  ) {
    const membership = this.policy.requireSupplierScorecard(principal);
    if (input.supplierOrganizationId)
      throw new UnprocessableEntityException(
        "Supplier organization is derived from the authenticated membership",
      );
    period(input);
    const generatedAt = new Date().toISOString();
    const facts = await this.repository.supplierFacts(principal, input, {
      internal: false,
      membership,
    });
    const data = groupSupplierFacts(
      facts,
      {
        ...input,
        supplierOrganizationId: membership.organization.id,
      },
      generatedAt,
    );
    return {
      data: data[0] ?? {
        ...calculateSupplierScorecard({
          asOf: generatedAt,
          deliveries: [],
          from: input.from,
          inspections: [],
          ncrs: [],
          to: input.to,
        }),
        filters: canonicalFilters({
          from: input.from,
          projectId: input.projectId,
          supplierOrganizationId: membership.organization.id,
          to: input.to,
        }),
        generatedAt,
        supplier: membership.organization,
      },
      meta: {
        filters: canonicalFilters(input),
        generatedAt,
        reportKey: "own-supplier-scorecard",
      },
    };
  }

  private file<Row>(
    report: ReportExport<Row>,
    format: ReportFormat,
    filename: string,
  ) {
    if (format === ReportFormat.CSV)
      return {
        buffer: Buffer.from(createReportCsv(report), "utf8"),
        contentType: "text/csv; charset=utf-8",
        filename: `${filename}.csv`,
      };
    return {
      buffer: createReportXlsx(report),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: `${filename}.xlsx`,
    };
  }

  private audit(
    principal: AuthenticatedPrincipal,
    membership: PrincipalMembership,
    context: RequestContext,
    input: {
      filters: Record<string, string>;
      format: ReportFormat;
      generatedAt: string;
      reportKey: string;
      rowCount: number;
    },
  ) {
    return this.repository.auditExport({
      actorUserId: principal.user.id,
      context,
      organizationId: membership.organization.id,
      ...input,
      filters: auditableFilters(input.filters),
    });
  }

  async exportProjectReadiness(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: ProjectReadinessReportQueryDto,
    format: ReportFormat,
  ) {
    const membership = this.policy.requireInternalReportExport(principal);
    period(input);
    const generatedAt = new Date().toISOString();
    const rows = await this.repository.projectReadiness(principal, input, true);
    assertRows(rows.length);
    const filters = canonicalFilters(input);
    const report: ReportExport<(typeof rows)[number]> = {
      columns: [
        { header: "Project code", value: (row) => row.project.code },
        { header: "Project name", value: (row) => row.project.name },
        { header: "Status", value: (row) => row.status },
        { header: "Score", value: (row) => row.score },
        { header: "Blocker count", value: (row) => row.blockerCount },
        {
          header: "Reason codes",
          value: (row) => row.reasonCodes.join("; "),
        },
        { header: "Explanation", value: (row) => row.explanation },
        { header: "Calculation date", value: (row) => row.calculationDate },
        { header: "Calculated at", value: (row) => row.calculatedAt },
        { header: "Input hash", value: (row) => row.inputHash },
      ],
      filters,
      generatedAt,
      reportKey: "project-readiness",
      rows,
    };
    await this.audit(principal, membership, context, {
      filters,
      format,
      generatedAt,
      reportKey: report.reportKey,
      rowCount: rows.length,
    });
    return this.file(report, format, "project-readiness");
  }

  async exportMaterialExceptions(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: MaterialExceptionsReportQueryDto,
    format: ReportFormat,
  ) {
    const membership = this.policy.requireInternalReportExport(principal);
    period(input);
    const generatedAt = new Date().toISOString();
    const rows = await this.repository.materialExceptions(
      principal,
      input,
      true,
    );
    assertRows(rows.length);
    const filters = canonicalFilters(input);
    const report: ReportExport<(typeof rows)[number]> = {
      columns: [
        {
          header: "Project code",
          value: (row) => row.project.code,
        },
        { header: "Item code", value: (row) => exportText(row.itemCode) },
        { header: "Item name", value: (row) => exportText(row.itemName) },
        {
          header: "Category",
          value: (row) => row.itemCategory?.code ?? "",
        },
        {
          header: "Work package",
          value: (row) => exportText(row.workPackageCode),
        },
        {
          header: "Criticality",
          value: (row) => exportText(row.criticality),
        },
        {
          header: "Blocker",
          value: (row) => exportText(row.blockerReason),
        },
        {
          header: "Required quantity",
          value: (row) => exportText(row.requiredQuantity),
        },
        {
          header: "Shortage",
          value: (row) => exportText(row.shortage),
        },
        {
          header: "Required date",
          value: (row) => exportText(row.requiredDate),
        },
        {
          header: "Commitment date",
          value: (row) => exportText(row.operativeCommitmentDate),
        },
        {
          header: "Open NCR count",
          value: (row) => Number(row.openNcrCount ?? 0),
        },
      ],
      filters,
      generatedAt,
      reportKey: "material-exceptions",
      rows,
    };
    await this.audit(principal, membership, context, {
      filters,
      format,
      generatedAt,
      reportKey: report.reportKey,
      rowCount: rows.length,
    });
    return this.file(report, format, "material-exceptions");
  }

  private async exportScorecards(
    principal: AuthenticatedPrincipal,
    membership: PrincipalMembership,
    context: RequestContext,
    input: SupplierPerformanceReportQueryDto,
    format: ReportFormat,
    options: { internal: boolean; reportKey: string },
  ) {
    period(input);
    const generatedAt = new Date().toISOString();
    const facts = await this.repository.supplierFacts(
      principal,
      input,
      options.internal
        ? { exportMode: true, internal: true }
        : { internal: false, membership },
    );
    const filters = canonicalFilters({
      ...input,
      ...(options.internal
        ? {}
        : { supplierOrganizationId: membership.organization.id }),
    });
    const rows = groupSupplierFacts(
      facts,
      options.internal
        ? input
        : {
            ...input,
            supplierOrganizationId: membership.organization.id,
          },
      generatedAt,
      options.internal,
    );
    if (!options.internal && rows.length === 0) {
      rows.push({
        ...calculateSupplierScorecard({
          asOf: generatedAt,
          deliveries: [],
          from: input.from,
          inspections: [],
          ncrs: [],
          to: input.to,
        }),
        filters,
        generatedAt,
        supplier: membership.organization,
      });
    }
    assertRows(rows.length);
    const report: ReportExport<SupplierScorecard> = {
      columns: scorecardColumns(),
      filters,
      generatedAt,
      reportKey: options.reportKey,
      rows,
      trends: trendExport(rows),
    };
    await this.audit(principal, membership, context, {
      filters,
      format,
      generatedAt,
      reportKey: options.reportKey,
      rowCount: rows.length,
    });
    return this.file(report, format, options.reportKey);
  }

  exportSupplierPerformance(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: SupplierPerformanceReportQueryDto,
    format: ReportFormat,
  ) {
    const membership = this.policy.requireInternalScorecardExport(principal);
    return this.exportScorecards(
      principal,
      membership,
      context,
      input,
      format,
      { internal: true, reportKey: "supplier-performance" },
    );
  }

  exportOwnSupplierScorecard(
    principal: AuthenticatedPrincipal,
    context: RequestContext,
    input: SupplierPerformanceReportQueryDto,
    format: ReportFormat,
  ) {
    const membership = this.policy.requireSupplierScorecardExport(principal);
    if (input.supplierOrganizationId)
      throw new UnprocessableEntityException(
        "Supplier organization is derived from the authenticated membership",
      );
    return this.exportScorecards(
      principal,
      membership,
      context,
      input,
      format,
      { internal: false, reportKey: "own-supplier-scorecard" },
    );
  }
}
