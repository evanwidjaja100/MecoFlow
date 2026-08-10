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

function fixture<T>(script: string): T {
  return JSON.parse(
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as T;
}

test("quarantines material, completes supplier NCR response, and consumes an allocation", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  const receiving = fixture<{
    bomRevisionId: string;
    orderId: string;
    projectId: string;
    unique: string;
  }>("tests/e2e/setup-receiving-fixture.ts");
  const allocation = fixture<{
    bomLineId: string;
    itemCode: string;
    lotId: string;
    lotNumber: number;
  }>("tests/e2e/setup-phase-six-b-allocation-fixture.ts");
  const title = `Browser quarantine NCR ${receiving.unique}`;
  const confidential = `Internal-only disposition ${receiving.unique}`;
  const shared = `Approved shared disposition ${receiving.unique}`;

  const internalContext = await browser.newContext({
    hasTouch: true,
    viewport: { height: 768, width: 1024 },
  });
  const supplierContext = await browser.newContext();
  try {
    const internalPage = await internalContext.newPage();
    await login(internalPage, "Internal administrator");
    await internalPage.goto(
      `/internal/projects/${receiving.projectId}/boms/revisions/${receiving.bomRevisionId}`,
    );
    const review = internalPage.getByRole("form", {
      name: "Submit for review",
    });
    await review
      .getByLabel("Reason")
      .fill("Review quarantine browser requirement");
    await review.getByRole("button", { name: "Submit for review" }).click();
    const release = internalPage.getByRole("form", {
      name: "Release revision",
    });
    await release
      .getByLabel("Reason")
      .fill("Release quarantine browser requirement");
    await release.getByRole("button", { name: "Release revision" }).click();
    await expect(
      internalPage.getByText("RELEASED", { exact: true }),
    ).toBeVisible();

    const supplierPage = await supplierContext.newPage();
    await login(supplierPage, "Supplier administrator");
    await supplierPage.goto(`/supplier/purchase-orders/${receiving.orderId}`);
    const createAsn = supplierPage.getByRole("form", {
      name: "Create advance shipment notice",
    });
    const reference = `QUALITY-ASN-${receiving.unique}`;
    await createAsn.getByLabel("Supplier reference").fill(reference);
    await createAsn.getByLabel("Ship quantity for PLATE-SS304-6MM").fill("3");
    await createAsn
      .getByLabel("Package reference for PLATE-SS304-6MM")
      .fill("PKG-QUALITY-1");
    await createAsn.getByRole("button", { name: "Create draft ASN" }).click();
    await expect(
      supplierPage.getByRole("heading", { name: reference }),
    ).toBeVisible();
    const submitAsn = supplierPage.getByRole("form", { name: "Submit ASN" });
    await submitAsn
      .getByLabel("Reason")
      .fill("Submit quality browser shipment");
    await submitAsn.getByRole("button", { name: "Submit ASN" }).click();
    await expect(
      supplierPage.getByText("SUBMITTED", { exact: true }),
    ).toBeVisible();
    const dispatch = supplierPage.getByRole("form", { name: "Dispatch ASN" });
    await dispatch
      .getByLabel("Reason")
      .fill("Dispatch quality browser shipment");
    await dispatch.getByRole("button", { name: "Mark in transit" }).click();
    await expect(
      supplierPage.getByText("IN TRANSIT", { exact: true }),
    ).toBeVisible();

    await internalPage.goto(
      `/internal/projects/${receiving.projectId}/receiving`,
    );
    const asnCard = internalPage.locator("article.receiving-card").filter({
      hasText: reference,
    });
    await asnCard
      .getByRole("form", { name: `Record arrival ${reference}` })
      .getByRole("button", { name: "Record arrival" })
      .click();
    await expect(asnCard.getByText("ARRIVED", { exact: true })).toBeVisible();
    await asnCard.getByText("Create draft goods receipt").click();
    const receipt = asnCard.getByRole("form", {
      name: `Create receipt for ${reference}`,
    });
    await receipt.getByLabel("Warehouse location").fill("Quality Dock 6B");
    await receipt.getByLabel("Received quantity (ea)").fill("3");
    await receipt.getByLabel("Heat number").fill(`HEAT-${receiving.unique}`);
    await receipt.getByLabel("Batch number").fill(`BATCH-${receiving.unique}`);
    await receipt.getByRole("button", { name: "Save draft receipt" }).click();
    await expect(internalPage).toHaveURL(/\/receiving\/[0-9a-f-]{36}$/i);
    await expect(
      internalPage.getByText("DRAFT", { exact: true }),
    ).toBeVisible();
    await internalPage.getByRole("button", { name: "Post receipt" }).click();
    await expect(
      internalPage.getByText("POSTED", { exact: true }),
    ).toBeVisible();
    await internalPage
      .getByRole("button", { name: "Open receiving inspection" })
      .click();
    await expect(internalPage).toHaveURL(/\/inspections\/[0-9a-f-]{36}$/i);
    await internalPage.getByLabel("Result").first().selectOption("FAIL");
    await internalPage
      .getByRole("button", { name: "Save inspection results" })
      .click();
    await expect(
      internalPage.getByText(/Recorded.*nonconforming/),
    ).toBeVisible();
    const finalization = internalPage
      .getByRole("heading", {
        name: "Finalize disposition",
      })
      .locator("..");
    const disposition = finalization.getByRole("combobox", {
      name: /^Disposition/,
    });
    const acceptedQuantity = finalization.getByLabel("Accepted quantity");
    await disposition.selectOption("QUARANTINED", { timeout: 15_000 });
    await acceptedQuantity.fill("0", { timeout: 15_000 });
    await finalization
      .getByLabel("Rejected quantity")
      .fill("0", { timeout: 15_000 });
    await finalization
      .getByLabel("Disposition reason")
      .fill("Quarantine browser material pending supplier response", {
        timeout: 15_000,
      });
    await expect(disposition).toHaveValue("QUARANTINED");
    await expect(acceptedQuantity).toHaveValue("0");
    await finalization
      .getByRole("button", { name: "Finalize inspection" })
      .click({ timeout: 15_000 });
    await expect(
      internalPage.getByText("QUARANTINED", { exact: true }),
    ).toBeVisible();

    const ncrForm = internalPage
      .getByRole("heading", { name: "Raise nonconformance report" })
      .locator("..");
    await ncrForm.getByLabel("NCR title").fill(title);
    await ncrForm
      .getByRole("textbox", { name: "Internal disposition notes" })
      .fill(confidential);
    await ncrForm.getByRole("button", { name: "Create NCR draft" }).click();
    await expect(
      internalPage.getByRole("heading", { name: new RegExp(title) }),
    ).toBeVisible();
    await internalPage
      .getByRole("button", { name: "Issue to supplier" })
      .click();
    await expect(
      internalPage.getByText("ISSUED", { exact: true }),
    ).toBeVisible();

    await supplierPage.goto("/supplier/ncrs");
    await supplierPage.getByRole("link", { name: new RegExp(title) }).click();
    await expect(supplierPage.getByText(confidential)).toHaveCount(0);
    await supplierPage
      .getByLabel("Response message")
      .fill("Supplier acknowledges the quarantined material and investigation");
    await supplierPage
      .getByLabel("Root cause")
      .fill("Packaging control failed before shipment release");
    await supplierPage
      .getByLabel("Corrective action")
      .fill("Replace material and add packaging verification checkpoint");
    await supplierPage
      .getByRole("button", { name: "Submit retained response" })
      .click();
    await expect(
      supplierPage.getByText("SUPPLIER RESPONDED", { exact: true }),
    ).toBeVisible();

    await internalPage.reload();
    await expect(
      internalPage.getByText(
        "Packaging control failed before shipment release",
      ),
    ).toBeVisible();
    await internalPage
      .getByRole("textbox", { name: "Internal disposition notes" })
      .fill(shared);
    await internalPage
      .getByLabel("Explicitly share these disposition notes with supplier")
      .check();
    await internalPage.getByRole("button", { name: "Close NCR" }).click();
    await expect(
      internalPage.getByText("CLOSED", { exact: true }),
    ).toBeVisible();
    await supplierPage.reload();
    await expect(supplierPage.getByText(shared)).toBeVisible();

    await internalPage.goto(
      `/internal/projects/${receiving.projectId}/quality`,
    );
    await internalPage
      .getByLabel("Accepted inventory lot")
      .selectOption(allocation.lotId);
    await internalPage
      .getByLabel("Released BOM line")
      .selectOption(allocation.bomLineId);
    await internalPage.getByLabel("Quantity").fill("3");
    await internalPage
      .getByRole("button", { name: "Allocate material" })
      .click();
    const allocationCard = internalPage.locator("article.panel").filter({
      hasText: allocation.itemCode,
    });
    await expect(
      allocationCard.getByText("ALLOCATED", { exact: true }),
    ).toBeVisible();
    await allocationCard.getByRole("button", { name: "Consume" }).click();
    await expect(
      allocationCard.getByText("CONSUMED", { exact: true }),
    ).toBeVisible();
    await expect(
      allocationCard.getByText(/ALLOCATED → CONSUMED \(3\)/),
    ).toBeVisible();
  } finally {
    await internalContext.close().catch(() => undefined);
    await supplierContext.close().catch(() => undefined);
  }
});
