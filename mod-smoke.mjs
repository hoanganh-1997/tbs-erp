// Smoke test all 45 modules - load list page, detect errors
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const MODULES = [
  'accounts-payable','accounts-receivable','approvals','assets','attendance',
  'budget','commission','complaints','containers','contracts',
  'customers','customs','debt-offset','delegation','delivery',
  'delivery-orders','documents','drivers','employees','exchange-rates',
  'general-ledger','init','integrations','inventory','invoices',
  'labels','leads','leave','notifications','operation-costs',
  'orders','package-issues','payment-vouchers','payroll','purchasing',
  'quality','quotations','reports','settings','suppliers',
  'tasks','tracking','users','vehicles','wallet',
  'warehouse-cn','warehouse-dashboard','warehouse-services','warehouse-vn',
];

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  headless: true,
});

const results = [];
for (const mod of MODULES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  const warnings = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 200));
    if (m.type() === 'warning') warnings.push(m.text().slice(0, 200));
  });
  const started = Date.now();
  let status = 'UNKNOWN', httpStatus = null;
  let bodySummary = '';
  try {
    const resp = await page.goto(`${BASE}/${mod}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    httpStatus = resp?.status() || null;
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    // Detect Next.js error boundary
    const html = await page.content();
    const isAppError = /__next_error|Application error|500 Internal Server Error|This page could not be found/i.test(html);
    const hasInforactErr = /InforactError|Network error|SDK_NOT_CONFIGURED/i.test(html);
    // Count visible interactive elements
    const metrics = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim().slice(0, 60) || null,
      btns: document.querySelectorAll('button').length,
      tables: document.querySelectorAll('table').length,
      rows: document.querySelectorAll('tbody tr').length,
      links: document.querySelectorAll('a[href]').length,
      forms: document.querySelectorAll('form').length,
      inputs: document.querySelectorAll('input').length,
      cards: document.querySelectorAll('[class*="card"], [class*="Card"]').length,
      hasEmptyState: /Chưa có|Không có dữ liệu|No data|No records|Empty/i.test(document.body.innerText.slice(0, 2000)),
      hasError: document.querySelector('[class*="error"]') !== null,
      bodyText: document.body.innerText.slice(0, 300),
    }));
    bodySummary = JSON.stringify(metrics);
    if (isAppError) status = 'FAIL_ERROR_PAGE';
    else if (hasInforactErr) status = 'FAIL_SDK_ERROR';
    else if (httpStatus === 200) status = errors.length > 0 ? 'PASS_WITH_CONSOLE_ERR' : 'PASS';
    else status = `HTTP_${httpStatus}`;
    results.push({
      mod, httpStatus, status,
      loadMs: Date.now() - started,
      errors: errors.slice(0, 3),
      metrics,
    });
    console.log(`${mod}: ${status} (${httpStatus}, ${Date.now() - started}ms, ${metrics.rows}rows, ${metrics.btns}btns) ${errors.length?`[${errors.length}err]`:''}`);
  } catch (e) {
    status = 'EXCEPTION';
    results.push({ mod, status, error: e.message, loadMs: Date.now() - started });
    console.log(`${mod}: EXCEPTION ${e.message.slice(0, 100)}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync('/tmp/mod-smoke.json', JSON.stringify(results, null, 2));
console.log('\n=== SUMMARY ===');
const grouped = {};
for (const r of results) { grouped[r.status] = (grouped[r.status] || 0) + 1; }
console.log(grouped);
