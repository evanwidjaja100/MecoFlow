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

test("imports, corrects, reviews, and releases a BOM revision", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await page.getByRole("link", { name: "DEMO-2026" }).click();
  await page.getByRole("link", { name: "Open BOM workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "BOM revisions" }),
  ).toBeVisible();

  const invalid = Buffer.from(
    "item_code,item_name,quantity,unit_code,criticality,notes\nPLATE-SS304-6MM,,0,EA,CRITICAL,invalid quantity\n",
  );
  const upload = page.getByRole("form", { name: "Upload BOM import" });
  await upload.getByLabel("CSV or XLSX file (maximum 5 MiB)").setInputFiles({
    buffer: invalid,
    mimeType: "text/csv",
    name: `bom-invalid-${Date.now()}.csv`,
  });
  await upload.getByRole("button", { name: "Upload and validate" }).click();
  await expect(page.getByText(/INVALID_QUANTITY/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("heading", { name: "Correction required" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "upload the corrected file" }).click();
  const valid = Buffer.from(
    "item_code,item_name,quantity,unit_code,criticality,notes\nPLATE-SS304-6MM,,1,EA,CRITICAL,browser import\n",
  );
  const correctedUpload = page.getByRole("form", {
    name: "Upload BOM import",
  });
  await correctedUpload
    .getByLabel("CSV or XLSX file (maximum 5 MiB)")
    .setInputFiles({
      buffer: valid,
      mimeType: "text/csv",
      name: `bom-valid-${Date.now()}.csv`,
    });
  await correctedUpload
    .getByRole("button", { name: "Upload and validate" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Confirm draft creation" }),
  ).toBeVisible({ timeout: 20_000 });
  const confirmation = page.getByRole("form", { name: "Confirm BOM import" });
  await confirmation
    .getByLabel("Revision title")
    .fill(`Browser BOM ${Date.now()}`);
  await confirmation.getByLabel(/I confirm that this dry run/).check();
  await confirmation
    .getByRole("button", { name: "Create draft revision" })
    .click();

  await expect(page.getByText("DRAFT", { exact: true })).toBeVisible();
  await page.getByText("Correct line", { exact: true }).click();
  const correction = page.getByRole("form", { name: "Correct BOM line 1" });
  await correction.getByLabel("Quantity").fill("2");
  await correction.getByRole("button", { name: "Save correction" }).click();
  await expect(page.getByRole("cell", { name: "2 ea" })).toBeVisible();

  const review = page.getByRole("form", { name: "Submit for review" });
  await review.getByLabel("Reason").fill("Browser engineering review complete");
  await review.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("IN REVIEW", { exact: true })).toBeVisible();

  const release = page.getByRole("form", { name: "Release revision" });
  await release.getByLabel("Reason").fill("Browser release approval complete");
  await release.getByRole("button", { name: "Release revision" }).click();
  await expect(page.getByText("RELEASED", { exact: true })).toBeVisible();
  await expect(page.getByText("Included", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Placeholder · ordered 0 · allocated 0", { exact: true }),
  ).toBeVisible();
});
