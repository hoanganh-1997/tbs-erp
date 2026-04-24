// Batch 5 — Test cancel/hold dialog properly (buttons are inside MoreHorizontal dropdown)
import { BASE, launchBrowser, newPage, snap, writeResults } from './biz-shared.mjs';

async function main() {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const out = { cancelDialog: null, holdDialog: null };

  // Find a Nháp order
  await page.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(1500);
  const orders = await page.$$eval('tbody tr', rows => rows.map(r => {
    const cells = [...r.querySelectorAll('td')].map(c => c.textContent.trim());
    const link = r.querySelector('a[href^="/orders/"]');
    return { href: link?.getAttribute('href'), cells };
  }).filter(r => r.href));
  const nhap = orders.find(o => o.cells.some(c => c === 'Nháp'));
  if (!nhap) { console.log('No Nháp order'); process.exit(0); }
  console.log('Nháp order:', nhap.href);

  await page.goto(`${BASE}${nhap.href}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(2000);
  await snap(page, 'batch5-order-detail');

  // Open 3-dot menu
  const menuBtn = await page.$('button:has(svg.lucide-more-horizontal), button:has(.lucide-more-horizontal)');
  if (!menuBtn) {
    // Try alternative: find the only 3-dot button with MoreHorizontal icon
    const candidate = await page.$$('button[class*="border"]');
    for (const c of candidate) {
      const html = await c.innerHTML();
      if (html.includes('more-horizontal') || html.includes('MoreHorizontal')) {
        await c.click(); break;
      }
    }
  } else {
    await menuBtn.click();
  }
  await page.waitForTimeout(800);
  await snap(page, 'batch5-menu-open');

  // --- CANCEL DIALOG ---
  const cancelMenuBtn = await page.$('button:has-text("Hủy đơn")');
  if (cancelMenuBtn) {
    await cancelMenuBtn.click();
    await page.waitForTimeout(1200);
    await snap(page, 'TS-ORD-017-cancel-dialog');
    const dialog = await page.$('[role="dialog"], [role="alertdialog"]');
    if (dialog) {
      const text = await dialog.textContent();
      out.cancelDialog = {
        orderUrl: nhap.href,
        visible: true,
        textSnippet: text.slice(0, 500),
        hasReasonField: Boolean(await dialog.$('textarea')),
        hasLyDoLabel: /lý do/i.test(text),
        buttons: await dialog.$$eval('button', bs => bs.map(b => b.textContent.trim())),
      };

      // Try submit without reason
      const confirmBtn = await dialog.$('button:has-text("Xác nhận"), button:has-text("Đồng ý"), button:has-text("OK")');
      if (confirmBtn) {
        const disabled = await confirmBtn.isDisabled();
        out.cancelDialog.confirmBtnDisabledInitially = disabled;
        if (!disabled) {
          await confirmBtn.click();
          await page.waitForTimeout(1200);
          const stillVisible = Boolean(await page.$('[role="dialog"], [role="alertdialog"]'));
          const errs = await page.$$eval('.text-red-500, .text-red-600, [class*="text-red"]', els => els.map(e => e.textContent.trim()).filter(Boolean));
          out.cancelDialog.afterEmptySubmit = { stillVisible, errs: errs.slice(0, 10) };
          await snap(page, 'TS-ORD-017-cancel-after-empty-submit');
        }
      }
      // Close
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(500);
    }
  }

  // --- HOLD DIALOG ---
  // Re-open menu
  await page.waitForTimeout(500);
  const menuBtn2 = await page.$('button:has(svg.lucide-more-horizontal)');
  if (menuBtn2) {
    await menuBtn2.click();
    await page.waitForTimeout(500);
    const holdBtn = await page.$('button:has-text("Tạm giữ")');
    if (holdBtn) {
      await holdBtn.click();
      await page.waitForTimeout(1200);
      await snap(page, 'TS-ORD-018-hold-dialog');
      const dialog = await page.$('[role="dialog"], [role="alertdialog"]');
      if (dialog) {
        const text = await dialog.textContent();
        out.holdDialog = {
          visible: true,
          textSnippet: text.slice(0, 500),
          hasReasonField: Boolean(await dialog.$('textarea')),
          buttons: await dialog.$$eval('button', bs => bs.map(b => b.textContent.trim())),
        };
      } else {
        out.holdDialog = { visible: false, note: 'menu button might not be Hold-capable for Nháp status' };
      }
    } else {
      out.holdDialog = { note: 'Hold button not in menu (Nháp is not in HOLDABLE_STATUSES)' };
    }
  }

  await ctx.close();
  await browser.close();
  writeResults('batch5', out);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
