import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

function fixture<T>(script: string): T {
  return JSON.parse(
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as T;
}

async function chooseIdentity(
  page: import("@playwright/test").Page,
  identity: "Internal administrator" | "Supplier administrator",
) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.getByRole("button", { name: identity }).click();
}

test("filters reports and downloads a metadata-bearing export", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const data = fixture<{ projectCode: string }>(
    "tests/e2e/setup-readiness-fixture.ts",
  );
  await chooseIdentity(page, "Internal administrator");
  await page.getByRole("link", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reports and supplier scorecards" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Project readiness report" }),
  ).toBeVisible();
  await expect(
    page.getByText(data.projectCode, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Material exceptions report" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Supplier performance report" }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("project-readiness.csv");
});

test("shows only the authenticated supplier scorecard surface", async ({
  page,
}) => {
  await chooseIdentity(page, "Supplier administrator");
  await page.getByRole("link", { name: "Scorecard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Supplier scorecard" }),
  ).toBeVisible();
  await expect(
    page.getByText("Other suppliers and internal evaluation data", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Monthly trends" }),
  ).toBeVisible();
  await expect(
    page.getByText("Original commitment performance uses", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Supplier organization ID")).toHaveCount(0);
});
