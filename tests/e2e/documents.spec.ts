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

test("uploads through quarantine and shows the document security table", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await page.getByRole("link", { name: "DEMO-2026" }).click();
  await page.getByRole("link", { name: "Open document workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Project documents" }),
  ).toBeVisible();
  await expect(page.getByText("ZIP files are prohibited.")).toBeVisible();

  const form = page.getByRole("form", { name: "Upload project document" });
  const title = `Browser certificate ${Date.now()}`;
  await form.getByLabel("Title").fill(title);
  await form.getByLabel("Category").fill("Certificate");
  await form.getByLabel("File").setInputFiles({
    buffer: Buffer.from("clean browser document fixture\n"),
    mimeType: "text/plain",
    name: `certificate-${Date.now()}.txt`,
  });
  await form.getByRole("button", { name: "Upload to quarantine" }).click();

  const uploadedDocument = page.locator("details").filter({ hasText: title });
  await expect(uploadedDocument.locator("summary")).toContainText(
    "SCAN FAILED",
    { timeout: 20_000 },
  );
  const isOpen = await uploadedDocument.evaluate(
    (element) => (element as HTMLDetailsElement).open,
  );
  if (!isOpen) await uploadedDocument.locator("summary").click();
  await expect(uploadedDocument).toHaveAttribute("open", "");
  await expect(
    uploadedDocument.getByText("SCAN FAILED", { exact: true }),
  ).toBeVisible();
  await expect(
    uploadedDocument.getByRole("cell", { name: /^ERROR text\/plain/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "File security" }),
  ).toBeVisible();
});
