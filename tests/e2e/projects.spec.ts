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

test("creates, edits, and explicitly transitions a project", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Projects", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();

  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
  const code = `E2E-${suffix}`;
  const originalName = `Browser project ${suffix}`;
  const editedName = `Edited browser project ${suffix}`;
  await page.getByLabel("Project code").fill(code);
  await page.getByLabel("Project name").fill(originalName);
  await page.getByLabel("Planned start").first().fill("2026-08-03");
  await page.getByLabel("Planned end").first().fill("2026-12-18");
  await page
    .getByLabel("Description")
    .first()
    .fill("Created by the Phase 2 browser workflow");
  await page.getByRole("button", { name: "Create project" }).click();
  await expect(page.getByRole("heading", { name: originalName })).toBeVisible();
  await expect(page.getByText("DRAFT", { exact: true })).toBeVisible();

  await page.getByText("Edit project", { exact: true }).click();
  await page.getByLabel("Project name").fill(editedName);
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("heading", { name: editedName })).toBeVisible();

  await page.getByLabel("Target state").selectOption("PLANNED");
  await page.getByLabel("Reason").fill("Browser workflow planning approval");
  await page.getByRole("button", { name: "Transition project" }).click();
  await expect(page.getByText("PLANNED", { exact: true })).toBeVisible();
  await expect(page.getByText("DRAFT → PLANNED")).toBeVisible();
  await expect(
    page.getByText("Browser workflow planning approval"),
  ).toBeVisible();
});
