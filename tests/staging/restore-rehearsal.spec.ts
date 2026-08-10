import { expect, test, type Page } from "@playwright/test";

const projectA = "93000000-0000-4000-8000-000000000001";
const rehearsalId = process.env.BACKUP_REHEARSAL_ID ?? "";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
}

test("verifies restored documents, readiness, and permission boundaries", async ({
  browser,
}) => {
  test.skip(!rehearsalId, "Only run against a restored rehearsal target");
  expect(rehearsalId).toMatch(/^[A-Za-z0-9._-]+$/);

  const internal = await browser.newContext({ ignoreHTTPSErrors: true });
  const internalPage = await internal.newPage();
  try {
    await login(
      internalPage,
      "staging.internal@mecoflow.invalid",
      process.env.STAGING_INTERNAL_PASSWORD ?? "",
    );
    await expect(
      internalPage.getByRole("heading", { name: "Internal overview" }),
    ).toBeVisible();
    await internalPage.goto(`/internal/projects/${projectA}/documents`);
    await expect(
      internalPage.getByText(`Restore rehearsal certificate ${rehearsalId}`, {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      internalPage.getByText(`Restore rehearsal packing list ${rehearsalId}`, {
        exact: false,
      }),
    ).toBeVisible();

    const readiness = await internalPage.evaluate(async (projectId) => {
      const response = await fetch(`/api/v1/projects/${projectId}/readiness`, {
        cache: "no-store",
      });
      return {
        body: (await response.json()) as Record<string, unknown>,
        status: response.status,
      };
    }, projectA);
    expect(readiness.status).toBe(200);
    expect(readiness.body).toMatchObject({
      latest: {
        calculatorVersion: "readiness-calculator-v1",
        lineCount: 0,
        ruleVersion: "readiness-rules-v1",
        score: 0,
        status: "RED",
      },
    });
    expect(JSON.stringify(readiness.body)).toContain(
      "No current released material requirements",
    );
  } finally {
    await internal.close();
  }

  const supplier = await browser.newContext({ ignoreHTTPSErrors: true });
  const supplierPage = await supplier.newPage();
  try {
    await login(
      supplierPage,
      "staging.supplier.a@mecoflow.invalid",
      process.env.STAGING_SUPPLIER_A_PASSWORD ?? "",
    );
    await expect(
      supplierPage.getByRole("heading", { name: "Supplier overview" }),
    ).toBeVisible();
    const deniedReadiness = await supplierPage.evaluate(async (projectId) => {
      const response = await fetch(`/api/v1/projects/${projectId}/readiness`, {
        cache: "no-store",
      });
      return {
        body: (await response.json()) as Record<string, unknown>,
        status: response.status,
      };
    }, projectA);
    expect(deniedReadiness.status).toBe(403);
    expect(deniedReadiness.body).toMatchObject({
      error: { code: "ACCESS_DENIED" },
    });
  } finally {
    await supplier.close();
  }
});
