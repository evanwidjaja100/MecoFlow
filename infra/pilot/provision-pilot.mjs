import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../../packages/database/dist/src/index.js";

if (
  process.env.APP_ENV !== "staging" ||
  process.env.STAGING_PILOT_FIXTURES !== "true"
)
  throw new Error(
    "Pilot provisioning requires APP_ENV=staging and STAGING_PILOT_FIXTURES=true",
  );
if (!process.env.DATABASE_URL) throw new Error("Missing required DATABASE_URL");

const ids = {
  category: "97000000-0000-4000-8000-000000000001",
  internalMembershipUser: "90000000-0000-4000-8000-000000000001",
  internalOrganization: "91000000-0000-4000-8000-000000000001",
  itemCategory: "97000000-0000-4000-8000-000000000002",
  criticalItem: "97000000-0000-4000-8000-000000000003",
  standardItem: "97000000-0000-4000-8000-000000000004",
  unit: "97000000-0000-4000-8000-000000000005",
};

const suppliers = Array.from({ length: 10 }, (_, index) => {
  const number = index + 1;
  if (index < 2)
    return {
      code: index === 0 ? "STAGING-SUPPLIER-A" : "STAGING-SUPPLIER-B",
      id:
        index === 0
          ? "91000000-0000-4000-8000-000000000002"
          : "91000000-0000-4000-8000-000000000003",
      name: index === 0 ? "Staging Supplier Alpha" : "Staging Supplier Beta",
    };
  return {
    code: `PILOT-SUPPLIER-${String(number).padStart(2, "0")}`,
    id: `95000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
    name: `Fictional Pilot Supplier ${String(number).padStart(2, "0")}`,
  };
});

const projects = Array.from({ length: 4 }, (_, index) => {
  const number = index + 1;
  return {
    code: `PILOT-2027-${String(number).padStart(2, "0")}`,
    id: `96000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
    name: `Controlled Pilot Project ${String(number).padStart(2, "0")}`,
    supplierIndex: index % 2,
  };
});

const database = createDatabaseClient(process.env.DATABASE_URL);
try {
  await database.$transaction(async (transaction) => {
    const internalMembership = await transaction.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: ids.internalOrganization,
          userId: ids.internalMembershipUser,
        },
      },
    });

    const supplierMemberships = [];
    for (const [index, supplier] of suppliers.entries()) {
      const organization = await transaction.organization.upsert({
        create: { ...supplier, active: true, type: "SUPPLIER" },
        update: { active: true, name: supplier.name, type: "SUPPLIER" },
        where: { code: supplier.code },
      });
      if (index < 2) {
        const membership = await transaction.membership.findFirstOrThrow({
          where: { organizationId: organization.id, status: "ACTIVE" },
        });
        supplierMemberships.push({ membership, organization });
      }
    }

    const category = await transaction.productCategory.upsert({
      create: {
        code: "PILOT-FABRICATION",
        description: "Fictional controlled-pilot fabrication category",
        id: ids.category,
        name: "Pilot Fabrication",
      },
      update: { active: true, name: "Pilot Fabrication" },
      where: { code: "PILOT-FABRICATION" },
    });
    const itemCategory = await transaction.itemCategory.upsert({
      create: {
        code: "PILOT-COMPONENTS",
        description: "Fictional pilot component catalog",
        id: ids.itemCategory,
        name: "Pilot Components",
      },
      update: { active: true, name: "Pilot Components" },
      where: { code: "PILOT-COMPONENTS" },
    });
    const unit = await transaction.unitOfMeasure.upsert({
      create: {
        code: "EA",
        decimalPrecision: 0,
        id: ids.unit,
        name: "Each",
        symbol: "ea",
      },
      update: { active: true, decimalPrecision: 0, name: "Each", symbol: "ea" },
      where: { code: "EA" },
    });
    const itemInputs = [
      {
        code: "PILOT-VALVE-CRIT",
        description: "Fictional critical valve requiring certificate review",
        id: ids.criticalItem,
        name: "Pilot critical valve",
      },
      {
        code: "PILOT-GASKET-STD",
        description: "Fictional standard gasket used for visual inspection",
        id: ids.standardItem,
        name: "Pilot standard gasket",
      },
    ];
    const items = [];
    for (const itemInput of itemInputs) {
      items.push(
        await transaction.item.upsert({
          create: {
            ...itemInput,
            createdByUserId: internalMembership.userId,
            itemCategoryId: itemCategory.id,
            unitOfMeasureId: unit.id,
          },
          update: {
            active: true,
            description: itemInput.description,
            itemCategoryId: itemCategory.id,
            name: itemInput.name,
            unitOfMeasureId: unit.id,
          },
          where: { code: itemInput.code },
        }),
      );
    }
    const definitions = [
      {
        checkType: "CERTIFICATE",
        code: "PILOT-CERTIFICATE",
        description: "Approved, clean certificate evidence is mandatory",
        itemId: items[0].id,
        name: "Material certificate",
      },
      {
        checkType: "CHECKLIST",
        code: "PILOT-VISUAL",
        description: "Inspect packaging and material for visible damage",
        itemId: items[1].id,
        name: "Visual condition",
      },
    ];
    for (const definition of definitions) {
      await transaction.inspectionCheckDefinition.upsert({
        create: {
          ...definition,
          createdByUserId: internalMembership.userId,
          required: true,
        },
        update: {
          active: true,
          checkType: definition.checkType,
          description: definition.description,
          name: definition.name,
          required: true,
        },
        where: {
          itemId_code: { code: definition.code, itemId: definition.itemId },
        },
      });
    }

    for (const projectInput of projects) {
      const project = await transaction.project.upsert({
        create: {
          code: projectInput.code,
          createdByUserId: internalMembership.userId,
          description: "Fictional controlled-pilot dataset; no personal data",
          id: projectInput.id,
          name: projectInput.name,
          organizationId: ids.internalOrganization,
          plannedEndDate: new Date("2027-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2027-01-04T00:00:00.000Z"),
          productCategoryId: category.id,
        },
        update: { name: projectInput.name },
        where: {
          organizationId_code: {
            code: projectInput.code,
            organizationId: ids.internalOrganization,
          },
        },
      });
      for (const member of [
        { membershipId: internalMembership.id, role: "PROJECT_MANAGER" },
        {
          membershipId:
            supplierMemberships[projectInput.supplierIndex].membership.id,
          role: "SUPPLIER",
        },
      ]) {
        await transaction.projectMember.upsert({
          create: {
            addedByUserId: internalMembership.userId,
            projectId: project.id,
            status: "ACTIVE",
            ...member,
          },
          update: { role: member.role, status: "ACTIVE" },
          where: {
            projectId_membershipId: {
              membershipId: member.membershipId,
              projectId: project.id,
            },
          },
        });
      }
    }

    const requestId = `staging:pilot:provision:${Date.now()}`;
    await transaction.auditEvent.create({
      data: {
        action: "STAGING_PILOT_BASELINE_PROVISIONED",
        actorUserId: internalMembership.userId,
        changes: {
          fixtureClass: "fictional-staging-only",
          itemCodes: itemInputs.map(({ code }) => code),
          projectCodes: projects.map(({ code }) => code),
          supplierCount: suppliers.length,
        },
        correlationId: requestId,
        entityId: "controlled-pilot",
        entityType: "PILOT_DATASET",
        organizationId: ids.internalOrganization,
        outcome: "SUCCESS",
        requestId,
      },
    });
  });
} finally {
  await disconnectDatabaseClient();
}

process.stdout.write(
  `${JSON.stringify({
    itemCodes: ["PILOT-VALVE-CRIT", "PILOT-GASKET-STD"],
    projectCodes: projects.map(({ code }) => code),
    supplierCount: suppliers.length,
  })}\n`,
);
