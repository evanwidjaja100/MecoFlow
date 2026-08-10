import {
  createDatabaseClient,
  disconnectDatabaseClient,
} from "../../packages/database/dist/src/index.js";

if (
  process.env.APP_ENV !== "staging" ||
  process.env.STAGING_SMOKE_FIXTURES !== "true"
)
  throw new Error(
    "Staging smoke fixture provisioning requires APP_ENV=staging and STAGING_SMOKE_FIXTURES=true",
  );

const required = [
  "DATABASE_URL",
  "KEYCLOAK_ADMIN_PASSWORD",
  "KEYCLOAK_ADMIN_USERNAME",
  "KEYCLOAK_INTERNAL_URL",
  "KEYCLOAK_REALM",
  "OIDC_CLIENT_ID",
  "OIDC_ISSUER",
  "STAGING_INTERNAL_PASSWORD",
  "STAGING_PUBLIC_URL",
  "STAGING_SUPPLIER_A_PASSWORD",
  "STAGING_SUPPLIER_B_PASSWORD",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required ${name}`);
}

const keycloakBase = process.env.KEYCLOAK_INTERNAL_URL;
const realm = process.env.KEYCLOAK_REALM;
const publicUrl = process.env.STAGING_PUBLIC_URL.replace(/\/$/, "");
const issuer = process.env.OIDC_ISSUER;

async function keycloakRequest(path, init = {}, expected = [200]) {
  const response = await fetch(`${keycloakBase}${path}`, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  if (!expected.includes(response.status))
    throw new Error(`Keycloak request failed: ${response.status} ${path}`);
  if (response.status === 204 || response.status === 201) return undefined;
  return response.json();
}

const tokenBody = new URLSearchParams({
  client_id: "admin-cli",
  grant_type: "password",
  password: process.env.KEYCLOAK_ADMIN_PASSWORD,
  username: process.env.KEYCLOAK_ADMIN_USERNAME,
});
const token = await keycloakRequest(
  "/realms/master/protocol/openid-connect/token",
  {
    body: tokenBody,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  },
);
if (!token?.access_token) throw new Error("Keycloak returned no admin token");
const adminHeaders = {
  authorization: `Bearer ${token.access_token}`,
  "content-type": "application/json",
};

const realmPath = `/admin/realms/${encodeURIComponent(realm)}`;
const existingRealm = await fetch(`${keycloakBase}${realmPath}`, {
  headers: adminHeaders,
  signal: AbortSignal.timeout(10_000),
});
const realmDefinition = {
  bruteForceProtected: true,
  displayName: "MECO Flow staging",
  enabled: true,
  loginWithEmailAllowed: true,
  realm,
  registrationAllowed: false,
  rememberMe: false,
  resetPasswordAllowed: false,
  sslRequired: "external",
};
if (existingRealm.status === 404) {
  await keycloakRequest(
    "/admin/realms",
    {
      body: JSON.stringify(realmDefinition),
      headers: adminHeaders,
      method: "POST",
    },
    [201],
  );
} else if (existingRealm.ok) {
  await keycloakRequest(
    realmPath,
    {
      body: JSON.stringify(realmDefinition),
      headers: adminHeaders,
      method: "PUT",
    },
    [204],
  );
} else {
  throw new Error(`Keycloak realm lookup failed: ${existingRealm.status}`);
}

const clientId = process.env.OIDC_CLIENT_ID;
const clients = await keycloakRequest(
  `${realmPath}/clients?clientId=${encodeURIComponent(clientId)}`,
  { headers: adminHeaders },
);
const clientDefinition = {
  attributes: {
    "pkce.code.challenge.method": "S256",
    "post.logout.redirect.uris": `${publicUrl}/*`,
  },
  clientId,
  directAccessGrantsEnabled: false,
  enabled: true,
  name: "MECO Flow staging web client",
  publicClient: true,
  redirectUris: [`${publicUrl}/api/v1/auth/callback`],
  rootUrl: publicUrl,
  serviceAccountsEnabled: false,
  standardFlowEnabled: true,
  webOrigins: [publicUrl],
};
if (clients.length === 0) {
  await keycloakRequest(
    `${realmPath}/clients`,
    {
      body: JSON.stringify(clientDefinition),
      headers: adminHeaders,
      method: "POST",
    },
    [201],
  );
} else {
  await keycloakRequest(
    `${realmPath}/clients/${clients[0].id}`,
    {
      body: JSON.stringify({ ...clients[0], ...clientDefinition }),
      headers: adminHeaders,
      method: "PUT",
    },
    [204],
  );
}

const personas = [
  {
    displayName: "Staging Internal Administrator",
    email: "staging.internal@mecoflow.invalid",
    firstName: "Staging Internal",
    lastName: "Administrator",
    password: process.env.STAGING_INTERNAL_PASSWORD,
    roleCode: "SYSTEM_ADMIN",
    type: "INTERNAL",
  },
  {
    displayName: "Staging Supplier Alpha",
    email: "staging.supplier.a@mecoflow.invalid",
    firstName: "Staging Supplier",
    lastName: "Alpha",
    password: process.env.STAGING_SUPPLIER_A_PASSWORD,
    roleCode: "SUPPLIER_ADMIN",
    type: "SUPPLIER_A",
  },
  {
    displayName: "Staging Supplier Beta",
    email: "staging.supplier.b@mecoflow.invalid",
    firstName: "Staging Supplier",
    lastName: "Beta",
    password: process.env.STAGING_SUPPLIER_B_PASSWORD,
    roleCode: "SUPPLIER_ADMIN",
    type: "SUPPLIER_B",
  },
];

for (const persona of personas) {
  const usersPath = `${realmPath}/users?exact=true&username=${encodeURIComponent(
    persona.email,
  )}`;
  let users = await keycloakRequest(usersPath, { headers: adminHeaders });
  if (users.length === 0) {
    await keycloakRequest(
      `${realmPath}/users`,
      {
        body: JSON.stringify({
          email: persona.email,
          emailVerified: true,
          enabled: true,
          firstName: persona.firstName,
          lastName: persona.lastName,
          username: persona.email,
        }),
        headers: adminHeaders,
        method: "POST",
      },
      [201],
    );
    users = await keycloakRequest(usersPath, { headers: adminHeaders });
  }
  const user = users[0];
  if (!user?.id) throw new Error(`Keycloak user missing: ${persona.email}`);
  await keycloakRequest(
    `${realmPath}/users/${user.id}`,
    {
      body: JSON.stringify({
        ...user,
        email: persona.email,
        emailVerified: true,
        enabled: true,
        firstName: persona.firstName,
        lastName: persona.lastName,
      }),
      headers: adminHeaders,
      method: "PUT",
    },
    [204],
  );
  await keycloakRequest(
    `${realmPath}/users/${user.id}/reset-password`,
    {
      body: JSON.stringify({
        temporary: false,
        type: "password",
        value: persona.password,
      }),
      headers: adminHeaders,
      method: "PUT",
    },
    [204],
  );
  persona.subject = user.id;
}

const ids = {
  category: "92000000-0000-4000-8000-000000000001",
  internalOrganization: "91000000-0000-4000-8000-000000000001",
  internalUser: "90000000-0000-4000-8000-000000000001",
  projectA: "93000000-0000-4000-8000-000000000001",
  projectB: "93000000-0000-4000-8000-000000000002",
  supplierAOrganization: "91000000-0000-4000-8000-000000000002",
  supplierAUser: "90000000-0000-4000-8000-000000000002",
  supplierBOrganization: "91000000-0000-4000-8000-000000000003",
  supplierBUser: "90000000-0000-4000-8000-000000000003",
};

const database = createDatabaseClient(process.env.DATABASE_URL);
try {
  await database.$transaction(async (transaction) => {
    const organizations = [
      {
        code: "STAGING-MECO",
        id: ids.internalOrganization,
        name: "MECO Flow Staging Internal",
        type: "INTERNAL",
      },
      {
        code: "STAGING-SUPPLIER-A",
        id: ids.supplierAOrganization,
        name: "Staging Supplier Alpha",
        type: "SUPPLIER",
      },
      {
        code: "STAGING-SUPPLIER-B",
        id: ids.supplierBOrganization,
        name: "Staging Supplier Beta",
        type: "SUPPLIER",
      },
    ];
    for (const organization of organizations) {
      await transaction.organization.upsert({
        create: { ...organization, active: true },
        update: {
          active: true,
          name: organization.name,
          type: organization.type,
        },
        where: { code: organization.code },
      });
    }

    const userIds = [ids.internalUser, ids.supplierAUser, ids.supplierBUser];
    const organizationIds = [
      ids.internalOrganization,
      ids.supplierAOrganization,
      ids.supplierBOrganization,
    ];
    const memberships = [];
    for (const [index, persona] of personas.entries()) {
      const existing = await transaction.userProfile.findFirst({
        where: { email: persona.email },
      });
      const user = existing
        ? await transaction.userProfile.update({
            data: {
              displayName: persona.displayName,
              issuer,
              status: "ACTIVE",
              subject: persona.subject,
            },
            where: { id: existing.id },
          })
        : await transaction.userProfile.create({
            data: {
              displayName: persona.displayName,
              email: persona.email,
              id: userIds[index],
              issuer,
              status: "ACTIVE",
              subject: persona.subject,
            },
          });
      const membership = await transaction.membership.upsert({
        create: {
          organizationId: organizationIds[index],
          status: "ACTIVE",
          userId: user.id,
        },
        update: { status: "ACTIVE" },
        where: {
          userId_organizationId: {
            organizationId: organizationIds[index],
            userId: user.id,
          },
        },
      });
      await transaction.membershipRole.upsert({
        create: {
          assignedByUserId:
            index === 0 ? user.id : (memberships[0]?.userId ?? user.id),
          membershipId: membership.id,
          roleCode: persona.roleCode,
        },
        update: {},
        where: {
          membershipId_roleCode: {
            membershipId: membership.id,
            roleCode: persona.roleCode,
          },
        },
      });
      memberships.push({ ...membership, userId: user.id });
    }

    const category = await transaction.productCategory.upsert({
      create: {
        code: "STAGING-FABRICATION",
        description: "Staging smoke-test category",
        id: ids.category,
        name: "Staging Fabrication",
      },
      update: { active: true, name: "Staging Fabrication" },
      where: { code: "STAGING-FABRICATION" },
    });

    const projects = [
      {
        code: "STAGE-SUP-A",
        id: ids.projectA,
        name: "Supplier Alpha staging scope",
        supplierMembershipId: memberships[1].id,
      },
      {
        code: "STAGE-SUP-B",
        id: ids.projectB,
        name: "Supplier Beta staging scope",
        supplierMembershipId: memberships[2].id,
      },
    ];
    for (const projectInput of projects) {
      const project = await transaction.project.upsert({
        create: {
          code: projectInput.code,
          createdByUserId: memberships[0].userId,
          description: "Staging isolation fixture",
          id: projectInput.id,
          name: projectInput.name,
          organizationId: ids.internalOrganization,
          plannedEndDate: new Date("2027-12-31T00:00:00.000Z"),
          plannedStartDate: new Date("2027-01-01T00:00:00.000Z"),
          productCategoryId: category.id,
          state: "DRAFT",
        },
        update: { name: projectInput.name },
        where: {
          organizationId_code: {
            code: projectInput.code,
            organizationId: ids.internalOrganization,
          },
        },
      });
      await transaction.projectMember.upsert({
        create: {
          addedByUserId: memberships[0].userId,
          membershipId: memberships[0].id,
          projectId: project.id,
          role: "PROJECT_MANAGER",
          status: "ACTIVE",
        },
        update: { role: "PROJECT_MANAGER", status: "ACTIVE" },
        where: {
          projectId_membershipId: {
            membershipId: memberships[0].id,
            projectId: project.id,
          },
        },
      });
      await transaction.projectMember.upsert({
        create: {
          addedByUserId: memberships[0].userId,
          membershipId: projectInput.supplierMembershipId,
          projectId: project.id,
          role: "SUPPLIER",
          status: "ACTIVE",
        },
        update: { role: "SUPPLIER", status: "ACTIVE" },
        where: {
          projectId_membershipId: {
            membershipId: projectInput.supplierMembershipId,
            projectId: project.id,
          },
        },
      });
    }

    await transaction.auditEvent.create({
      data: {
        action: "STAGING_SMOKE_FIXTURES_PROVISIONED",
        actorUserId: memberships[0].userId,
        changes: {
          fixtureClass: "fictional-staging-only",
          projects: [ids.projectA, ids.projectB],
          readinessProject: ids.projectA,
        },
        correlationId: "staging:smoke:provision",
        entityId: "phase-9c",
        entityType: "STAGING_DEPLOYMENT",
        organizationId: ids.internalOrganization,
        outcome: "SUCCESS",
        requestId: "staging:smoke:provision",
      },
    });
  });
} finally {
  await disconnectDatabaseClient();
}

process.stdout.write("Staging smoke fixtures provisioned\n");
