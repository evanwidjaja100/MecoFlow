import { expect, test } from "@playwright/test";

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

test("creates, submits, and approves a requisition from outstanding released BOM need", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await login(page);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await page.getByRole("link", { name: "DEMO-2026" }).click();
  await page.getByRole("link", { name: "Open BOM workspace" }).click();

  const upload = page.getByRole("form", { name: "Upload BOM import" });
  const selectedScope = upload.getByLabel("Scope").locator("option").nth(1);
  const scopeValue = await selectedScope.getAttribute("value");
  const scopeLabel = await selectedScope.textContent();
  expect(scopeValue).toBeTruthy();
  expect(scopeLabel).toBeTruthy();
  await upload.getByLabel("Scope").selectOption(scopeValue!);
  await upload.getByLabel("CSV or XLSX file (maximum 5 MiB)").setInputFiles({
    buffer: Buffer.from(
      "item_code,item_name,quantity,unit_code,criticality,notes\nPLATE-SS304-6MM,,7,EA,HIGH,requisition browser need\n",
    ),
    mimeType: "text/csv",
    name: `requisition-bom-${Date.now()}.csv`,
  });
  await upload.getByRole("button", { name: "Upload and validate" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirm draft creation" }),
  ).toBeVisible({ timeout: 20_000 });
  const confirmation = page.getByRole("form", { name: "Confirm BOM import" });
  await confirmation
    .getByLabel("Revision title")
    .fill(`Requisition browser need ${Date.now()}`);
  await confirmation.getByLabel(/I confirm that this dry run/).check();
  await confirmation
    .getByRole("button", { name: "Create draft revision" })
    .click();
  const review = page.getByRole("form", { name: "Submit for review" });
  await review.getByLabel("Reason").fill("Browser requisition BOM review");
  await review.getByRole("button", { name: "Submit for review" }).click();
  const release = page.getByRole("form", { name: "Release revision" });
  await release.getByLabel("Reason").fill("Browser requisition BOM release");
  await release.getByRole("button", { name: "Release revision" }).click();
  await expect(page.getByText("RELEASED", { exact: true })).toBeVisible();

  await page.goto("/internal/projects/50000000-0000-4000-8000-000000000001");
  await page.getByRole("link", { name: "Open requisition workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Purchase requisitions" }),
  ).toBeVisible();
  await page.getByLabel("Title").fill(`Browser requisition ${Date.now()}`);
  const requirementRow = page
    .getByRole("row")
    .filter({ hasText: scopeLabel!.split(" — ")[0] })
    .filter({ hasText: "PLATE-SS304-6MM" });
  await requirementRow.getByLabel("Select PLATE-SS304-6MM").check();
  await page.getByRole("button", { name: "Create draft requisition" }).click();

  const summary = page.getByLabel("Requisition summary");
  await expect(summary.getByText("DRAFT", { exact: true })).toBeVisible();
  const submit = page
    .getByRole("button", { name: "Submit requisition" })
    .locator("..");
  await submit.getByLabel("Reason").fill("Browser requisition submit");
  await submit.getByRole("button", { name: "Submit requisition" }).click();
  await expect(summary.getByText("SUBMITTED", { exact: true })).toBeVisible();
  const approve = page
    .getByRole("button", { name: "Approve requisition" })
    .locator("..");
  await approve.getByLabel("Reason").fill("Browser requisition approval");
  await approve.getByRole("button", { name: "Approve requisition" }).click();
  await expect(summary.getByText("APPROVED", { exact: true })).toBeVisible();
  await expect(
    summary.getByText("Internal Administrator").last(),
  ).toBeVisible();
  const line = page.getByRole("row").filter({ hasText: "PLATE-SS304-6MM" });
  await expect(
    line.getByRole("cell", { name: "0", exact: true }),
  ).toBeVisible();
});
