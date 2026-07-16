import type { PrismaClient } from "../generated/prisma/client.js";

const permissions = {
  "administration.access": "Access internal administration",
  "audit.read": "Read authorized audit events",
  "membership.read": "Read organization memberships",
  "membership.write": "Create and change organization memberships",
  "organization.read": "Read organizations",
  "organization.write": "Create and change organizations",
  "project.read": "Read authorized projects when Phase 2 is enabled",
  "project.write": "Change authorized projects when Phase 2 is enabled",
  "project.membership.manage": "Manage project scope when Phase 2 is enabled",
  "role.read": "Read roles and assignments",
  "role.assign": "Change role assignments",
  "supplier.membership.read":
    "Read memberships in the user's supplier organization",
  "supplier.membership.write":
    "Manage memberships in the user's supplier organization",
  "supplier.organization.read": "Read the user's supplier organization",
  "user.read": "Read authorized user profiles",
} as const;

const roles = [
  [
    "SYSTEM_ADMIN",
    "System administrator",
    "Platform identity and organization administration",
    "INTERNAL",
  ],
  [
    "MECO_MANAGEMENT",
    "MECO management",
    "Internal cross-project management oversight",
    "INTERNAL",
  ],
  [
    "PROJECT_MANAGER",
    "Project manager",
    "Assigned project lifecycle management",
    "INTERNAL",
  ],
  [
    "ENGINEERING",
    "Engineering",
    "Assigned project engineering work",
    "INTERNAL",
  ],
  ["PPIC", "PPIC", "Assigned project planning and readiness work", "INTERNAL"],
  ["PURCHASING", "Purchasing", "Internal procurement work", "INTERNAL"],
  [
    "WAREHOUSE",
    "Warehouse",
    "Authorized receipt and inventory work",
    "INTERNAL",
  ],
  ["QA_QC", "QA/QC", "Authorized inspection and quality work", "INTERNAL"],
  ["PRODUCTION", "Production", "Assigned project production work", "INTERNAL"],
  [
    "FINANCE_READONLY",
    "Finance read-only",
    "Read-only authorized commercial view",
    "INTERNAL",
  ],
  [
    "AUDITOR_READONLY",
    "Auditor read-only",
    "Read-only authorized audit view",
    "INTERNAL",
  ],
  [
    "SUPPLIER_ADMIN",
    "Supplier administrator",
    "Own supplier organization administration",
    "SUPPLIER",
  ],
  [
    "SUPPLIER_USER",
    "Supplier user",
    "Own supplier organization collaboration",
    "SUPPLIER",
  ],
  [
    "CUSTOMER_VIEWER",
    "Customer viewer",
    "Reserved role with no MVP application surface",
    "ANY",
  ],
] as const;

const rolePermissions: Record<(typeof roles)[number][0], readonly string[]> = {
  SYSTEM_ADMIN: Object.keys(permissions),
  MECO_MANAGEMENT: [
    "organization.read",
    "user.read",
    "project.read",
    "audit.read",
  ],
  PROJECT_MANAGER: [
    "project.read",
    "project.write",
    "project.membership.manage",
  ],
  ENGINEERING: ["project.read", "project.write"],
  PPIC: ["project.read", "project.write"],
  PURCHASING: ["project.read", "project.write"],
  WAREHOUSE: ["project.read", "project.write"],
  QA_QC: ["project.read", "project.write"],
  PRODUCTION: ["project.read"],
  FINANCE_READONLY: ["project.read"],
  AUDITOR_READONLY: ["project.read", "audit.read"],
  SUPPLIER_ADMIN: [
    "supplier.organization.read",
    "supplier.membership.read",
    "supplier.membership.write",
    "project.read",
  ],
  SUPPLIER_USER: ["supplier.organization.read", "project.read"],
  CUSTOMER_VIEWER: [],
};

const localFixtures = {
  internalOrganizationId: "10000000-0000-4000-8000-000000000001",
  supplierOrganizationId: "10000000-0000-4000-8000-000000000002",
  internalAdminUserId: "20000000-0000-4000-8000-000000000001",
  internalReadonlyUserId: "20000000-0000-4000-8000-000000000002",
  supplierAdminUserId: "20000000-0000-4000-8000-000000000003",
  inactiveUserId: "20000000-0000-4000-8000-000000000004",
  inactiveMembershipUserId: "20000000-0000-4000-8000-000000000005",
  mockInternalAdminUserId: "20000000-0000-4000-8000-000000000006",
  mockSupplierAdminUserId: "20000000-0000-4000-8000-000000000007",
  issuer: "http://localhost:8180/realms/mecoflow-local",
  mockIssuer: "http://127.0.0.1:4310",
} as const;

export function shouldSeedLocalFixtures(
  appEnvironment: string | undefined,
): boolean {
  return ["ci", "development", "local", "test"].includes(appEnvironment ?? "");
}

export async function applyPhaseOneSeed(database: PrismaClient): Promise<void> {
  await database.$transaction(async (transaction) => {
    const seedLocalFixtures = shouldSeedLocalFixtures(process.env.APP_ENV);
    for (const [code, description] of Object.entries(permissions)) {
      await transaction.permission.upsert({
        create: { code, description },
        update: { description },
        where: { code },
      });
    }

    for (const [code, name, description, scope] of roles) {
      await transaction.role.upsert({
        create: { code, name, description, scope },
        update: { name, description, scope },
        where: { code },
      });
      const expectedPermissions = [...rolePermissions[code]];
      await transaction.rolePermission.deleteMany({
        where: {
          roleCode: code,
          ...(expectedPermissions.length > 0
            ? { permissionCode: { notIn: expectedPermissions } }
            : {}),
        },
      });
      await transaction.rolePermission.createMany({
        data: expectedPermissions.map((permissionCode) => ({
          roleCode: code,
          permissionCode,
        })),
        skipDuplicates: true,
      });
    }

    const organizations = [
      {
        id: localFixtures.internalOrganizationId,
        code: "MECO",
        name: "PT Meco Inoxprima",
        type: "INTERNAL" as const,
      },
      {
        id: localFixtures.supplierOrganizationId,
        code: "SUPPLIER-ALPHA",
        name: "Supplier Alpha (Local)",
        type: "SUPPLIER" as const,
      },
    ];
    for (const organization of seedLocalFixtures ? organizations : []) {
      await transaction.organization.createMany({
        data: organization,
        skipDuplicates: true,
      });
      await transaction.organization.updateMany({
        data: {
          name: organization.name,
          type: organization.type,
          active: true,
        },
        where: {
          code: organization.code,
          OR: [
            { name: { not: organization.name } },
            { type: { not: organization.type } },
            { active: { not: true } },
          ],
        },
      });
    }

    const users = seedLocalFixtures
      ? [
          {
            id: localFixtures.internalAdminUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000001",
            email: "internal.admin@mecoflow.local",
            displayName: "Internal Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.internalReadonlyUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000002",
            email: "finance.readonly@mecoflow.local",
            displayName: "Finance Readonly",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "FINANCE_READONLY",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.supplierAdminUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000003",
            email: "supplier.admin@mecoflow.local",
            displayName: "Supplier Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.supplierOrganizationId,
            roleCode: "SUPPLIER_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.inactiveUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000004",
            email: "inactive.user@mecoflow.local",
            displayName: "Inactive User",
            status: "INACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.inactiveMembershipUserId,
            issuer: localFixtures.issuer,
            subject: "30000000-0000-4000-8000-000000000005",
            email: "inactive.membership@mecoflow.local",
            displayName: "Inactive Membership",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "INACTIVE" as const,
          },
          {
            id: localFixtures.mockInternalAdminUserId,
            issuer: localFixtures.mockIssuer,
            subject: "mock-internal-admin",
            email: "internal.admin@mecoflow.test",
            displayName: "Internal Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.internalOrganizationId,
            roleCode: "SYSTEM_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
          {
            id: localFixtures.mockSupplierAdminUserId,
            issuer: localFixtures.mockIssuer,
            subject: "mock-supplier-admin",
            email: "supplier.admin@mecoflow.test",
            displayName: "Supplier Administrator",
            status: "ACTIVE" as const,
            organizationId: localFixtures.supplierOrganizationId,
            roleCode: "SUPPLIER_ADMIN",
            membershipStatus: "ACTIVE" as const,
          },
        ]
      : [];
    for (const user of users) {
      await transaction.userProfile.createMany({
        data: {
          id: user.id,
          issuer: user.issuer,
          subject: user.subject,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
        },
        skipDuplicates: true,
      });
      await transaction.userProfile.updateMany({
        data: {
          email: user.email,
          displayName: user.displayName,
          issuer: user.issuer,
          status: user.status,
          subject: user.subject,
        },
        where: {
          id: user.id,
          OR: [
            { email: { not: user.email } },
            { displayName: { not: user.displayName } },
            { issuer: { not: user.issuer } },
            { status: { not: user.status } },
            { subject: { not: user.subject } },
          ],
        },
      });
      await transaction.membership.createMany({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          status: user.membershipStatus,
        },
        skipDuplicates: true,
      });
      await transaction.membership.updateMany({
        data: { status: user.membershipStatus },
        where: {
          userId: user.id,
          organizationId: user.organizationId,
          status: { not: user.membershipStatus },
        },
      });
      const membership = await transaction.membership.findUniqueOrThrow({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: user.organizationId,
          },
        },
      });
      await transaction.membershipRole.upsert({
        create: { membershipId: membership.id, roleCode: user.roleCode },
        update: {},
        where: {
          membershipId_roleCode: {
            membershipId: membership.id,
            roleCode: user.roleCode,
          },
        },
      });
    }

    await transaction.systemMetadata.createMany({
      data: { key: "seed.version", value: "phase-1" },
      skipDuplicates: true,
    });
    await transaction.systemMetadata.updateMany({
      data: { value: "phase-1", version: { increment: 1 } },
      where: { key: "seed.version", NOT: { value: "phase-1" } },
    });
  });
}

export { localFixtures, permissions, rolePermissions, roles };
