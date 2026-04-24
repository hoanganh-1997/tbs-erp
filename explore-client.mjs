// Exploratory client-side testing with Playwright — retest BLOCKED flows from task #16
import { chromium } from 'playwright';
import { writeFileSync, appendFileSync } from 'node:fs';

const OUT = 'explore-client-results.md';
writeFileSync(OUT, '# Client-side Exploratory Test — TBS ERP\n\nRun: ' + new Date().toISOString() + '\n\n');
const log = (s) => { console.log(s); appendFileSync(OUT, s + '\n'); };

const results = [];
const rec = (id, name, status, notes = '') => {
  results.push({ id, name, status, notes });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'BUG' ? '🐛' : 'ℹ️';
  log(`${icon} [${id}] ${name} — ${status}${notes ? ' :: ' + notes : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

// Collect console errors per page
const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') consoleErrors.push({ url: page.url(), text: msg.text() });
});
page.on('pageerror', err => consoleErrors.push({ url: page.url(), text: 'PAGEERROR: ' + err.message }));

const BASE = 'http://localhost:3000';
async function go(path, waitFor = 'networkidle') {
  const t0 = Date.now();
  consoleErrors.length = 0;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: waitFor, timeout: 30000 });
    return { ok: resp?.ok() ?? true, status: resp?.status() ?? 0, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: e.message };
  }
}

function snapErrors() {
  const errs = consoleErrors.slice();
  consoleErrors.length = 0;
  return errs;
}

// ======= 1. Sidebar navigation =======
log('\n## 1. Sidebar & base navigation');
{
  const r = await go('/');
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(()=>null);
  rec('NAV-01', 'GET / — dashboard loads', r.ok ? 'PASS' : 'FAIL', `status=${r.status}, ${r.ms}ms, title="${title}", h1="${h1}"`);
  const errs = snapErrors();
  if (errs.length) rec('NAV-01-CONS', 'Console errors on dashboard', 'BUG', JSON.stringify(errs.slice(0,3)));

  // Try clicking Orders from sidebar
  try {
    await page.getByRole('link', { name: 'Đơn hàng', exact: true }).first().click({ timeout: 5000 });
    await page.waitForURL(/\/orders$/, { timeout: 10000 });
    const h = await page.getByRole('heading', { level: 1, name: 'Đơn hàng' }).isVisible().catch(()=>false);
    rec('NAV-02', 'Sidebar → Orders', h ? 'PASS' : 'FAIL', `url=${page.url()}, h1visible=${h}`);
  } catch (e) { rec('NAV-02', 'Sidebar → Orders', 'FAIL', e.message); }
}

// ======= 2. Orders list: data load =======
log('\n## 2. Orders module');
{
  const r = await go('/orders');
  await page.waitForTimeout(2000); // let client fetch
  const rows = await page.locator('table tbody tr, [role="row"]').count();
  const emptyState = await page.getByText(/Chưa có|Không có|No data/i).isVisible().catch(()=>false);
  rec('ORD-01', 'Orders list loads data', (rows>0 && !emptyState) ? 'PASS' : (emptyState?'FAIL':'INFO'), `rows=${rows}, empty=${emptyState}`);
  const errs = snapErrors(); if (errs.length) rec('ORD-01-CONS', 'Console on /orders', 'BUG', JSON.stringify(errs.slice(0,3)));
}

// ======= 3. Create Order form — empty submit validation =======
{
  const r = await go('/orders/new');
  const h1 = await page.getByRole('heading', { name: 'Tạo đơn hàng mới' }).isVisible().catch(()=>false);
  rec('ORD-02', 'Open /orders/new', h1 ? 'PASS' : 'FAIL', `${r.ms}ms, h1visible=${h1}`);

  const submit = page.getByRole('button', { name: /Tạo đơn hàng$/ });
  const subVisible = await submit.isVisible().catch(()=>false);
  if (subVisible) {
    await submit.click();
    await page.waitForTimeout(1500);
    const urlStillNew = /\/orders\/new$/.test(page.url());
    const err = await page.getByText(/Vui lòng|bắt buộc|required|phải có/i).first().isVisible().catch(()=>false);
    const toast = await page.locator('[data-sonner-toast], [role="status"]').isVisible().catch(()=>false);
    rec('ORD-03', 'Empty submit blocked by validation', urlStillNew ? 'PASS' : 'FAIL', `stillNew=${urlStillNew}, errMsg=${err}, toast=${toast}`);
  } else {
    rec('ORD-03', 'Submit button visible', 'FAIL', 'button not found');
  }
}

// ======= 4. Create Order happy path =======
{
  await go('/orders/new');
  await page.waitForTimeout(1000);
  // Fill visible text inputs with minimal required data
  const inputs = await page.locator('input[type="text"], input:not([type]), textarea').all();
  let filled = 0;
  for (const inp of inputs) {
    if (!(await inp.isVisible().catch(()=>false))) continue;
    const placeholder = (await inp.getAttribute('placeholder').catch(()=>''))||'';
    const name = (await inp.getAttribute('name').catch(()=>''))||'';
    const val = `Test ${Date.now()}`;
    await inp.fill(val.slice(0,40)).catch(()=>{});
    filled++;
    if (filled >= 5) break;
  }
  // Try selects (Radix): click first few comboboxes and pick first option
  const combos = await page.getByRole('combobox').all();
  let combosPicked = 0;
  for (const c of combos.slice(0, 4)) {
    try {
      await c.click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option').first();
      if (await opt.isVisible().catch(()=>false)) {
        await opt.click();
        combosPicked++;
      } else { await page.keyboard.press('Escape'); }
    } catch {}
  }
  const submit = page.getByRole('button', { name: /Tạo đơn hàng$/ });
  const urlBefore = page.url();
  await submit.click().catch(()=>{});
  await page.waitForTimeout(3000);
  const urlAfter = page.url();
  const toast = await page.locator('[data-sonner-toast], [role="status"]').first().textContent().catch(()=>'');
  const navigated = urlBefore !== urlAfter;
  rec('ORD-04', 'Create order with partial data', navigated ? 'PASS' : 'INFO', `filled=${filled}, combos=${combosPicked}, urlAfter=${urlAfter.slice(-30)}, toast="${(toast||'').slice(0,80)}"`);
}

// ======= 5. Edit existing order (first row) =======
log('\n## 3. Edit flow — /orders/[id]');
{
  await go('/orders');
  await page.waitForTimeout(2000);
  const firstRow = page.locator('table tbody tr a[href*="/orders/"]').first();
  const hasFirst = await firstRow.isVisible().catch(()=>false);
  if (!hasFirst) {
    rec('ORD-05', 'Click first order row', 'INFO', 'No row link found — try direct /orders/1');
    const t0 = Date.now();
    await go('/orders/1');
    rec('ORD-EDIT-SSR', '/orders/[id] direct nav time', 'INFO', `${Date.now()-t0}ms`);
  } else {
    const href = await firstRow.getAttribute('href');
    const t0 = Date.now();
    await firstRow.click();
    await page.waitForLoadState('networkidle', {timeout: 20000}).catch(()=>{});
    const dt = Date.now() - t0;
    rec('ORD-05', 'Navigate to order detail', 'PASS', `href=${href}, ${dt}ms`);

    // Look for "Chỉnh sửa" button
    const editBtn = page.getByRole('link', { name: /Chỉnh sửa|Edit/i }).or(page.getByRole('button', { name: /Chỉnh sửa|Edit/i }));
    const editVis = await editBtn.first().isVisible().catch(()=>false);
    if (editVis) {
      const t1 = Date.now();
      await editBtn.first().click();
      await page.waitForLoadState('networkidle', {timeout: 30000}).catch(()=>{});
      const editDt = Date.now() - t1;
      const url = page.url();
      rec('ORD-06', '/orders/[id]/edit navigation time', 'INFO', `url=${url.slice(-30)}, ${editDt}ms (check if >5s is still an issue)`);
    } else {
      rec('ORD-06', 'Edit button not found', 'INFO', 'may be in dropdown/context menu');
    }
  }
  const errs = snapErrors(); if (errs.length) rec('ORD-EDIT-CONS', 'Console on detail/edit', 'BUG', JSON.stringify(errs.slice(0,3)));
}

// ======= 6. Delete flow — look for dialog =======
log('\n## 4. Delete flow');
{
  await go('/customers');
  await page.waitForTimeout(2000);
  // Look for delete action anywhere
  const deleteBtn = page.getByRole('button', { name: /Xóa|Delete/i }).first();
  const hasDelete = await deleteBtn.isVisible().catch(()=>false);
  if (hasDelete) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    const dialog = page.getByRole('dialog');
    const dialogVisible = await dialog.isVisible().catch(()=>false);
    const hasConfirmBtn = dialogVisible ? await dialog.getByRole('button', { name: /Xóa|Confirm|Xác nhận/i }).isVisible().catch(()=>false) : false;
    rec('DEL-01', 'Delete shows confirm dialog', dialogVisible ? 'PASS' : 'INFO', `dialogVisible=${dialogVisible}, confirmBtn=${hasConfirmBtn}`);
    if (dialogVisible) await page.keyboard.press('Escape');
  } else {
    rec('DEL-01', 'Delete button visible on customer list', 'INFO', 'not found in list view — may require row action menu');
  }
}

// ======= 7. Empty state pages =======
log('\n## 5. Empty-state pages (verify cause)');
for (const p of ['/invoices', '/general-ledger', '/payroll', '/budget', '/labels']) {
  const r = await go(p);
  await page.waitForTimeout(2500); // wait client fetch
  const bodyText = (await page.locator('body').innerText().catch(()=>''))||'';
  const hasEmptyMsg = /Chưa có|Không có|No data|trống/i.test(bodyText);
  const rows = await page.locator('table tbody tr, [role="row"]').count();
  const errs = snapErrors();
  rec('EMP-' + p.slice(1), `${p} — renders`, 'INFO', `${r.ms}ms, emptyText=${hasEmptyMsg}, rows=${rows}, consoleErrs=${errs.length}`);
  if (errs.length) rec('EMP-' + p.slice(1) + '-CONS', `Console on ${p}`, 'BUG', JSON.stringify(errs.slice(0,2)));
}

// ======= 8. Verify title bug still present =======
log('\n## 6. Regression check — BUG-EXP-002 (title)');
{
  const sample = ['/', '/orders', '/customers', '/suppliers'];
  for (const p of sample) {
    await go(p);
    const t = await page.title();
    rec('TITLE-' + p.slice(1||1), `Title of ${p}`, t ? 'PASS' : 'BUG', `title="${t}"`);
  }
}

// ======= 9. Stub coming-soon =======
log('\n## 7. Stub pages');
for (const p of ['/debt-offset', '/attendance', '/leave']) {
  await go(p);
  const v = await page.getByText(/Đang phát triển|Coming soon|Sắp ra mắt/i).first().isVisible().catch(()=>false);
  rec('STUB-' + p.slice(1), `${p} shows stub`, v ? 'PASS' : 'FAIL');
}

// ======= 10. Toast behavior on action =======
log('\n## 8. Toast UX sample — back to orders submit with empty fields');
{
  await go('/orders/new');
  const submit = page.getByRole('button', { name: /Tạo đơn hàng$/ });
  await submit.click().catch(()=>{});
  await page.waitForTimeout(1500);
  const toastEls = await page.locator('[data-sonner-toast], li[data-sonner-toast]').all();
  const toastTexts = [];
  for (const t of toastEls) toastTexts.push((await t.innerText()).slice(0,80));
  rec('TOAST-01', 'Toast appears on validation error', toastEls.length > 0 ? 'PASS' : 'INFO', `n=${toastEls.length}, texts=${JSON.stringify(toastTexts)}`);
}

// ======= FINAL =======
log('\n\n## Summary');
const counts = { PASS:0, FAIL:0, BUG:0, INFO:0 };
for (const r of results) counts[r.status] = (counts[r.status]||0) + 1;
log('```\n' + JSON.stringify(counts, null, 2) + '\n```');
writeFileSync('explore-client-results.json', JSON.stringify(results, null, 2));

await browser.close();
log('\nDone.');
