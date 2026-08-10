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

async function login(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.getByRole("button", { name: "Internal administrator" }).click();
  await expect(
    page.getByRole("heading", { name: "Internal overview" }),
  ).toBeVisible();
}

test("shows explained management, project, material, and history readiness", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const data = fixture<{
    itemCode: string;
    projectCode: string;
    projectId: string;
    projectName: string;
  }>("tests/e2e/setup-readiness-fixture.ts");
  await login(page);
  await page.getByRole("link", { name: "Readiness", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Management readiness dashboard" }),
  ).toBeVisible();
  const projectCard = page
    .getByRole("article")
    .filter({ hasText: data.projectCode });
  let foundProject = false;
  for (let pageNumber = 1; pageNumber <= 100; pageNumber += 1) {
    if ((await projectCard.count()) > 0) {
      foundProject = true;
      break;
    }
    const nextPage = page.getByRole("link", { name: "Next", exact: true });
    if ((await nextPage.count()) === 0) break;
    const href = await nextPage.getAttribute("href");
    if (!href) break;
    await page.goto(href);
  }
  expect(foundProject).toBe(true);
  await expect(projectCard.getByText("88.00%", { exact: true })).toBeVisible();
  await expect(
    projectCard.getByRole("heading", { name: "Blockers" }),
  ).toBeVisible();
  await expect(
    projectCard.getByText("ALLOCATION SHORTFALL", { exact: false }),
  ).toBeVisible();
  await expect(
    projectCard.getByRole("heading", { name: "Risk reasons" }),
  ).toBeVisible();
  await expect(
    projectCard.getByRole("heading", { name: "Recommended actions" }),
  ).toBeVisible();

  await projectCard.getByRole("link", { name: "Material board" }).click();
  await expect(
    page.getByRole("heading", { name: "Material-readiness board" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(data.itemCode) }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Allocate accepted material before the fabrication start date.",
      { exact: true },
    ),
  ).toBeVisible();

  await page.goto(`/internal/projects/${data.projectId}/readiness`);
  await expect(
    page.getByRole("heading", { name: "Project-readiness overview" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /WP-READY/ })).toBeVisible();
  await page.getByRole("link", { name: "Readiness history" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Readiness history" }),
  ).toBeVisible();
  await expect(page.getByText("earlier retained calculation")).toBeVisible();
  await expect(
    page
      .getByText("one explained allocation blocker", { exact: false })
      .first(),
  ).toBeVisible();
});
