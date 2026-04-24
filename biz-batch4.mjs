// Batch 4 — Find a non-Hoàn thành order, inspect cancel dialog + status transition UI.
import { BASE, launchBrowser, newPage, snap, writeResults } from './biz-shared.mjs';

async function main() {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const results = { id: 'TS-ORD-017-018-006', cancelDialog: null, statusTransition: null, orderList: [] };

  // Get all order ids + statuses from /orders list page
  await page.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(1500);
  results.orderList = await page.$$eval('tbody tr', rows => rows.map(r => {
    const cells = [...r.querySelectorAll('td')].map(c => c.textContent.trim());
    const link = r.querySelector('a[href^="/orders/"]');
    return { href: link?.getAttribute('href'), cells };
  }).filter(r => r.href));

  // Find a cancellable non-Hoàn thành order
  const cancellable = results.orderList.find(o =>
    o.cells.some(c => ['Nháp', 'Chờ duyệt', 'Đã xác nhận', 'Đang tìm hàng', 'Đã đặt hàng', 'Tại kho TQ'].some(s => c.includes(s)))
  );

  if (cancellable) {
    await page.goto(`${BASE}${cancellable.href}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1500);
    await snap(page, 'TS-ORD-006-cancellable-order');

    // Check for cancel button and click
    const cancelBtn = await page.$('button:has-text("Hủy đơn")');
    const holdBtn = await page.$('button:has-text("Tạm giữ")');
    const nextBtn = await page.$('button:has-text("Gửi duyệt"), button:has-text("Xác nhận"), button:has-text("Tiếp tục"), button:has-text("Đặt hàng"), button:has-text("Giao hàng"), button:has-text("Hoàn thành"), button:has-text("Vận chuyển"), button:has-text("Thông quan"), button:has-text("Nhập kho TQ"), button:has-text("Nhập kho VN")');

    results.cancelDialog = { orderUrl: cancellable.href, cancelBtnFound: Boolean(cancelBtn), holdBtnFound: Boolean(holdBtn), nextBtnFound: Boolean(nextBtn) };

    if (cancelBtn) {
      await cancelBtn.click();
      await page.waitForTimeout(1200);
      await snap(page, 'TS-ORD-017-cancel-dialog-open');
      const dialog = await page.$('[role="dialog"], [role="alertdialog"]');
      if (dialog) {
        const dialogText = await dialog.textContent();
        const dialogHtml = await dialog.innerHTML();
        const hasReasonField = Boolean(await dialog.$('textarea, input[type="text"]'));
        const buttons = await dialog.$$eval('button', bs => bs.map(b => b.textContent.trim()));
        results.cancelDialog.dialog = {
          visible: true,
          textSnippet: dialogText.slice(0, 300),
          hasReasonField,
          buttons,
          hasLyDoLabel: /lý do/i.test(dialogText),
        };

        // Try submit without filling reason
        const confirmBtn = await dialog.$('button:has-text("Hủy đơn"), button:has-text("Xác nhận")');
        if (confirmBtn) {
          const isDisabled = await confirmBtn.isDisabled();
          results.cancelDialog.dialog.confirmBtnInitiallyDisabled = isDisabled;
          if (!isDisabled) {
            await confirmBtn.click();
            await page.waitForTimeout(800);
            const stillOpen = Boolean(await page.$('[role="dialog"], [role="alertdialog"]'));
            const errs = await page.$$eval('.text-red-500, .text-red-600', els => els.map(e => e.textContent.trim()).filter(Boolean));
            results.cancelDialog.dialog.afterEmptySubmit = { stillOpen, errs: errs.slice(0, 5) };
            await snap(page, 'TS-ORD-017-cancel-empty-submit');
          }
        }

        // Close dialog (Escape)
        await page.keyboard.press('Escape').catch(() => {});
      } else {
        results.cancelDialog.dialog = { visible: false };
      }
    }

    // Hold dialog test
    await page.waitForTimeout(500);
    const holdBtn2 = await page.$('button:has-text("Tạm giữ")');
    if (holdBtn2) {
      await holdBtn2.click();
      await page.waitForTimeout(1200);
      await snap(page, 'TS-ORD-018-hold-dialog-open');
      const dialog = await page.$('[role="dialog"], [role="alertdialog"]');
      if (dialog) {
        const dialogText = await dialog.textContent();
        results.cancelDialog.holdDialog = {
          visible: true,
          textSnippet: dialogText.slice(0, 300),
          hasReasonField: Boolean(await dialog.$('textarea, input')),
          buttons: await dialog.$$eval('button', bs => bs.map(b => b.textContent.trim())),
        };
        await page.keyboard.press('Escape').catch(() => {});
      }
    }

    // Status transition: click next button
    await page.waitForTimeout(500);
    const nextBtn2 = await page.$('button:has-text("Gửi duyệt"), button:has-text("Xác nhận"), button:has-text("Tiếp tục")');
    if (nextBtn2) {
      const beforeStatus = await page.evaluate(() => {
        const badges = [...document.querySelectorAll('[class*="inline-flex"], span')];
        const stat = badges.find(b => ['Nháp', 'Chờ duyệt', 'Đã xác nhận'].some(s => b.textContent.trim() === s));
        return stat?.textContent.trim() || null;
      });
      const btnLabel = (await nextBtn2.textContent()).trim();
      await snap(page, 'TS-ORD-006-before-transition');
      await nextBtn2.click();
      await page.waitForTimeout(2500);
      const afterStatus = await page.evaluate(() => {
        const badges = [...document.querySelectorAll('[class*="inline-flex"], span')];
        const stat = badges.find(b => ['Nháp', 'Chờ duyệt', 'Đã xác nhận', 'Đang tìm hàng', 'Đã đặt hàng', 'Tại kho TQ'].some(s => b.textContent.trim() === s));
        return stat?.textContent.trim() || null;
      });
      await snap(page, 'TS-ORD-006-after-transition');
      results.statusTransition = { orderUrl: cancellable.href, beforeStatus, btnLabel, afterStatus, changed: beforeStatus !== afterStatus };
    }
  } else {
    results.cancelDialog = { skipped: 'no cancellable order found', orderListSize: results.orderList.length };
  }

  await ctx.close();
  await browser.close();
  writeResults('batch4', results);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
