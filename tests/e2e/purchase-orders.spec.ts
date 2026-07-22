import { expect, test } from "@playwright/test";

async function login(
  page: import("@playwright/test").Page,
  persona: "Internal administrator" | "Supplier administrator",
) {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.getByRole("button", { name: persona }).click();
}

test("sends a PO, acknowledges it, and appends commitment revisions", async ({
  browser,
  page,
}) => {
  test.setTimeout(120_000);
  const unique = Date.now();
  const requisitionTitle = `PO browser approved source ${unique}`;
  const purchaseOrderTitle = `PO browser order ${unique}`;

  await login(page, "Internal administrator");
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
      `item_code,item_name,quantity,unit_code,criticality,notes\nPLATE-SS304-6MM,,9,EA,HIGH,PO browser requirement ${unique}\n`,
    ),
    mimeType: "text/csv",
    name: `po-browser-${unique}.csv`,
  });
  await upload.getByRole("button", { name: "Upload and validate" }).click();
  await expect(
    page.getByRole("heading", { name: "Confirm draft creation" }),
  ).toBeVisible({
    timeout: 20_000,
  });
  const confirmation = page.getByRole("form", { name: "Confirm BOM import" });
  await confirmation
    .getByLabel("Revision title")
    .fill(`PO browser need ${unique}`);
  await confirmation.getByLabel(/I confirm that this dry run/).check();
  await confirmation
    .getByRole("button", { name: "Create draft revision" })
    .click();
  const review = page.getByRole("form", { name: "Submit for review" });
  await review.getByLabel("Reason").fill("Review browser purchase order need");
  await review.getByRole("button", { name: "Submit for review" }).click();
  const release = page.getByRole("form", { name: "Release revision" });
  await release
    .getByLabel("Reason")
    .fill("Release browser purchase order need");
  await release.getByRole("button", { name: "Release revision" }).click();
  await expect(page.getByText("RELEASED", { exact: true })).toBeVisible();

  await page.goto(
    "/internal/projects/50000000-0000-4000-8000-000000000001/requisitions",
  );
  await page.getByLabel("Title").fill(requisitionTitle);
  const requirementRow = page
    .getByRole("row")
    .filter({ hasText: scopeLabel!.split(/\s(?:—|â€”)\s/)[0] })
    .filter({ hasText: "PLATE-SS304-6MM" });
  await requirementRow.getByLabel("Select PLATE-SS304-6MM").check();
  await page.getByRole("button", { name: "Create draft requisition" }).click();
  await page
    .getByLabel("Requisition summary")
    .getByText("DRAFT", { exact: true })
    .waitFor();
  const submit = page
    .getByRole("button", { name: "Submit requisition" })
    .locator("..");
  await submit
    .getByLabel("Reason")
    .fill("Submit purchase order browser source");
  await submit.getByRole("button", { name: "Submit requisition" }).click();
  const approve = page
    .getByRole("button", { name: "Approve requisition" })
    .locator("..");
  await approve
    .getByLabel("Reason")
    .fill("Approve purchase order browser source");
  await approve.getByRole("button", { name: "Approve requisition" }).click();
  await expect(
    page
      .getByLabel("Requisition summary")
      .getByText("APPROVED", { exact: true }),
  ).toBeVisible();

  await page.goto(
    "/internal/projects/50000000-0000-4000-8000-000000000001/purchase-orders",
  );
  await expect(
    page.getByRole("heading", { name: "Purchase orders" }),
  ).toBeVisible();
  const create = page.getByRole("form", { name: "Create purchase order" });
  await create.getByLabel("Title").fill(purchaseOrderTitle);
  await create
    .getByLabel("Revision reason")
    .fill("Create browser purchase order revision one");
  await create
    .getByLabel("Supplier message")
    .fill("Confirm delivery commitment dates");
  await create
    .getByLabel("Internal commercial terms")
    .fill("Browser internal price terms");
  const approvedRow = create
    .getByRole("row")
    .filter({ hasText: requisitionTitle });
  await approvedRow.getByLabel("Select approved PLATE-SS304-6MM").check();
  await approvedRow
    .getByLabel("Internal unit price for PLATE-SS304-6MM")
    .fill("150000.00");
  const actionResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      response.url().includes("/purchase-orders"),
  );
  await create
    .getByRole("button", { name: "Create draft purchase order" })
    .click();
  await actionResponsePromise;
  await expect(page).toHaveURL(/\/purchase-orders\/[0-9a-f-]{36}$/i);
  await expect(
    page.getByRole("heading", { name: purchaseOrderTitle }),
  ).toBeVisible();
  await expect(page.getByText("DRAFT", { exact: true })).toBeVisible();
  const send = page
    .getByRole("button", { name: "Send purchase order" })
    .locator("..");
  await send.getByLabel("Reason").fill("Send browser PO to assigned supplier");
  await send.getByRole("button", { name: "Send purchase order" }).click();
  await expect(page.getByText("SENT", { exact: true })).toBeVisible();

  const supplierContext = await browser.newContext();
  const supplierPage = await supplierContext.newPage();
  await login(supplierPage, "Supplier administrator");
  await supplierPage
    .getByRole("link", { name: "Purchase orders", exact: true })
    .click();
  const orderRow = supplierPage
    .getByRole("row")
    .filter({ hasText: purchaseOrderTitle });
  await orderRow.getByRole("link", { name: /^PO-/ }).click();
  await expect(
    supplierPage.getByRole("heading", { name: purchaseOrderTitle }),
  ).toBeVisible();
  await expect(
    supplierPage.getByText("Browser internal price terms"),
  ).toHaveCount(0);
  const acknowledgement = supplierPage.getByRole("form", {
    name: "Acknowledge purchase order",
  });
  await acknowledgement
    .getByLabel("Reason")
    .fill("Supplier acknowledges browser purchase order");
  await acknowledgement
    .getByRole("button", { name: "Acknowledge purchase order" })
    .click();
  await expect(
    supplierPage.getByText("ACKNOWLEDGED", { exact: true }),
  ).toBeVisible();

  let commitment = supplierPage.getByRole("form", {
    name: "Append commitment revision",
  });
  await commitment
    .getByLabel("Supplier note")
    .fill("Original browser commitment");
  const originalDate = await commitment
    .getByLabel("Committed date for PLATE-SS304-6MM")
    .inputValue();
  await commitment
    .getByRole("button", { name: "Append commitment revision" })
    .click();
  await expect(
    supplierPage.getByText("Commitment revision 1", { exact: true }),
  ).toBeVisible();
  const lineRow = supplierPage
    .getByRole("row")
    .filter({ hasText: "PLATE-SS304-6MM" });
  await expect(
    lineRow.getByText(originalDate, { exact: true }).first(),
  ).toBeVisible();

  commitment = supplierPage.getByRole("form", {
    name: "Append commitment revision",
  });
  await commitment
    .getByLabel("Committed date for PLATE-SS304-6MM")
    .fill("2026-12-01");
  await commitment
    .getByLabel("Supplier note")
    .fill("Revised browser commitment");
  await commitment
    .getByRole("button", { name: "Append commitment revision" })
    .click();
  await expect(
    supplierPage.getByText("Commitment revision 2", { exact: true }),
  ).toBeVisible();
  await expect(lineRow.getByText(originalDate, { exact: true })).toHaveCount(2);
  await expect(lineRow.getByText("2026-12-01", { exact: true })).toBeVisible();
  await supplierContext.close();
});
