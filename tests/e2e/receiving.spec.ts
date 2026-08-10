import { execFileSync } from "node:child_process";
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

test("receives and finalizes an automatically created inspection in the tablet workflow", async ({
  browser,
}) => {
  test.setTimeout(120_000);
  const fixture = JSON.parse(
    execFileSync(
      process.execPath,
      ["node_modules/tsx/dist/cli.mjs", "tests/e2e/setup-receiving-fixture.ts"],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  ) as { orderId: string; projectId: string; unique: string };
  const { orderId, projectId, unique } = fixture;

  const supplierContext = await browser.newContext();
  const internalContext = await browser.newContext({
    hasTouch: true,
    viewport: { height: 768, width: 1024 },
  });
  try {
    const supplierPage = await supplierContext.newPage();
    await login(supplierPage, "Supplier administrator");
    await supplierPage.goto(`/supplier/purchase-orders/${orderId}`);
    const create = supplierPage.getByRole("form", {
      name: "Create advance shipment notice",
    });
    const reference = `BROWSER-ASN-${unique}`;
    await create.getByLabel("Supplier reference").fill(reference);
    await create.getByLabel("Carrier").fill("Fictional Logistics");
    await create.getByLabel("Tracking number").fill(`TRACK-${unique}`);
    await create.getByLabel("Ship quantity for PLATE-SS304-6MM").fill("3");
    await create
      .getByLabel("Package reference for PLATE-SS304-6MM")
      .fill("PKG-TABLET-1");
    await create.getByRole("button", { name: "Create draft ASN" }).click();
    await expect(
      supplierPage.getByRole("heading", { name: reference }),
    ).toBeVisible();
    const submit = supplierPage.getByRole("form", { name: "Submit ASN" });
    await submit.getByLabel("Reason").fill("Submit tablet browser shipment");
    await submit.getByRole("button", { name: "Submit ASN" }).click();
    await expect(
      supplierPage.getByText("SUBMITTED", { exact: true }),
    ).toBeVisible();
    const dispatch = supplierPage.getByRole("form", { name: "Dispatch ASN" });
    await dispatch
      .getByLabel("Reason")
      .fill("Dispatch tablet browser shipment");
    await dispatch.getByRole("button", { name: "Mark in transit" }).click();
    await expect(
      supplierPage.getByText("IN TRANSIT", { exact: true }),
    ).toBeVisible();

    const internalPage = await internalContext.newPage();
    await login(internalPage, "Internal administrator");
    await internalPage.goto(`/internal/projects/${projectId}/receiving`);
    await expect(
      internalPage.getByRole("heading", { name: "Shipments and receiving" }),
    ).toBeVisible();
    const asnCard = internalPage.locator("article.receiving-card").filter({
      hasText: reference,
    });
    const arrival = asnCard.getByRole("form", {
      name: `Record arrival ${reference}`,
    });
    await arrival.getByRole("button", { name: "Record arrival" }).click();
    await expect(asnCard.getByText("ARRIVED", { exact: true })).toBeVisible();
    await asnCard.getByText("Create draft goods receipt").click();
    const receipt = asnCard.getByRole("form", {
      name: `Create receipt for ${reference}`,
    });
    await receipt.getByLabel("Warehouse location").fill("Tablet Dock 7");
    await receipt.getByLabel("Received quantity (ea)").fill("3");
    await receipt.getByLabel("Heat number").fill("HEAT-TABLET-7");
    await receipt.getByLabel("Batch number").fill("BATCH-TABLET-7");
    await receipt.getByLabel("Manufacturer").fill("Fictional Metals Ltd");
    await receipt.getByRole("button", { name: "Save draft receipt" }).click();
    await expect(internalPage).toHaveURL(/\/receiving\/[0-9a-f-]{36}$/i);
    await expect(
      internalPage.getByText("DRAFT", { exact: true }),
    ).toBeVisible();
    await internalPage.getByRole("button", { name: "Post receipt" }).click();
    await expect(
      internalPage.getByText("POSTED", { exact: true }),
    ).toBeVisible();
    await expect(
      internalPage.getByText(/LOT-\d{6} · AWAITING INSPECTION/),
    ).toBeVisible();
    await expect(
      internalPage.getByText("HEAT-TABLET-7", { exact: true }),
    ).toBeVisible();
    await expect(
      internalPage.getByText("BATCH-TABLET-7", { exact: true }),
    ).toBeVisible();
    await internalPage
      .getByRole("button", { name: "Open receiving inspection" })
      .click();
    await expect(internalPage).toHaveURL(/\/inspections\/[0-9a-f-]{36}$/i);
    await expect(
      internalPage.getByRole("heading", {
        name: "PLATE-SS304-6MM — Stainless steel plate 304, 6 mm",
      }),
    ).toBeVisible();
    await internalPage
      .getByRole("button", { name: "Save inspection results" })
      .click();
    await expect(internalPage.getByText(/Recorded · conforming/)).toBeVisible();
    await internalPage
      .getByRole("button", { name: "Finalize inspection" })
      .click();
    await expect(
      internalPage.getByRole("heading", { name: "Final disposition" }),
    ).toBeVisible();
    await expect(
      internalPage.getByText("ACCEPTED", { exact: true }),
    ).toBeVisible();
  } finally {
    await supplierContext.close();
    await internalContext.close();
  }
});
