import { expect, test, type Browser, type Page } from "@playwright/test";

const projectIds = [
  "96000000-0000-4000-8000-000000000001",
  "96000000-0000-4000-8000-000000000002",
  "96000000-0000-4000-8000-000000000003",
  "96000000-0000-4000-8000-000000000004",
];
const missingProjectId = "96000000-0000-4000-8000-000000000099";

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
}

async function supplierPage(browser: Browser, suffix: "a" | "b") {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const upper = suffix.toUpperCase();
  await login(
    page,
    `staging.supplier.${suffix}@mecoflow.invalid`,
    process.env[`STAGING_SUPPLIER_${upper}_PASSWORD`] ?? "",
  );
  await expect(
    page.getByRole("heading", { name: "Supplier overview" }),
  ).toBeVisible();
  return { context, page };
}

async function projectResponse(page: Page, id: string) {
  return page.evaluate(async (projectId) => {
    const response = await fetch(`/api/v1/projects/${projectId}`, {
      cache: "no-store",
    });
    return { body: await response.json(), status: response.status };
  }, id);
}

test.describe.serial("controlled pilot acceptance", () => {
  test("records release metadata and activates four projects through commands", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await login(
      page,
      "staging.internal@mecoflow.invalid",
      process.env.STAGING_INTERNAL_PASSWORD ?? "",
    );
    await expect(
      page.getByRole("heading", { name: "Internal overview" }),
    ).toBeVisible();
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);

    for (const projectId of projectIds) {
      await page.goto(`/internal/projects/${projectId}`);
      const state = page.locator("span.status").first();
      const current = (await state.textContent())?.trim();
      if (current === "DRAFT") {
        await page.getByLabel("Target state").selectOption("PLANNED");
        await page
          .getByLabel("Reason")
          .fill("Pilot acceptance planning authorization");
        await page.getByRole("button", { name: "Transition project" }).click();
        await expect(state).toHaveText("PLANNED");
      }
      if ((await state.textContent())?.trim() === "PLANNED") {
        await page.getByLabel("Target state").selectOption("ACTIVE");
        await page
          .getByLabel("Reason")
          .fill("Pilot acceptance activation authorization");
        await page.getByRole("button", { name: "Transition project" }).click();
      }
      await expect(state).toHaveText("ACTIVE");
    }

    const health = await page.evaluate(async () => {
      const response = await fetch("/health/live", { cache: "no-store" });
      return { body: await response.json(), status: response.status };
    });
    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({
      status: "ok",
      version: process.env.APP_VERSION,
    });
  });

  test("creates critical and noncritical pilot BOM, procurement, and partial delivery", async ({
    browser,
    page,
  }) => {
    test.setTimeout(420_000);
    const unique = Date.now();
    const requisitionTitle = `Pilot requisition ${unique}`;
    const orderTitle = `Pilot purchase order ${unique}`;
    await login(
      page,
      "staging.internal@mecoflow.invalid",
      process.env.STAGING_INTERNAL_PASSWORD ?? "",
    );
    await page.goto(`/internal/projects/${projectIds[0]}/boms`);
    const upload = page.getByRole("form", { name: "Upload BOM import" });
    await upload.getByLabel("CSV or XLSX file (maximum 5 MiB)").setInputFiles({
      buffer: Buffer.from(
        "item_code,item_name,quantity,unit_code,criticality,notes\n" +
          "PILOT-VALVE-CRIT,,10,EA,CRITICAL,Certificate required before acceptance\n" +
          "PILOT-GASKET-STD,,4,EA,NORMAL,Visual receiving inspection\n",
      ),
      mimeType: "text/csv",
      name: `pilot-bom-${unique}.csv`,
    });
    await upload.getByRole("button", { name: "Upload and validate" }).click();
    await expect(
      page.getByRole("heading", { name: "Confirm draft creation" }),
    ).toBeVisible({
      timeout: 30_000,
    });
    const confirmation = page.getByRole("form", { name: "Confirm BOM import" });
    await confirmation.getByLabel("Revision title").fill(`Pilot BOM ${unique}`);
    await confirmation.getByLabel(/I confirm that this dry run/).check();
    await confirmation
      .getByRole("button", { name: "Create draft revision" })
      .click();
    const review = page.getByRole("form", { name: "Submit for review" });
    await review.getByLabel("Reason").fill("Pilot engineering review complete");
    await review.getByRole("button", { name: "Submit for review" }).click();
    const release = page.getByRole("form", { name: "Release revision" });
    await release.getByLabel("Reason").fill("Pilot BOM release authorized");
    await release.getByRole("button", { name: "Release revision" }).click();
    await expect(page.getByText("RELEASED", { exact: true })).toBeVisible();

    await page.goto(`/internal/projects/${projectIds[0]}/requisitions`);
    await page.getByLabel("Title").fill(requisitionTitle);
    for (const code of ["PILOT-VALVE-CRIT", "PILOT-GASKET-STD"]) {
      await page.getByLabel(`Select ${code}`).check();
    }
    await page
      .getByRole("button", { name: "Create draft requisition" })
      .click();
    const summary = page.getByLabel("Requisition summary");
    await expect(summary.getByText("DRAFT", { exact: true })).toBeVisible();
    const submit = page
      .getByRole("button", { name: "Submit requisition" })
      .locator("..");
    await submit.getByLabel("Reason").fill("Pilot requisition submitted");
    await submit.getByRole("button", { name: "Submit requisition" }).click();
    const approve = page
      .getByRole("button", { name: "Approve requisition" })
      .locator("..");
    await approve.getByLabel("Reason").fill("Pilot requisition approved");
    await approve.getByRole("button", { name: "Approve requisition" }).click();
    await expect(summary.getByText("APPROVED", { exact: true })).toBeVisible();

    await page.goto(`/internal/projects/${projectIds[0]}/purchase-orders`);
    const createOrder = page.getByRole("form", {
      name: "Create purchase order",
    });
    await createOrder.getByLabel("Title").fill(orderTitle);
    await createOrder
      .locator('select[name="supplierOrganizationId"]')
      .selectOption("91000000-0000-4000-8000-000000000002");
    await createOrder
      .getByLabel("Revision reason")
      .fill("Pilot purchase order created");
    await createOrder
      .getByLabel("Supplier message")
      .fill("Provide partial shipment with traceability");
    await createOrder
      .getByLabel("Internal commercial terms")
      .fill("Pilot-confidential terms");
    for (const code of ["PILOT-VALVE-CRIT", "PILOT-GASKET-STD"]) {
      const row = createOrder
        .getByRole("row")
        .filter({ hasText: requisitionTitle })
        .filter({ hasText: code });
      await row.getByLabel(`Select approved ${code}`).check();
    }
    await createOrder
      .getByRole("button", { name: "Create draft purchase order" })
      .click();
    await expect(page).toHaveURL(/\/purchase-orders\/[0-9a-f-]{36}$/i);
    const purchaseOrderUrl = page.url();
    const purchaseOrderId = purchaseOrderUrl.split("/").at(-1)!;
    const send = page
      .getByRole("button", { name: "Send purchase order" })
      .locator("..");
    await send
      .getByLabel("Reason")
      .fill("Pilot order sent to assigned supplier");
    await send.getByRole("button", { name: "Send purchase order" }).click();
    await expect(page.getByText("SENT", { exact: true })).toBeVisible();

    const supplier = await supplierPage(browser, "a");
    try {
      await supplier.page.goto(`/supplier/purchase-orders/${purchaseOrderId}`);
      await expect(
        supplier.page.getByText("Pilot-confidential terms"),
      ).toHaveCount(0);
      const acknowledgement = supplier.page.getByRole("form", {
        name: "Acknowledge purchase order",
      });
      await acknowledgement
        .getByLabel("Reason")
        .fill("Pilot supplier acknowledgement");
      await acknowledgement
        .getByRole("button", { name: "Acknowledge purchase order" })
        .click();
      await expect(
        supplier.page.getByText("ACKNOWLEDGED", { exact: true }),
      ).toBeVisible();

      const createAsn = supplier.page.getByRole("form", {
        name: "Create advance shipment notice",
      });
      const reference = `PILOT-ASN-${unique}`;
      await createAsn.getByLabel("Supplier reference").fill(reference);
      await createAsn.getByLabel("Carrier").fill("Fictional Pilot Logistics");
      await createAsn
        .getByLabel("Ship quantity for PILOT-VALVE-CRIT")
        .fill("6");
      await createAsn
        .getByLabel("Package reference for PILOT-VALVE-CRIT")
        .fill("PKG-VALVE-1");
      await createAsn
        .getByLabel("Ship quantity for PILOT-GASKET-STD")
        .fill("2");
      await createAsn
        .getByLabel("Package reference for PILOT-GASKET-STD")
        .fill("PKG-GASKET-1");
      await createAsn.getByRole("button", { name: "Create draft ASN" }).click();
      const submitAsn = supplier.page.getByRole("form", { name: "Submit ASN" });
      await submitAsn
        .getByLabel("Reason")
        .fill("Pilot partial shipment submitted");
      await submitAsn.getByRole("button", { name: "Submit ASN" }).click();
      const dispatch = supplier.page.getByRole("form", {
        name: "Dispatch ASN",
      });
      await dispatch
        .getByLabel("Reason")
        .fill("Pilot partial shipment dispatched");
      await dispatch.getByRole("button", { name: "Mark in transit" }).click();
      await expect(
        supplier.page.getByText("IN TRANSIT", { exact: true }),
      ).toBeVisible();

      // Preserve the staging limit of 30 requests per 60-second window while
      // moving this long acceptance scenario between supplier and warehouse roles.
      await page.waitForTimeout(65_000);

      await page.goto(`/internal/projects/${projectIds[0]}/receiving`);
      const asnCard = page
        .locator("article.receiving-card")
        .filter({ hasText: reference });
      await asnCard
        .getByRole("form", { name: `Record arrival ${reference}` })
        .getByRole("button", { name: "Record arrival" })
        .click();
      await asnCard.getByText("Create draft goods receipt").click();
      const receipt = asnCard.getByRole("form", {
        name: `Create receipt for ${reference}`,
      });
      await receipt.getByLabel("Warehouse location").fill("Pilot Dock 1");
      await receipt.getByLabel("Received quantity (ea)").nth(0).fill("6");
      await receipt.getByLabel("Received quantity (ea)").nth(1).fill("2");
      await receipt.getByRole("button", { name: "Save draft receipt" }).click();
      await page.getByRole("button", { name: "Post receipt" }).click();
      await expect(page.getByText("POSTED", { exact: true })).toBeVisible();

      const standardLine = page
        .locator("article.receiving-line")
        .filter({ hasText: "PILOT-GASKET-STD" });
      await standardLine
        .getByRole("button", { name: "Open receiving inspection" })
        .click();
      await page.getByLabel("Result").selectOption("FAIL");
      await page
        .getByRole("button", { name: "Save inspection results" })
        .click();
      await expect(page.getByText(/Recorded.*nonconforming/)).toBeVisible();
      const finalization = page
        .getByRole("heading", { name: "Finalize disposition" })
        .locator("..");
      await finalization
        .getByRole("combobox", { name: /^Disposition/ })
        .selectOption("QUARANTINED");
      await finalization.getByLabel("Accepted quantity").fill("0");
      await finalization.getByLabel("Rejected quantity").fill("0");
      await finalization
        .getByLabel("Disposition reason")
        .fill("Pilot quarantine pending supplier corrective action");
      await finalization
        .getByRole("button", { name: "Finalize inspection" })
        .click();
      await expect(
        page.getByText("QUARANTINED", { exact: true }),
      ).toBeVisible();

      const ncrTitle = `Pilot NCR ${unique}`;
      const ncrForm = page
        .getByRole("heading", { name: "Raise nonconformance report" })
        .locator("..");
      await ncrForm.getByLabel("NCR title").fill(ncrTitle);
      await ncrForm
        .getByRole("textbox", { name: "Internal disposition notes" })
        .fill("Pilot internal-only assessment");
      await ncrForm.getByRole("button", { name: "Create NCR draft" }).click();
      await page.getByRole("button", { name: "Issue to supplier" }).click();
      await expect(page.getByText("ISSUED", { exact: true })).toBeVisible();

      await supplier.page.goto("/supplier/ncrs");
      await supplier.page
        .getByRole("link", { name: new RegExp(ncrTitle) })
        .click();
      await expect(
        supplier.page.getByText("Pilot internal-only assessment"),
      ).toHaveCount(0);
      await supplier.page
        .getByLabel("Response message")
        .fill("Pilot supplier acknowledges NCR");
      await supplier.page
        .getByLabel("Root cause")
        .fill("Pilot packaging control failure");
      await supplier.page
        .getByLabel("Corrective action")
        .fill("Pilot packaging checkpoint added");
      await supplier.page
        .getByRole("button", { name: "Submit retained response" })
        .click();
      await expect(
        supplier.page.getByText("SUPPLIER RESPONDED", { exact: true }),
      ).toBeVisible();
    } finally {
      await supplier.context.close().catch(() => undefined);
    }
  });

  test("proves supplier isolation and internal readiness/reporting surfaces", async ({
    browser,
    page,
  }) => {
    await login(
      page,
      "staging.internal@mecoflow.invalid",
      process.env.STAGING_INTERNAL_PASSWORD ?? "",
    );
    await page.goto("/internal/readiness");
    await expect(
      page.getByRole("heading", { name: "Management readiness dashboard" }),
    ).toBeVisible();
    await page.goto("/internal/reports");
    await expect(
      page.getByRole("heading", { name: "Reports and supplier scorecards" }),
    ).toBeVisible();

    const supplierA = await supplierPage(browser, "a");
    const supplierB = await supplierPage(browser, "b");
    try {
      const aOwn = await projectResponse(supplierA.page, projectIds[0]);
      const aForeign = await projectResponse(supplierA.page, projectIds[1]);
      const aMissing = await projectResponse(supplierA.page, missingProjectId);
      expect(aOwn.status).toBe(200);
      expect(aForeign.status).toBe(404);
      expect(aMissing.status).toBe(404);
      expect(aForeign.body).toMatchObject({
        error: { code: "RESOURCE_NOT_FOUND" },
      });
      expect(aMissing.body).toMatchObject({
        error: { code: "RESOURCE_NOT_FOUND" },
      });

      const bOwn = await projectResponse(supplierB.page, projectIds[1]);
      const bForeign = await projectResponse(supplierB.page, projectIds[0]);
      expect(bOwn.status).toBe(200);
      expect(bForeign.status).toBe(404);
    } finally {
      await supplierA.context.close();
      await supplierB.context.close();
    }
  });
});
