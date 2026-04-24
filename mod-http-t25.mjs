// Task #25 — full regression smoke test after SDK integration.
// Also probes 3 bug-fix pages + /approvals for auth behavior.
import fs from 'node:fs';

const MODULES = [
  'accounts-payable','accounts-receivable','approvals','assets','attendance',
  'budget','commission','complaints','containers','contracts','customers',
  'customs','debt-offset','delegation','delivery','delivery-orders','documents',
  'drivers','employees','exchange-rates','general-ledger','init','integrations',
  'inventory','invoices','labels','leads','leave','notifications',
  'operation-costs','orders','package-issues','payment-vouchers','payroll',
  'purchasing','quality','quotations','reports','settings','suppliers',
  'tasks','tracking','users','vehicles','wallet','warehouse-cn',
  'warehouse-dashboard','warehouse-services','warehouse-vn',
];

const EXTRA = [
  'payment-vouchers/new',
  'quotations/new',
  'orders/new',
];

const BASE = 'http://localhost:3000';
const results = [];

function classify(r) {
  if (r.error) return 'ERROR';
  if (r.httpStatus !== 200) return 'HTTP_' + r.httpStatus;
  if (r.hasAppError) return 'APP_ERROR';
  return 'PASS';
}

async function probe(path) {
  const url = `${BASE}/${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const body = await res.text();
    const ms = Date.now() - start;
    const h1Match = body.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    return {
      path,
      httpStatus: res.status,
      loadMs: ms,
      size: body.length,
      hasAppError: /Application error|Unhandled Runtime Error/i.test(body),
      h1: h1Match ? h1Match[1].trim() : null,
      hasForm: /<form/i.test(body),
      hasFileInput: /type=["']file["']/i.test(body),
    };
  } catch (e) {
    return { path, error: e.message, loadMs: Date.now() - start };
  }
}

console.log('=== 49 modules ===');
for (const mod of MODULES) {
  const r = await probe(mod);
  r.status = classify(r);
  results.push(r);
  console.log(`${mod}: ${r.status} http=${r.httpStatus ?? '-'} ms=${r.loadMs} h1=${JSON.stringify(r.h1 || null)}${r.error ? ' err=' + r.error : ''}`);
  await new Promise(r => setTimeout(r, 1500));
}

console.log('\n=== Extra (bug-fix pages) ===');
for (const mod of EXTRA) {
  const r = await probe(mod);
  r.status = classify(r);
  results.push(r);
  console.log(`${mod}: ${r.status} http=${r.httpStatus ?? '-'} ms=${r.loadMs} form=${r.hasForm} file-input=${r.hasFileInput}`);
  await new Promise(r => setTimeout(r, 1500));
}

fs.writeFileSync('/tmp/mod-t25.json', JSON.stringify(results, null, 2));

const counts = {};
results.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
console.log('\n=== SUMMARY ===');
console.log(counts);
console.log('Total:', results.length);
