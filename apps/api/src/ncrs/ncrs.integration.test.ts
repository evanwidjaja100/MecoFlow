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
import { postedInspectionFixture } from "../inspections/inspection-test-fixture.js";
import { NcrsRepository } from "./ncrs.repository.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

describeWithDatabase("Phase 6B NCR workflow", () => {
  let database: PrismaClient;
  let environment: ServiceEnvironment;
  let repository: NcrsRepository;
  const context = { correlationId: randomUUID(), requestId: randomUUID() };
  const actor = {
    actorUserId: localFixtures.internalAdminUserId,
    auditOrganizationId: localFixtures.internalOrganizationId,
    context,
  };

  beforeAll(() => {
    database = createDatabaseClient(databaseUrl!);
    environment = parseServiceEnvironment(process.env) as ServiceEnvironment;
    repository = new NcrsRepository(environment);
  });

  afterAll(async () => {
    await disconnectDatabaseClient();
  });

  async function quarantinedFixture() {
    const fixture = await postedInspectionFixture({
      context,
      database,
      definitions: [{ checkType: "CHECKLIST", code: `NCR-${randomUUID()}` }],
      environment,
    });
    const recorded = await fixture.inspections.saveResults({
      ...actor,
      expectedVersion: fixture.inspection.version,
      inspectionId: fixture.inspection.id,
      results: [
        {
          checkId: fixture.inspection.checks[0]!.id,
          checklistPassed: false,
        },
      ],
    });
    await fixture.inspections.finalize({
      ...actor,
      acceptedQuantity: "0",
      conditionalAuthorized: false,
      disposition: "QUARANTINED",
      expectedVersion: recorded!.version,
      inspectionId: fixture.inspection.id,
      reason: "Material quarantined pending supplier corrective response",
      rejectedQuantity: "0",
    });
    return fixture;
  }

  it("creates NCRs from an inspection, lot, and project with supplier scope", async () => {
    const fixture = await quarantinedFixture();
    const inspectionNcr = await repository.create({
      ...actor,
      description: "Inspection failed the required incoming quality check",
      internalDispositionNotes: "Keep all material in secured quarantine",
      projectId: phaseTwoFixtures.demoProjectId,
      receivingInspectionId: fixture.inspection.id,
      shareInternalNotes: false,
      sourceType: "RECEIVING_INSPECTION",
      title: "Incoming inspection nonconformance",
    });
    const lotNcr = await repository.create({
      ...actor,
      description: "Traceable lot requires supplier investigation",
      inventoryLotId: fixture.lot.id,
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "INVENTORY_LOT",
      title: "Inventory lot nonconformance",
    });
    const projectNcr = await repository.create({
      ...actor,
      description: "Project-level supplier quality issue requires response",
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "PROJECT",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      title: "Project supplier nonconformance",
    });
    expect(inspectionNcr).toMatchObject({
      sourceType: "RECEIVING_INSPECTION",
      status: "DRAFT",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
    });
    expect(lotNcr.inventoryLot?.id).toBe(fixture.lot.id);
    expect(projectNcr.sourceType).toBe("PROJECT");
    expect(
      await database.auditEvent.count({
        where: {
          action: "ncr.created",
          entityId: { in: [inspectionNcr.id, lotNcr.id, projectNcr.id] },
        },
      }),
    ).toBe(3);
  });

  it("filters internal notes and retains append-only supplier responses", async () => {
    const ncr = await repository.create({
      ...actor,
      description: "Supplier must document root cause and corrective action",
      internalDispositionNotes: "Internal hold authority: QA manager only",
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "PROJECT",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      title: "Supplier corrective action required",
    });
    const issued = await repository.transition({
      ...actor,
      expectedVersion: ncr.version,
      id: ncr.id,
      reason: "Issue NCR to the responsible supplier organization",
      targetStatus: "ISSUED",
    });
    const membership = await database.membership.findFirstOrThrow({
      where: {
        organizationId: localFixtures.supplierOrganizationId,
        userId: localFixtures.supplierAdminUserId,
      },
    });
    const supplierView = await repository.detailSupplier(
      ncr.id,
      [localFixtures.supplierOrganizationId],
      [membership.id],
    );
    expect(supplierView).not.toHaveProperty("internalDispositionNotes");
    expect(supplierView?.sharedDispositionNotes).toBeNull();
    const responded = await repository.submitSupplierResponse({
      actorUserId: localFixtures.supplierAdminUserId,
      context,
      correctiveAction:
        "Replace affected material and retrain final inspection",
      expectedVersion: issued.version,
      id: ncr.id,
      membershipIds: [membership.id],
      message: "We acknowledge the NCR and completed the investigation",
      organizationIds: [localFixtures.supplierOrganizationId],
      rootCause: "Final inspection sampling omitted the affected batch",
    });
    expect(responded.status).toBe("SUPPLIER_RESPONDED");
    expect(responded.supplierResponses).toHaveLength(1);
    const closed = await repository.transition({
      ...actor,
      expectedVersion: responded.version,
      id: ncr.id,
      internalDispositionNotes:
        "Corrective action accepted; quarantine remains rejected",
      reason: "Supplier corrective action reviewed and accepted",
      shareInternalNotes: true,
      targetStatus: "CLOSED",
    });
    expect(closed.status).toBe("CLOSED");
    const closedSupplierView = await repository.detailSupplier(
      ncr.id,
      [localFixtures.supplierOrganizationId],
      [membership.id],
    );
    expect(closedSupplierView?.sharedDispositionNotes).toBe(
      "Corrective action accepted; quarantine remains rejected",
    );
    await expect(
      database.ncrSupplierResponse.update({
        data: { message: "Attempted history overwrite" },
        where: { id: responded.supplierResponses[0]!.id },
      }),
    ).rejects.toThrow();
  });

  it("serializes concurrent supplier responses by expected version", async () => {
    const ncr = await repository.create({
      ...actor,
      description: "Concurrent response protection must retain one revision",
      projectId: phaseTwoFixtures.demoProjectId,
      shareInternalNotes: false,
      sourceType: "PROJECT",
      supplierOrganizationId: localFixtures.supplierOrganizationId,
      title: "Concurrent supplier response",
    });
    const issued = await repository.transition({
      ...actor,
      expectedVersion: ncr.version,
      id: ncr.id,
      reason: "Issue for concurrency response verification",
      targetStatus: "ISSUED",
    });
    const membership = await database.membership.findFirstOrThrow({
      where: {
        organizationId: localFixtures.supplierOrganizationId,
        userId: localFixtures.supplierAdminUserId,
      },
    });
    const submit = (message: string) =>
      repository.submitSupplierResponse({
        actorUserId: localFixtures.supplierAdminUserId,
        context,
        expectedVersion: issued.version,
        id: ncr.id,
        membershipIds: [membership.id],
        message,
        organizationIds: [localFixtures.supplierOrganizationId],
      });
    const results = await Promise.allSettled([
      submit("First concurrent supplier response submission"),
      submit("Second concurrent supplier response submission"),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(
      1,
    );
    expect(
      await database.ncrSupplierResponse.count({ where: { ncrId: ncr.id } }),
    ).toBe(1);
  });
});
