// Lightweight HTTP smoke — fetch each module list page, check status + content markers
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

const results = [];
for (const mod of MODULES) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/${mod}`, { headers: { 'User-Agent': 'smoke/1.0' } });
    const body = await r.text();
    const info = {
      mod,
      httpStatus: r.status,
      loadMs: Date.now() - t0,
      size: body.length,
      hasAppError: /__next_error|Application error/i.test(body),
      hasSdkError: /InforactError|SDK_NOT_CONFIGURED|Network error/i.test(body),
      // Only real 404: HTTP status + absent <h1>
      hasNotFound: false,
      // Extract H1
      h1: (body.match(/<h1[^>]*>([^<]{1,100})<\/h1>/i) || [])[1]?.trim() || null,
      // Count some indicators
      hasForm: /<form/i.test(body),
      hasTable: /<table/i.test(body),
    };
    if (info.hasAppError || info.hasSdkError) info.status = 'FAIL';
    else if (info.hasNotFound) info.status = '404';
    else if (r.status === 200) info.status = 'PASS';
    else info.status = `HTTP_${r.status}`;
    results.push(info);
    console.log(`${mod.padEnd(22)} ${info.status.padEnd(8)} ${info.httpStatus} ${info.loadMs}ms h1=${info.h1||'-'}`);
  } catch (e) {
    results.push({ mod, status: 'ERROR', error: e.message, loadMs: Date.now() - t0 });
    console.log(`${mod}: ERROR ${e.message.slice(0, 60)}`);
  }
  // Delay between requests so dev server can compile next page
  await new Promise(r => setTimeout(r, 1500));
}
fs.writeFileSync('/tmp/mod-http.json', JSON.stringify(results, null, 2));
console.log('\n=== SUMMARY ===');
const counts = {};
for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
console.log(counts);
console.log(`Total: ${results.length}`);
