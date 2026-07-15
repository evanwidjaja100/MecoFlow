import { expect, test } from "@playwright/test";

test("loads the accessible Phase 0 foundation and reaches API health", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "MECO Flow" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "System foundation" }),
  ).toBeVisible();
  await expect(page.getByText("API health")).toBeVisible();
  await expect(page.getByText("available", { exact: true })).toBeVisible();
});
