// Round 2 — deeper investigation of flagged issues
import { chromium } from 'playwright';
import { writeFileSync, appendFileSync } from 'node:fs';

const OUT = 'explore-client2-results.md';
writeFileSync(OUT, '# Client-side Exploratory Test Round 2\n\n' + new Date().toISOString() + '\n\n');
const log = (s) => { console.log(s); appendFileSync(OUT, s + '\n'); };

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const consoleMsgs = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) consoleMsgs.push({t:m.type(), url: page.url(), text: m.text().slice(0,200)}); });
page.on('pageerror', e => consoleMsgs.push({t:'pageerror', url: page.url(), text: e.message.slice(0,200)}));
const snap = () => { const c = consoleMsgs.slice(); consoleMsgs.length=0; return c; };

// ========= Investigate "Failed to load orders" =========
log('## I1 — "Failed to load orders" investigation');
await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);
const errs1 = snap();
const rowCount = await page.locator('table tbody tr').count();
const emptyText = await page.getByText(/Chưa có|Lỗi tải|Thử lại/i).first().textContent().catch(()=>'');
log(`- Row count: ${rowCount}, empty/retry text: "${(emptyText||'').slice(0,80)}"`);
log(`- Console msgs (${errs1.length}):`);
for (const e of errs1.slice(0,8)) log(`  [${e.t}] ${e.text.slice(0,150)}`);

// Reload twice to check consistency
for (let i = 1; i <= 2; i++) {
  await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);
  const e = snap();
  const rc = await page.locator('table tbody tr').count();
  const failMsg = e.find(x => /Failed to load|Failed to fetch/.test(x.text));
  log(`- Reload ${i}: rows=${rc}, hasFailToLoad=${!!failMsg}${failMsg?', msg='+failMsg.text.slice(0,100):''}`);
}

// ========= Direct visit /orders/[id]/edit — SSR time check =========
log('\n## I2 — /orders/[id]/edit SSR time (BUG-EXP-004 followup)');
// First get a real order ID
await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const firstLink = await page.locator('a[href*="/orders/"][href!="/orders/new"]').first().getAttribute('href').catch(()=>null);
log(`- First order URL: ${firstLink}`);

if (firstLink) {
  const id = firstLink.split('/').pop();
  // Direct edit nav
  const t0 = Date.now();
  const resp = await page.goto(`http://localhost:3000/orders/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const dt1 = Date.now() - t0;
  await page.waitForTimeout(2000);
  const dt2 = Date.now() - t0;
  const h1 = await page.locator('h1').first().textContent().catch(()=>'');
  const err = snap();
  log(`- First edit nav (DOMcontentloaded): ${dt1}ms, full stable: ${dt2}ms, status=${resp?.status()}, h1="${h1}"`);
  if (err.length) for (const e of err.slice(0,3)) log(`  [${e.t}] ${e.text.slice(0,120)}`);

  // Second visit (warm cache)
  const t3 = Date.now();
  await page.goto(`http://localhost:3000/orders/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const dt3 = Date.now() - t3;
  await page.waitForTimeout(1500);
  log(`- Second edit nav (warm): ${dt3}ms`);
  snap();
}

// ========= Delete flow — try on detail page =========
log('\n## I3 — Delete / destructive actions');
if (firstLink) {
  await page.goto(`http://localhost:3000${firstLink}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Find all buttons and links text
  const buttons = await page.locator('button').all();
  const names = [];
  for (const b of buttons) {
    const t = ((await b.innerText().catch(()=>''))||'').trim().slice(0,40);
    if (t) names.push(t);
  }
  log(`- Buttons on detail page (${names.length}): ${JSON.stringify(names.slice(0,20))}`);

  // Look for MoreHorizontal menu (three-dot)
  const threeDot = page.locator('button:has(svg.lucide-more-horizontal), button[aria-haspopup]').first();
  const hasMore = await threeDot.isVisible().catch(()=>false);
  log(`- MoreHorizontal menu button present: ${hasMore}`);
  if (hasMore) {
    await threeDot.click();
    await page.waitForTimeout(500);
    const menuItems = await page.getByRole('menuitem').all();
    const mi = [];
    for (const m of menuItems) mi.push(((await m.innerText().catch(()=>''))||'').trim().slice(0,40));
    log(`- Menu items opened (${mi.length}): ${JSON.stringify(mi)}`);
    await page.keyboard.press('Escape');
  }
}

// Check customers list for delete/more actions
log('\n- /customers investigation:');
await page.goto('http://localhost:3000/customers', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
const custRows = await page.locator('table tbody tr').count();
const actionsPerRow = await page.locator('table tbody tr button').count();
log(`- rows=${custRows}, action-buttons in rows=${actionsPerRow}`);
if (custRows > 0 && actionsPerRow > 0) {
  const firstBtn = page.locator('table tbody tr').first().locator('button').first();
  const label = await firstBtn.getAttribute('aria-label').catch(()=>null);
  const text = await firstBtn.innerText().catch(()=>'');
  log(`- First row first button: aria-label=${label}, text="${text}"`);
}

// ========= Create order — form fields deeper inspection =========
log('\n## I4 — /orders/new — field inventory');
await page.goto('http://localhost:3000/orders/new', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

const required = await page.locator('[required], [aria-required="true"]').count();
const labels = await page.locator('label').allTextContents();
const textInputs = await page.locator('input[type="text"], input:not([type])').count();
const textareas = await page.locator('textarea').count();
const selects = await page.locator('[role="combobox"], select').count();
const numberInputs = await page.locator('input[type="number"]').count();
const dateInputs = await page.locator('input[type="date"]').count();
const radios = await page.locator('[role="radio"]').count();
const checkboxes = await page.locator('[role="checkbox"], input[type="checkbox"]').count();

log(`- Required markers: ${required}`);
log(`- Text inputs: ${textInputs}, textareas: ${textareas}, selects/combobox: ${selects}, number: ${numberInputs}, date: ${dateInputs}, radio: ${radios}, checkbox: ${checkboxes}`);
log(`- Sample labels: ${JSON.stringify(labels.slice(0,10))}`);

// Try clicking submit with nothing → look for inline error text
const submit = page.getByRole('button', { name: /Tạo đơn hàng$/ });
if (await submit.isVisible().catch(()=>false)) {
  await submit.click();
  await page.waitForTimeout(1500);
  const errTexts = await page.locator('.text-red-500, .text-red-600, [aria-invalid="true"], [data-invalid]').allTextContents();
  log(`- Inline error elements after empty submit: ${errTexts.length}, samples=${JSON.stringify(errTexts.slice(0,5))}`);
}

// ========= Toast behavior — any success path? =========
log('\n## I5 — Coming-soon routes toast/link behavior');
await page.goto('http://localhost:3000/debt-offset', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
const backLink = await page.getByRole('link', { name: /Về Tổng quan|Back|Tổng quan/i }).first().isVisible().catch(()=>false);
log(`- Stub has "Về Tổng quan" link: ${backLink}`);

// ========= Check whether /orders list fail-to-load happens every time vs sometimes =========
log('\n## I6 — Accounts Receivable / Payable — check AutoInitProvider failure?');
await page.goto('http://localhost:3000/accounts-receivable', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
const arRows = await page.locator('table tbody tr').count();
const arMsg = snap();
log(`- AR rows=${arRows}, console (${arMsg.length}):`);
for (const m of arMsg.slice(0,5)) log(`  [${m.t}] ${m.text.slice(0,150)}`);

// ========= Quotations create form =========
log('\n## I7 — /quotations/new — field inventory');
await page.goto('http://localhost:3000/quotations/new', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const qLabels = await page.locator('label').allTextContents();
const qSubmit = await page.getByRole('button', { name: /Tạo báo giá|Lưu|Submit/i }).first().isVisible().catch(()=>false);
log(`- /quotations/new labels(${qLabels.length}): ${JSON.stringify(qLabels.slice(0,8))}, submitBtn=${qSubmit}`);

// Take screenshots of key pages for the team
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: 'shot-dashboard.png', fullPage: false });
await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: 'shot-orders.png', fullPage: false });
await page.goto('http://localhost:3000/orders/new', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shot-orders-new.png', fullPage: true });

await browser.close();
log('\nDone Round 2.');
