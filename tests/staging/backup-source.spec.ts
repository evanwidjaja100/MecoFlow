import { createHash } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";

const projectA = "93000000-0000-4000-8000-000000000001";
const rehearsalId = process.env.BACKUP_REHEARSAL_SOURCE_ID ?? "";

async function login(page: Page) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto("/login");
    await page
      .getByRole("link", { name: "Continue to identity provider" })
      .click();
    await page.locator("#username").fill("staging.internal@mecoflow.invalid");
    await page
      .locator("#password")
      .fill(process.env.STAGING_INTERNAL_PASSWORD ?? "");
    await page.locator("#kc-login").click();
    try {
      await expect(
        page.getByRole("heading", { name: "Internal overview" }),
      ).toBeVisible();
      return;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

async function uploadDocument(
  page: Page,
  input: {
    body: Buffer;
    category: string;
    fileName: string;
    mimeType: string;
    title: string;
  },
) {
  const existingDocument = page
    .locator("details")
    .filter({ hasText: input.title });
  if ((await existingDocument.count()) > 0) return existingDocument;

  const form = page.getByRole("form", { name: "Upload project document" });
  await form.getByLabel("Title").fill(input.title);
  await form.getByLabel("Category").fill(input.category);
  await form
    .getByLabel("Description")
    .fill(`Fictional backup/restore rehearsal evidence ${rehearsalId}`);
  await form.getByLabel("File").setInputFiles({
    buffer: input.body,
    mimeType: input.mimeType,
    name: input.fileName,
  });
  await form.getByRole("button", { name: "Upload to quarantine" }).click();

  const document = page.locator("details").filter({ hasText: input.title });
  await expect(document.locator("summary")).toContainText("DRAFT", {
    timeout: 30_000,
  });
  await expect(document).toContainText(
    createHash("sha256").update(input.body).digest("hex"),
  );
  return document;
}

async function openDetails(document: Locator) {
  if ((await document.getAttribute("open")) === null) {
    await document.locator("summary").click();
  }
}

test("creates representative documents through the secured application flow", async ({
  page,
}) => {
  test.setTimeout(120_000);
  test.skip(!rehearsalId, "Only run while creating a restore rehearsal source");
  expect(rehearsalId).toMatch(/^[A-Za-z0-9._-]+$/);

  await login(page);
  await page.goto(`/internal/projects/${projectA}/documents`);
  await expect(
    page.getByRole("heading", { name: "Project documents" }),
  ).toBeVisible();

  const certificate = await uploadDocument(page, {
    body: Buffer.from(
      `MECO Flow fictional material certificate\nrehearsal=${rehearsalId}\nheat=STAGE-HEAT-001\n`,
    ),
    category: "Material certificate",
    fileName: `material-certificate-${rehearsalId}.txt`,
    mimeType: "text/plain",
    title: `Restore rehearsal certificate ${rehearsalId}`,
  });
  if ((await certificate.locator("summary").textContent())?.includes("DRAFT")) {
    await openDetails(certificate);
    await certificate
      .getByPlaceholder("Review reason")
      .fill("Representative clean document for the restore rehearsal");
    await certificate.getByRole("button", { name: "Submit review" }).click();
  }
  const reviewCertificate = page
    .locator("details")
    .filter({ hasText: `Restore rehearsal certificate ${rehearsalId}` });
  const reviewSummary = reviewCertificate.locator("summary");
  if ((await reviewSummary.textContent())?.includes("IN REVIEW")) {
    await openDetails(reviewCertificate);
    await reviewCertificate
      .getByPlaceholder("Approval reason")
      .fill("Approved only as fictional recovery-test evidence");
    await reviewCertificate.getByRole("button", { name: "Approve" }).click();
  }
  await expect(
    page
      .locator("details")
      .filter({ hasText: `Restore rehearsal certificate ${rehearsalId}` })
      .locator("summary"),
  ).toContainText("APPROVED");

  await uploadDocument(page, {
    body: Buffer.from(
      `package_reference,quantity,checksum_marker\nSTAGE-PKG-001,8,${rehearsalId}\n`,
    ),
    category: "Packing list",
    fileName: `packing-list-${rehearsalId}.csv`,
    mimeType: "text/csv",
    title: `Restore rehearsal packing list ${rehearsalId}`,
  });
});
