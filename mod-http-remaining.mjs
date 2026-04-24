// Retest only modules that errored in mod-http3 run.
import fs from 'node:fs';

const MODULES = [
  'exchange-rates', 'general-ledger', 'init', 'integrations', 'inventory',
  'invoices', 'labels', 'leads', 'leave', 'notifications', 'operation-costs',
  'orders', 'package-issues', 'payment-vouchers', 'payroll', 'purchasing',
  'quality', 'quotations', 'reports', 'settings', 'suppliers', 'tasks',
  'tracking', 'users', 'vehicles', 'wallet', 'warehouse-cn',
  'warehouse-dashboard', 'warehouse-services', 'warehouse-vn',
];

const BASE = 'http://localhost:3000';
const results = [];

function classify(r) {
  if (r.error) return 'ERROR';
  if (r.httpStatus !== 200) return 'HTTP_' + r.httpStatus;
  if (r.hasAppError) return 'APP_ERROR';
  if (r.hasSdkError) return 'SDK_ERROR';
  if (r.hasNotFound) return 'NOT_FOUND';
  return 'PASS';
}

async function probe(mod) {
  const url = `${BASE}/${mod}`;
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const body = await res.text();
    const ms = Date.now() - start;
    const h1Match = body.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    return {
      mod,
      httpStatus: res.status,
      loadMs: ms,
      size: body.length,
      hasAppError: /Application error|Something went wrong/i.test(body),
      hasSdkError: /InforactError|InvalidSchemaError|forbidden|401|403/.test(body),
      hasNotFound: false,
      h1: h1Match ? h1Match[1].trim() : null,
      hasForm: /<form/i.test(body),
      hasTable: /<table/i.test(body),
    };
  } catch (e) {
    return { mod, error: e.message, loadMs: Date.now() - start };
  }
}

for (const mod of MODULES) {
  const r = await probe(mod);
  r.status = classify(r);
  results.push(r);
  console.log(`${mod}: ${r.status} http=${r.httpStatus ?? '-'} ms=${r.loadMs} h1=${JSON.stringify(r.h1 || null)}${r.error ? ' err=' + r.error : ''}`);
  await new Promise(r => setTimeout(r, 2000));
}

fs.writeFileSync('/tmp/mod-http-remaining.json', JSON.stringify(results, null, 2));

const counts = {};
results.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
console.log('\n=== SUMMARY ===');
console.log(counts);
console.log('Total:', results.length);
