import { test, expect } from "@playwright/test";

test.describe("TBS ERP — smoke tests", () => {
  test("Dashboard loads with sidebar and main nav sections", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/./);

    const sidebar = page.locator("nav").first();
    await expect(sidebar).toBeVisible();

    await expect(sidebar.getByText("Tổng quan", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("Đơn hàng", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("KINH DOANH", { exact: true })).toBeVisible();
  });

  test("Navigate to Orders page via sidebar", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "Đơn hàng", exact: true }).first().click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("heading", { name: "Đơn hàng", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tạo đơn hàng/ })).toBeVisible();
  });

  test("Open create-order form from Orders page", async ({ page }) => {
    await page.goto("/orders");

    await page.getByRole("link", { name: /Tạo đơn hàng/ }).click();

    await expect(page).toHaveURL(/\/orders\/new$/);
    await expect(page.getByRole("heading", { name: "Tạo đơn hàng mới" })).toBeVisible();
    await expect(page.getByText("Thông tin chung")).toBeVisible();
    await expect(page.getByText("Khách hàng", { exact: true })).toBeVisible();
  });

  test("Create-order form validates empty submit", async ({ page }) => {
    await page.goto("/orders/new");

    const submit = page.getByRole("button", { name: /Tạo đơn hàng$/ });
    await expect(submit).toBeVisible();
    await submit.click();

    // Submission should NOT navigate away because required fields are empty.
    await expect(page).toHaveURL(/\/orders\/new$/);
  });

  test("Stub module shows ComingSoon state", async ({ page }) => {
    await page.goto("/debt-offset");

    await expect(page.getByText("Đang phát triển", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /Về Tổng quan/ })).toBeVisible();
  });
});
