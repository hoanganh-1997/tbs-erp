// Batch 2 — TS-ORD-012 Anti-fraud 5 mandatory fields on payment voucher form
// From code inspection: validate() only checks 4 fields — order, expenseType, amount>0, reason≥20
// Does NOT validate: beneficiary (empty allowed), attachment (no file input in form at all)
// This contradicts spec which requires BOTH beneficiary and attachment as BLOCK conditions.
import { BASE, launchBrowser, newPage, snap, writeResults } from './biz-shared.mjs';

const results = [];

async function testPVCase(label, action) {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const res = { case: label, status: '?', notes: [], evidence: [] };
  try {
    await page.goto(`${BASE}/payment-vouchers/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    // Select "Phiếu chi" radio
    const phieuChiRadio = await page.$('input[type="radio"][name="type"][value=""]');
    // Label-wrapped radios: click the second label (Phiếu chi)
    const typeLabels = await page.$$('label:has-text("Phiếu chi")');
    if (typeLabels.length) await typeLabels[0].click().catch(() => {});
    await page.waitForTimeout(300);
    const ret = await action(page);
    res.notes.push(...(ret?.notes || []));
    res.status = ret?.status || '?';
    res.evidence.push(await snap(page, `TS-ORD-012-${label.replace(/\W+/g, '-')}`));
  } catch (e) {
    res.status = 'ERROR';
    res.notes.push(`Exception: ${e.message}`);
  } finally {
    await ctx.close();
    await browser.close();
  }
  return res;
}

// Helper: submit form and collect red error messages
async function submitAndCollect(page) {
  const submitBtn = await page.$('button[type="submit"]');
  if (!submitBtn) return { submitted: false, errs: [], toast: null, urlAfter: page.url() };
  const urlBefore = page.url();
  await submitBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
  const errs = await page.$$eval('.text-red-500', els => els.map(e => e.textContent.trim()).filter(Boolean));
  const toastText = await page.$$eval('[data-sonner-toast]', els => els.map(e => e.textContent.trim()));
  return { submitted: true, errs, toast: toastText, urlAfter: page.url(), urlBefore };
}

async function main() {
  // Scan page for file input (expected for anti-fraud attachment)
  const precheck = await (async () => {
    const browser = await launchBrowser();
    const { ctx, page } = await newPage(browser);
    try {
      await page.goto(`${BASE}/payment-vouchers/new`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      const fileInputs = await page.$$eval('input[type="file"]', els => els.length);
      const html = await page.content();
      const hasAttachLabel = /đính kèm|attach|file|tài liệu|chứng từ/i.test(html);
      return { fileInputs, hasAttachLabel };
    } finally { await ctx.close(); await browser.close(); }
  })();

  results.push({
    id: 'TS-ORD-012',
    name: 'Anti-fraud 5 mandatory fields on payment voucher',
    priority: 'Critical',
    precheck,
  });

  // Case 1: All fields empty → should show multi-error
  const c1 = await testPVCase('empty-all', async (page) => {
    const { errs, urlAfter, urlBefore } = await submitAndCollect(page);
    const expectedMessages = [
      'Bắt buộc gắn mã đơn hàng',
      'Vui lòng chọn loại chi phí',
      'Số tiền phải > 0',
      'Lý do phải >= 20 ký tự',
    ];
    const found = expectedMessages.filter(m => errs.some(e => e.includes(m)));
    const notes = [
      `URL before: ${urlBefore}`,
      `URL after: ${urlAfter}`,
      `Navigation blocked: ${urlAfter === urlBefore}`,
      `Found error messages: ${found.length}/${expectedMessages.length}: ${found.join(' | ')}`,
      `All errs: ${errs.join(' || ')}`,
    ];
    // Blocked if didn't navigate AND showed 4 expected errors
    const status = (urlAfter === urlBefore && found.length === expectedMessages.length) ? 'PASS' : 'FAIL';
    return { status, notes };
  });
  results.push(c1);

  // Case 2: Fill order+expense+amount+reason but LEAVE beneficiary EMPTY
  // Per spec: should BLOCK. Per code: does NOT block.
  const c2 = await testPVCase('missing-beneficiary', async (page) => {
    // Pick expense type
    await page.selectOption('select', 'Cọc').catch(() => {});
    // Amount
    await page.fill('input[type="number"]', '5000000').catch(() => {});
    // Reason >= 20 chars
    const textareas = await page.$$('textarea');
    if (textareas.length) await textareas[0].fill('Đặt cọc cho nhà cung cấp ABC sản xuất lô hàng tháng 4');
    // Order search (click dropdown, pick first)
    const orderInput = await page.$('input[placeholder*="Tìm mã đơn"]');
    if (orderInput) {
      await orderInput.click();
      await page.waitForTimeout(500);
      const firstOrder = await page.$('button:has(.font-medium.text-\\[\\#4F5FD9\\])');
      if (firstOrder) await firstOrder.click();
    }
    // Leave beneficiary empty (Người thụ hưởng)
    await page.waitForTimeout(300);
    const { errs, urlAfter, urlBefore } = await submitAndCollect(page);
    const navigated = urlAfter !== urlBefore;
    const notes = [
      `URL before: ${urlBefore}`,
      `URL after: ${urlAfter}`,
      `Navigation (form submitted): ${navigated}`,
      `Errs: ${errs.join(' | ')}`,
    ];
    // Per spec, should BLOCK. If navigated away → form accepted it → FAIL
    const status = navigated ? 'FAIL (spec says BLOCK; form allowed submit without Beneficiary)' : 'PASS';
    return { status, notes };
  });
  results.push(c2);

  // Case 3: Reason < 20 chars
  const c3 = await testPVCase('short-reason', async (page) => {
    await page.selectOption('select', 'Cọc').catch(() => {});
    await page.fill('input[type="number"]', '1000000').catch(() => {});
    const textareas = await page.$$('textarea');
    if (textareas.length) await textareas[0].fill('Trả NCC'); // 8 chars
    const { errs, urlAfter, urlBefore } = await submitAndCollect(page);
    const navigated = urlAfter !== urlBefore;
    const shortReasonMsg = errs.find(e => e.includes('Lý do phải >= 20 ký tự'));
    return {
      status: (!navigated && shortReasonMsg) ? 'PASS' : 'FAIL',
      notes: [`navigated=${navigated}`, `found short-reason err: ${Boolean(shortReasonMsg)}`, `errs: ${errs.join(' | ')}`],
    };
  });
  results.push(c3);

  // Case 4: Missing expense type (Loại chi phí)
  const c4 = await testPVCase('missing-expense-type', async (page) => {
    await page.fill('input[type="number"]', '1000000').catch(() => {});
    const textareas = await page.$$('textarea');
    if (textareas.length) await textareas[0].fill('Test validation missing expense type field');
    const { errs, urlAfter, urlBefore } = await submitAndCollect(page);
    const navigated = urlAfter !== urlBefore;
    const missingExpenseErr = errs.find(e => e.includes('Vui lòng chọn loại chi phí'));
    return {
      status: (!navigated && missingExpenseErr) ? 'PASS' : 'FAIL',
      notes: [`navigated=${navigated}`, `missing expense err: ${Boolean(missingExpenseErr)}`, `errs: ${errs.join(' | ')}`],
    };
  });
  results.push(c4);

  // Case 5: Missing order (mã đơn hàng)
  const c5 = await testPVCase('missing-order', async (page) => {
    await page.selectOption('select', 'Cọc').catch(() => {});
    await page.fill('input[type="number"]', '1000000').catch(() => {});
    const textareas = await page.$$('textarea');
    if (textareas.length) await textareas[0].fill('Test validation without order selected');
    const { errs, urlAfter, urlBefore } = await submitAndCollect(page);
    const navigated = urlAfter !== urlBefore;
    const missingOrderErr = errs.find(e => e.includes('Bắt buộc gắn mã đơn hàng'));
    return {
      status: (!navigated && missingOrderErr) ? 'PASS' : 'FAIL',
      notes: [`navigated=${navigated}`, `missing order err: ${Boolean(missingOrderErr)}`, `errs: ${errs.join(' | ')}`],
    };
  });
  results.push(c5);

  writeResults('batch2-pv', results);
  console.log(JSON.stringify(results, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
