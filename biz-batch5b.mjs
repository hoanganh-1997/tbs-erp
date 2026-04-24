import { BASE, launchBrowser, newPage, snap, writeResults } from './biz-shared.mjs';

async function main() {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const out = {};

  // Pick same Nháp order
  const orderId = '/orders/69d8730364318e6d026ed56b';
  await page.goto(`${BASE}${orderId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(2500);

  // Dump all buttons in the action bar area (right side)
  const btns = await page.$$eval('button', bs => bs.map(b => ({
    text: b.textContent.trim().slice(0, 40),
    hasIconClass: b.innerHTML.match(/lucide-[a-z-]+/g)?.slice(0, 3) || [],
  })));
  out.allButtons = btns.filter(b => b.hasIconClass.length || b.text);

  // Find the 3-dot menu button: it has no text, contains MoreHorizontal svg
  const menuBtn = await page.$('button.inline-flex:has(svg)');
  const menuBtnCandidates = await page.$$('button');
  let opened = false;
  for (const b of menuBtnCandidates) {
    const text = (await b.textContent()).trim();
    const html = await b.innerHTML();
    if (text === '' && html.includes('lucide-ellipsis')) {
      await b.click();
      opened = true;
      break;
    }
  }
  if (!opened) {
    // fallback: click by SVG class
    const b = await page.$('button:has(svg.lucide-ellipsis)');
    if (b) { await b.click(); opened = true; }
  }
  out.menuOpened = opened;
  await page.waitForTimeout(500);
  await snap(page, 'batch5b-menu');

  // Click Hủy đơn
  const cancelMenuBtn = await page.$('button:has-text("Hủy đơn")');
  out.cancelBtnFound = Boolean(cancelMenuBtn);
  if (cancelMenuBtn) {
    await cancelMenuBtn.click();
    await page.waitForTimeout(1500);
    await snap(page, 'TS-ORD-017-dialog');
    const dialog = await page.$('[role="dialog"], [role="alertdialog"]');
    if (dialog) {
      const text = await dialog.textContent();
      out.cancelDialog = {
        visible: true,
        textSnippet: text.slice(0, 600),
        hasReasonField: Boolean(await dialog.$('textarea')),
        hasLyDoLabel: /lý do/i.test(text),
        buttons: await dialog.$$eval('button', bs => bs.map(b => b.textContent.trim())),
      };
      // Try submit empty
      const confirmBtn = await dialog.$('button:has-text("Xác nhận"), button:has-text("Đồng ý"), button:has-text("Hủy đơn hàng")');
      if (confirmBtn) {
        out.cancelDialog.confirmBtnDisabled = await confirmBtn.isDisabled();
        if (!out.cancelDialog.confirmBtnDisabled) {
          await confirmBtn.click();
          await page.waitForTimeout(1200);
          out.cancelDialog.afterEmptySubmit = {
            dialogStillOpen: Boolean(await page.$('[role="dialog"]')),
            errs: await page.$$eval('[class*="text-red"]', els => els.map(e => e.textContent.trim()).filter(t => t && t !== '*').slice(0, 10)),
          };
          await snap(page, 'TS-ORD-017-dialog-after-empty');
        }
      }
    }
  }

  await ctx.close();
  await browser.close();
  writeResults('batch5b', out);
  console.log(JSON.stringify(out, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
