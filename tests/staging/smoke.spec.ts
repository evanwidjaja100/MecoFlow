import { expect, test, type Browser, type Page } from "@playwright/test";

const projectA = "93000000-0000-4000-8000-000000000001";
const projectB = "93000000-0000-4000-8000-000000000002";
const nonexistentProject = "93000000-0000-4000-8000-000000000099";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
}

async function projectResponse(page: Page, projectId: string) {
  return page.evaluate(async (id) => {
    const response = await fetch(`/api/v1/projects/${id}`, {
      cache: "no-store",
    });
    return {
      body: (await response.json()) as Record<string, unknown>,
      status: response.status,
    };
  }, projectId);
}

async function supplierContext(
  browser: Browser,
  username: string,
  password: string,
) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await login(page, username, password);
  await expect(
    page.getByRole("heading", { name: "Supplier overview" }),
  ).toBeVisible();
  return { context, page };
}

test.describe.serial("Phase 9C staging deployment", () => {
  test("exposes dependency readiness, TLS security, and version metadata", async ({
    playwright,
  }) => {
    const request = await playwright.request.newContext({
      baseURL: "https://127.0.0.1:8443",
      ignoreHTTPSErrors: true,
    });
    try {
      const readiness = await request.get("/health/ready");
      expect(readiness.status()).toBe(200);
      await expect(readiness.json()).resolves.toMatchObject({
        checks: { database: "up", objectStorage: "up", redis: "up" },
        status: "ready",
      });

      const liveness = await request.get("/health/live");
      expect(liveness.status()).toBe(200);
      await expect(liveness.json()).resolves.toMatchObject({
        service: "api",
        status: "ok",
        version: process.env.APP_VERSION,
      });

      const web = await request.get("/health/web");
      expect(web.status()).toBe(200);
      expect(web.headers()["strict-transport-security"]).toContain(
        "max-age=31536000",
      );
      await expect(web.json()).resolves.toMatchObject({
        service: "web",
        status: "ok",
        version: process.env.APP_VERSION,
      });
    } finally {
      await request.dispose();
    }
  });

  test("authenticates an internal principal and completes a core project flow", async ({
    page,
  }) => {
    await login(
      page,
      "staging.internal@mecoflow.invalid",
      process.env.STAGING_INTERNAL_PASSWORD ?? "",
    );
    await expect(
      page.getByRole("heading", { name: "Internal overview" }),
    ).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

    await page.goto("/internal/projects");
    const code = `SMOKE-${Date.now()}`;
    const name = `Staging smoke project ${code}`;
    const create = page
      .getByRole("heading", { name: "Create project" })
      .locator("..");
    await create.getByLabel("Project code").fill(code);
    await create.getByLabel("Project name").fill(name);
    await create.getByLabel("Planned start").fill("2027-03-01");
    await create.getByLabel("Planned end").fill("2027-09-30");
    await create
      .getByLabel("Description")
      .fill("Phase 9C staging smoke evidence");
    await create.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText(code, { exact: true })).toBeVisible();
  });

  test("runs supplier flows and proves bidirectional cross-supplier isolation", async ({
    browser,
  }) => {
    const supplierA = await supplierContext(
      browser,
      "staging.supplier.a@mecoflow.invalid",
      process.env.STAGING_SUPPLIER_A_PASSWORD ?? "",
    );
    try {
      await supplierA.page.goto("/supplier/scorecard");
      await expect(
        supplierA.page.getByRole("heading", { name: "Supplier scorecard" }),
      ).toBeVisible();
      await expect(
        supplierA.page.getByText("STAGING-SUPPLIER-A", { exact: true }),
      ).toBeVisible();

      const own = await projectResponse(supplierA.page, projectA);
      expect(own.status).toBe(200);
      expect(JSON.stringify(own.body)).not.toContain(
        "staging.internal@mecoflow.invalid",
      );
      const foreign = await projectResponse(supplierA.page, projectB);
      const missing = await projectResponse(supplierA.page, nonexistentProject);
      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.body).toMatchObject({
        error: { code: "RESOURCE_NOT_FOUND" },
      });
      expect(missing.body).toMatchObject({
        error: { code: "RESOURCE_NOT_FOUND" },
      });
    } finally {
      await supplierA.context.close();
    }

    const supplierB = await supplierContext(
      browser,
      "staging.supplier.b@mecoflow.invalid",
      process.env.STAGING_SUPPLIER_B_PASSWORD ?? "",
    );
    try {
      const own = await projectResponse(supplierB.page, projectB);
      const foreign = await projectResponse(supplierB.page, projectA);
      expect(own.status).toBe(200);
      expect(foreign.status).toBe(404);
      expect(foreign.body).toMatchObject({
        error: { code: "RESOURCE_NOT_FOUND" },
      });
    } finally {
      await supplierB.context.close();
    }
  });
});
