import { expect, test } from "@playwright/test";

async function login(
  page: import("@playwright/test").Page,
  persona: "Internal administrator" | "Supplier administrator",
) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Sign in to MECO Flow" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Continue to identity provider" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test identity provider" }),
  ).toBeVisible();
  await page.getByRole("button", { name: persona }).click();
}

test("logs in with OIDC code and PKCE without browser token storage", async ({
  page,
}) => {
  await login(page, "Internal administrator");
  await expect(
    page.getByRole("heading", { name: "Internal overview" }),
  ).toBeVisible();
  expect(await page.evaluate(() => Object.keys(window.localStorage))).toEqual(
    [],
  );
});

test("supports authorized internal navigation", async ({ page }) => {
  await login(page, "Internal administrator");
  await page.getByRole("link", { name: "Administration" }).click();
  await expect(
    page.getByRole("heading", { name: "Administration", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Organizations" }).click();
  await expect(
    page.getByRole("heading", { name: "Organizations" }),
  ).toBeVisible();
});

test("shows the supplier shell and denies internal administration", async ({
  page,
}) => {
  await login(page, "Supplier administrator");
  await expect(
    page.getByRole("heading", { name: "Supplier overview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Supplier navigation" }),
  ).toBeVisible();
  await page.goto("/internal/administration");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
});
