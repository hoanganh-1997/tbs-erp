# Playwright smoke tests

## Chạy test

```bash
# Dev server phải chạy trước ở localhost:3000
npm run dev           # terminal 1
npm run test:e2e      # terminal 2
```

## Các command khác

```bash
npm run test:e2e -- --headed         # mở browser thấy được (X11 required)
npm run test:e2e -- --debug          # debug mode (từng bước)
npm run test:e2e -- smoke.spec.ts    # chạy file cụ thể
npm run test:e2e -- --reporter=list  # tối giản output
npx playwright show-report           # xem HTML report sau khi chạy
```

## Cấu trúc

- `playwright.config.ts` (ở root tbs-erp): config chính — baseURL, timeout, projects.
- `tests/e2e/*.spec.ts`: test files.
- `playwright-report/`: HTML report tự sinh (đã gitignore).

## Env variables

- `PLAYWRIGHT_BASE_URL` — override URL target (mặc định `http://localhost:3000`).
- `CI=1` — bật retry=2, workers=2, forbidOnly.

## Viết test mới

```ts
import { test, expect } from "@playwright/test";

test("tên test rõ ràng", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Đơn hàng" })).toBeVisible();
});
```

**Best practice:**
- Ưu tiên selector có ngữ nghĩa: `getByRole`, `getByText`, `getByLabel` thay vì CSS class.
- Tránh `page.locator(".bg-[#4F5FD9]")` — class Tailwind thay đổi theo design.
- Dùng `exact: true` khi text trùng nhau nhiều chỗ (vd "Đơn hàng" xuất hiện cả sidebar và heading).
- Navigation expectation dùng `toHaveURL(/pattern/)` thay vì string literal để tránh phụ thuộc port/host.
