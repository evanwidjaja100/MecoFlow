import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

function fixture<T>(script: string): T {
  return JSON.parse(
    execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", script], {
      cwd: process.cwd(),
      encoding: "utf8",
    }),
  ) as T;
}

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

test("reads an in-app notification and updates delivery preferences", async ({
  page,
}) => {
  const data = fixture<{
    notificationMessage: string;
    projectCode: string;
  }>("tests/e2e/setup-notifications-fixture.ts");
  await login(page);
  await page.getByRole("link", { name: "Notifications", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Notifications" }),
  ).toBeVisible();
  const notification = page.getByRole("article").filter({
    has: page.getByText(data.notificationMessage, { exact: true }),
  });
  await expect(notification.getByText(data.notificationMessage)).toBeVisible();
  await notification.getByRole("button", { name: "Mark as read" }).click();
  await expect(notification.getByText("Read", { exact: true })).toBeVisible();

  const preference = page
    .locator("form.notification-preference")
    .filter({ hasText: "Readiness status updates" });
  await preference.getByRole("checkbox", { name: "Email" }).check();
  await preference.getByRole("button", { name: "Save preference" }).click();
  await expect(
    preference.getByRole("checkbox", { name: "Email" }),
  ).toBeChecked();
});
