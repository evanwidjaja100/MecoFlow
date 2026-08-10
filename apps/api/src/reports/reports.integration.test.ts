import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  parseServiceEnvironment,
  type ServiceEnvironment,
} from "@mecoflow/config";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { AuthenticatedPrincipal } from "../identity/identity.types.js";
import { NcrsRepository } from "../ncrs/ncrs.repository.js";
import { ReportsRepository } from "./reports.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 8B report integration", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let reports: ReportsRepository;

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    environment = parseServiceEnvironment(process.env);
    reports = new ReportsRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  it("applies report filters and records redacted export audit evidence", async () => {
    const membership = await database.membership.findFirstOrThrow({
      where: {
        organizationId: localFixtures.internalOrganizationId,
        userId: localFixtures.internalAdminUserId,
      },
    });
    const principal = {
      memberships: [
        {
          id: membership.id,
          organization: {
            code: "MECO",
            id: localFixtures.internalOrganizationId,
            name: "MECO",
            type: "INTERNAL",
          },
          permissions: new Set([
            "project.read",
            "readiness.read",
            "bom.read",
            "report.read",
            "report.export",
          ]),
          roles: ["SYSTEM_ADMIN"],
        },
      ],
      sessionId: "integration",
      user: {
        displayName: "Integration Admin",
        email: "admin@example.test",
        id: localFixtures.internalAdminUserId,
        locale: "en",
      },
    } satisfies AuthenticatedPrincipal;
    const project = await database.project.create({
      data: {
        code: `P8B-${randomUUID().slice(0, 8).toUpperCase()}`,
        createdByUserId: localFixtures.internalAdminUserId,
        name: "Phase 8B report filter fixture",
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: new Date("2026-12-31T00:00:00.000Z"),
        plannedStartDate: new Date("2026-07-01T00:00:00.000Z"),
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      },
    });
    const snapshot = await database.$transaction(async (transaction) => {
      const created = await transaction.readinessSnapshot.create({
        data: {
          batchId: randomUUID(),
          blockerCount: 1,
          blockers: [],
          calculatedAt: new Date("2026-07-27T12:00:00.000+07:00"),
          calculationDate: new Date("2026-07-27T00:00:00.000Z"),
          calculatorVersion: "readiness-calculator-v1",
          criticalLineCount: 1,
          explanation: { summary: "Phase 8B report filter fixture" },
          inputHash: randomUUID().replaceAll("-", "").padEnd(64, "0"),
          inputs: { lines: [] },
          lineCount: 1,
          materialProjectionVersion: "material-requirement-status-v1",
          projectId: project.id,
          readyCriticalLineCount: 0,
          reasonCodes: ["CRITICAL_SHORTAGE_DUE"],
          recommendedActions: [],
          ruleVersion: "readiness-rules-v1",
          scopeKey: "PROJECT",
          scopeType: "PROJECT",
          score: 10,
          status: "RED",
          trigger: "EVENT",
        },
      });
      await transaction.outboxEvent.updateMany({
        data: { processedAt: new Date(), status: "PROCESSED" },
        where: {
          aggregateId: created.id,
          aggregateType: "ReadinessSnapshot",
        },
      });
      return created;
    });
    const rows = await reports.projectReadiness(principal, {
      from: "2026-07-27",
      projectId: project.id,
      status: "RED",
      to: "2026-07-27",
    });
    expect(rows.some(({ inputHash }) => inputHash === snapshot.inputHash)).toBe(
      true,
    );

    const requestId = randomUUID();
    await reports.auditExport({
      actorUserId: principal.user.id,
      context: { correlationId: randomUUID(), requestId },
      filters: { from: "2026-07-27", item: "[provided]", to: "2026-07-27" },
      format: "csv",
      generatedAt: "2026-07-27T12:00:00.000Z",
      organizationId: localFixtures.internalOrganizationId,
      reportKey: "material-exceptions",
      rowCount: 1,
    });
    const audit = await database.auditEvent.findFirstOrThrow({
      where: { action: "REPORT_EXPORTED", requestId },
    });
    expect(audit.changes).toMatchObject({
      filters: { item: "[provided]" },
      format: "csv",
      rowCount: 1,
    });
  });

  it("repository-scopes supplier rows to the authenticated organization", async () => {
    const supplierAMembership = await database.membership.findFirstOrThrow({
      where: {
        organizationId: localFixtures.supplierOrganizationId,
        userId: localFixtures.supplierAdminUserId,
      },
    });
    const supplierBOrganization = await database.organization.create({
      data: {
        code: `SCORE-B-${randomUUID().slice(0, 8)}`,
        name: "Scorecard Supplier B",
        type: "SUPPLIER",
      },
    });
    const supplierBUser = await database.userProfile.create({
      data: {
        displayName: "Scorecard Supplier B",
        email: `scorecard-${randomUUID()}@example.test`,
        issuer: "https://identity.example.test",
        subject: randomUUID(),
      },
    });
    const supplierBMembership = await database.membership.create({
      data: {
        organizationId: supplierBOrganization.id,
        userId: supplierBUser.id,
      },
    });
    await database.projectMember.create({
      data: {
        addedByUserId: localFixtures.internalAdminUserId,
        membershipId: supplierBMembership.id,
        projectId: phaseTwoFixtures.demoProjectId,
        role: "SUPPLIER",
      },
    });
    const ncrRepository = new NcrsRepository(environment);
    const context = { correlationId: randomUUID(), requestId: randomUUID() };
    const createIssued = async (supplierOrganizationId: string) => {
      const draft = await ncrRepository.create({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        description: "Scorecard supplier isolation fixture",
        internalDispositionNotes: "Internal-only scorecard fixture note",
        projectId: phaseTwoFixtures.demoProjectId,
        shareInternalNotes: false,
        sourceType: "PROJECT",
        supplierOrganizationId,
        title: `Scorecard fixture ${randomUUID()}`,
      });
      return ncrRepository.transition({
        actorUserId: localFixtures.internalAdminUserId,
        auditOrganizationId: localFixtures.internalOrganizationId,
        context,
        expectedVersion: draft.version,
        id: draft.id,
        reason: "Issue scorecard authorization fixture",
        targetStatus: "ISSUED",
      });
    };
    await createIssued(localFixtures.supplierOrganizationId);
    await createIssued(supplierBOrganization.id);

    const principal = {
      memberships: [
        {
          id: supplierAMembership.id,
          organization: {
            code: "SUP-A",
            id: localFixtures.supplierOrganizationId,
            name: "Supplier A",
            type: "SUPPLIER",
          },
          permissions: new Set(["project.read", "supplier.scorecard.read"]),
          roles: ["SUPPLIER_ADMIN"],
        },
      ],
      sessionId: "supplier-integration",
      user: {
        displayName: "Supplier A",
        email: "supplier-a@example.test",
        id: localFixtures.supplierAdminUserId,
        locale: "en",
      },
    } satisfies AuthenticatedPrincipal;
    const facts = await reports.supplierFacts(
      principal,
      { from: "2026-01-01", to: "2026-12-31" },
      { internal: false, membership: principal.memberships[0]! },
    );
    expect(facts.ncrs.length).toBeGreaterThan(0);
    expect(
      facts.ncrs.every(
        ({ supplierOrganizationId }) =>
          supplierOrganizationId === localFixtures.supplierOrganizationId,
      ),
    ).toBe(true);
    expect(
      facts.ncrs.some(
        ({ supplierOrganizationId }) =>
          supplierOrganizationId === supplierBOrganization.id,
      ),
    ).toBe(false);
  });
});
