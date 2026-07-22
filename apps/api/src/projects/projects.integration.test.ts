import { createHash, randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createDatabaseClient,
  disconnectDatabaseClient,
  localFixtures,
  phaseTwoFixtures,
  type PrismaClient,
} from "@mecoflow/database";
import type { INestApplication } from "@nestjs/common";
import { createApplication } from "../bootstrap.js";

const databaseUrl = process.env.DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe.sequential : describe.skip;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

describeWithDatabase("Phase 2 project workflows and concurrency", () => {
  let app: INestApplication;
  let baseUrl: string;
  let database: PrismaClient;
  const sessionHashes: string[] = [];

  beforeAll(async () => {
    database = createDatabaseClient(databaseUrl!);
    ({ app } = await createApplication());
    await app.listen(0, "127.0.0.1");
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    if (sessionHashes.length > 0)
      await database.session.deleteMany({
        where: { tokenHash: { in: sessionHashes } },
      });
    if (app) await app.close();
    await disconnectDatabaseClient();
  });

  async function admin() {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(32).toString("base64url");
    const tokenHash = hash(token);
    sessionHashes.push(tokenHash);
    await database.session.create({
      data: {
        csrfTokenHash: hash(csrf),
        expiresAt: new Date(Date.now() + 120_000),
        tokenHash,
        userId: localFixtures.internalAdminUserId,
      },
    });
    return {
      csrf,
      headers: {
        cookie: `mecoflow_session=${token}; mecoflow_csrf=${csrf}`,
      },
    };
  }

  async function createProject() {
    const auth = await admin();
    const code = `IT-${randomBytes(6).toString("hex").toUpperCase()}`;
    const response = await fetch(`${baseUrl}/api/v1/projects`, {
      body: JSON.stringify({
        code,
        description: "Project integration fixture",
        name: `Integration ${code}`,
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: phaseTwoFixtures.demoCategoryId,
      }),
      headers: {
        ...auth.headers,
        "content-type": "application/json",
        "x-csrf-token": auth.csrf,
      },
      method: "POST",
    });
    expect(response.status).toBe(201);
    return {
      auth,
      project: (await response.json()) as {
        code: string;
        id: string;
        name: string;
        version: number;
      },
    };
  }

  it("permits a documented transition, records immutable transition detail, and forbids a reverse transition", async () => {
    const { auth, project } = await createProject();
    const allowed = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: project.version,
          reason: "Planning baseline approved",
          targetState: "PLANNED",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(allowed.status).toBe(201);
    const planned = (await allowed.json()) as { version: number };
    const transition = await database.projectTransition.findFirstOrThrow({
      where: { projectId: project.id },
    });
    expect(transition).toMatchObject({
      actorUserId: localFixtures.internalAdminUserId,
      reason: "Planning baseline approved",
      sourceState: "DRAFT",
      targetState: "PLANNED",
    });
    await expect(
      database.$executeRaw`UPDATE project_transitions SET reason = 'altered' WHERE id = ${transition.id}::uuid`,
    ).rejects.toThrow(/immutable/i);

    const forbidden = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/transitions`,
      {
        body: JSON.stringify({
          expectedVersion: planned.version,
          reason: "Attempt an invalid reverse transition",
          targetState: "DRAFT",
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "POST",
      },
    );
    expect(forbidden.status).toBe(422);
  });

  it("accepts exactly one of two concurrent edits with the same expected version", async () => {
    const { auth, project } = await createProject();
    const edit = (name: string) =>
      fetch(`${baseUrl}/api/v1/projects/${project.id}`, {
        body: JSON.stringify({
          code: project.code,
          description: "Concurrent edit fixture",
          expectedVersion: project.version,
          name,
          plannedEndDate: "2026-12-18",
          plannedStartDate: "2026-08-03",
          productCategoryId: phaseTwoFixtures.demoCategoryId,
        }),
        headers: {
          ...auth.headers,
          "content-type": "application/json",
          "x-csrf-token": auth.csrf,
        },
        method: "PATCH",
      });
    const responses = await Promise.all([
      edit("Concurrent edit A"),
      edit("Concurrent edit B"),
    ]);
    expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
    expect(
      await database.auditEvent.count({
        where: { action: "PROJECT_UPDATED", entityId: project.id },
      }),
    ).toBe(1);
  });

  it("rejects arbitrary state patching", async () => {
    const { auth, project } = await createProject();
    const response = await fetch(`${baseUrl}/api/v1/projects/${project.id}`, {
      body: JSON.stringify({
        code: project.code,
        description: "Status must not be patched",
        expectedVersion: project.version,
        name: project.name,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: phaseTwoFixtures.demoCategoryId,
        state: "ACTIVE",
      }),
      headers: {
        ...auth.headers,
        "content-type": "application/json",
        "x-csrf-token": auth.csrf,
      },
      method: "PATCH",
    });
    expect(response.status).toBe(400);
  });

  it("creates and edits categories, members, milestones, and work packages and lists them through bounded query state", async () => {
    const auth = await admin();
    const suffix = randomBytes(6).toString("hex").toUpperCase();
    const jsonHeaders = {
      ...auth.headers,
      "content-type": "application/json",
      "x-csrf-token": auth.csrf,
    };
    const categoryResponse = await fetch(
      `${baseUrl}/api/v1/product-categories`,
      {
        body: JSON.stringify({
          code: `CAT-${suffix}`,
          description: "Integration category",
          name: `Category ${suffix}`,
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(categoryResponse.status).toBe(201);
    const category = (await categoryResponse.json()) as {
      code: string;
      id: string;
      version: number;
    };
    const categoryEdit = await fetch(
      `${baseUrl}/api/v1/product-categories/${category.id}`,
      {
        body: JSON.stringify({
          active: true,
          code: category.code,
          description: "Edited integration category",
          expectedVersion: category.version,
          name: `Edited category ${suffix}`,
        }),
        headers: jsonHeaders,
        method: "PATCH",
      },
    );
    expect(categoryEdit.status).toBe(200);

    const code = `FULL-${suffix}`;
    const projectResponse = await fetch(`${baseUrl}/api/v1/projects`, {
      body: JSON.stringify({
        code,
        description: "Full aggregate integration fixture",
        name: `Full aggregate ${suffix}`,
        organizationId: localFixtures.internalOrganizationId,
        plannedEndDate: "2026-12-18",
        plannedStartDate: "2026-08-03",
        productCategoryId: category.id,
      }),
      headers: jsonHeaders,
      method: "POST",
    });
    expect(projectResponse.status).toBe(201);
    const project = (await projectResponse.json()) as { id: string };

    const milestoneResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/milestones`,
      {
        body: JSON.stringify({
          code: "M-001",
          description: "Integration milestone",
          name: "Engineering complete",
          targetDate: "2026-09-14",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(milestoneResponse.status).toBe(201);
    const milestone = (await milestoneResponse.json()) as {
      id: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/milestones/${milestone.id}`,
          {
            body: JSON.stringify({
              code: "M-001",
              description: "Edited integration milestone",
              expectedVersion: milestone.version,
              name: "Engineering baseline complete",
              targetDate: "2026-09-18",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const workPackageResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/work-packages`,
      {
        body: JSON.stringify({
          code: "WP-001",
          description: "Integration work package",
          milestoneId: milestone.id,
          name: "Engineering package",
          plannedEndDate: "2026-09-11",
          plannedStartDate: "2026-08-03",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(workPackageResponse.status).toBe(201);
    const workPackage = (await workPackageResponse.json()) as {
      id: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/work-packages/${workPackage.id}`,
          {
            body: JSON.stringify({
              code: "WP-001",
              description: "Edited integration work package",
              expectedVersion: workPackage.version,
              milestoneId: milestone.id,
              name: "Released engineering package",
              plannedEndDate: "2026-09-12",
              plannedStartDate: "2026-08-04",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const invalidProjectDates = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}`,
      {
        body: JSON.stringify({
          code,
          description: "Must retain child date coverage",
          expectedVersion: 1,
          name: `Full aggregate ${suffix}`,
          plannedEndDate: "2026-12-18",
          plannedStartDate: "2026-09-15",
          productCategoryId: category.id,
        }),
        headers: jsonHeaders,
        method: "PATCH",
      },
    );
    expect(invalidProjectDates.status).toBe(422);

    const readonlyMembership = await database.membership.findUniqueOrThrow({
      where: {
        userId_organizationId: {
          organizationId: localFixtures.internalOrganizationId,
          userId: localFixtures.internalReadonlyUserId,
        },
      },
    });
    const memberResponse = await fetch(
      `${baseUrl}/api/v1/projects/${project.id}/members`,
      {
        body: JSON.stringify({
          membershipId: readonlyMembership.id,
          role: "VIEWER",
        }),
        headers: jsonHeaders,
        method: "POST",
      },
    );
    expect(memberResponse.status).toBe(201);
    const member = (await memberResponse.json()) as {
      id: string;
      role: string;
      version: number;
    };
    expect(
      (
        await fetch(
          `${baseUrl}/api/v1/projects/${project.id}/members/${member.id}`,
          {
            body: JSON.stringify({
              expectedVersion: member.version,
              role: member.role,
              status: "INACTIVE",
            }),
            headers: jsonHeaders,
            method: "PATCH",
          },
        )
      ).status,
    ).toBe(200);

    const listResponse = await fetch(
      `${baseUrl}/api/v1/projects?q=${code}&state=DRAFT&sort=name&direction=desc&page=1&pageSize=1`,
      { headers: auth.headers },
    );
    expect(listResponse.status).toBe(200);
    expect((await listResponse.json()) as object).toMatchObject({
      data: [{ code }],
      pagination: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });
    expect(
      await database.auditEvent.count({
        where: {
          action: {
            in: [
              "PRODUCT_CATEGORY_CREATED",
              "PRODUCT_CATEGORY_UPDATED",
              "MILESTONE_CREATED",
              "MILESTONE_UPDATED",
              "WORK_PACKAGE_CREATED",
              "WORK_PACKAGE_UPDATED",
              "PROJECT_MEMBER_ADDED",
              "PROJECT_MEMBER_UPDATED",
            ],
          },
          OR: [
            { entityId: category.id },
            { entityId: milestone.id },
            { entityId: workPackage.id },
            { entityId: member.id },
          ],
        },
      }),
    ).toBe(8);
  });
});
