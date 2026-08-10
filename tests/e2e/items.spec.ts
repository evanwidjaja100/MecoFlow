import { readFile } from "node:fs/promises";
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

test("creates, searches, exports, edits, and deactivates an item", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await login(page);
  await page.getByRole("link", { name: "Items", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Items", exact: true }),
  ).toBeVisible();

  const suffix = `${Date.now().toString(36)}${Math.floor(
    Math.random() * 10_000,
  ).toString(36)}`.toUpperCase();
  const unitCode = `U${suffix}`;
  const unitName = `Browser unit ${suffix}`;
  const unitSymbol = `u${suffix.slice(-4).toLowerCase()}`;
  const categoryCode = `C${suffix}`;
  const categoryName = `Browser category ${suffix}`;
  const attributeCode = `A${suffix}`;
  const attributeName = `Browser measure ${suffix}`;
  const itemCode = `I${suffix}`;
  const itemName = `Browser item ${suffix}`;
  const editedName = `Edited browser item ${suffix}`;

  const unitForm = page.getByRole("form", {
    name: "Create unit of measure",
  });
  await unitForm.getByLabel("Unit code").fill(unitCode);
  await unitForm.getByLabel("Unit name").fill(unitName);
  await unitForm.getByLabel("Symbol").fill(unitSymbol);
  await unitForm.getByLabel("Decimal precision").fill("2");
  await unitForm.getByRole("button", { name: "Add unit" }).click();
  await expect(
    page.locator(
      'form[action="/internal/items"] select[name="unitOfMeasureId"]',
    ),
  ).toContainText(`${unitCode} — ${unitName} (${unitSymbol})`, {
    timeout: 15_000,
  });

  const categoryForm = page.getByRole("form", {
    name: "Create item category",
  });
  await categoryForm.getByLabel("Category code").fill(categoryCode);
  await categoryForm.getByLabel("Category name").fill(categoryName);
  await categoryForm
    .getByLabel("Category description")
    .fill("Category created by the Phase 3A browser workflow");
  await categoryForm.getByRole("button", { name: "Add category" }).click();

  await page
    .getByText(`${categoryCode} — ${categoryName} — Active`, { exact: true })
    .click();
  const attributeForm = page.getByRole("form", {
    name: `Add specification attribute to ${categoryName}`,
  });
  await attributeForm.getByLabel("Attribute code").fill(attributeCode);
  await attributeForm.getByLabel("Attribute name").fill(attributeName);
  await attributeForm.getByLabel("Data type").selectOption("NUMBER");
  await attributeForm
    .getByLabel("Number unit (optional)")
    .selectOption({ label: `${unitCode} — ${unitName} (${unitSymbol})` });
  await attributeForm.getByLabel("Number decimal precision").fill("2");
  await attributeForm.getByLabel("Required for items").check();
  await attributeForm
    .getByRole("button", { name: "Add specification attribute" })
    .click();

  await page
    .locator("#create-item")
    .getByText(`${categoryCode} — ${categoryName}`, { exact: true })
    .click();
  const itemForm = page.getByRole("form", {
    name: `New ${categoryName} item`,
  });
  await itemForm.getByLabel("Item code").fill(itemCode);
  await itemForm.getByLabel("Item name").fill(itemName);
  await itemForm
    .getByLabel("Base unit of measure")
    .selectOption({ label: `${unitCode} — ${unitName} (${unitSymbol})` });
  await itemForm
    .getByLabel("Item description")
    .fill("Item created by the Phase 3A browser workflow");
  await itemForm.getByRole("spinbutton", { name: attributeName }).fill("12.34");
  await itemForm.getByRole("button", { name: "Create item" }).click();

  await expect(page.getByRole("heading", { name: itemName })).toBeVisible();
  await expect(page.getByRole("cell", { name: "12.34" })).toBeVisible();
  await page.getByText("Edit item", { exact: true }).click();
  const editForm = page.getByRole("form", { name: `Edit item ${itemCode}` });
  await editForm.getByLabel("Item name").fill(editedName);
  await editForm.getByRole("button", { name: "Save item" }).click();
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.getByRole("link", { name: "Items", exact: true }).first().click();
  await page.getByLabel("Search").fill(itemCode);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(new RegExp(`q=${itemCode}`));
  await expect(page.getByRole("link", { name: itemCode })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const csv = await readFile(downloadPath!, "utf8");
  expect(csv).toContain(itemCode);

  await page.getByRole("link", { name: itemCode }).click();
  await page
    .getByLabel("Deactivation reason")
    .fill("Browser workflow duplicate cleanup");
  await page.getByRole("button", { name: "Deactivate item" }).click();
  await expect(
    page.getByText(
      "This item is inactive and retained for historical traceability.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /delete item/i })).toHaveCount(
    0,
  );
});
