// Exploratory route smoke test — hit every page route, grab status/size/title/error markers.
// Run: node explore-routes.mjs
import { performance } from 'node:perf_hooks';

const BASE = 'http://localhost:3000';

// All routes from app/ directory (static + list of representative dynamic routes skipped for now)
const ROUTES = [
  '/', '/init',
  '/orders', '/orders/new',
  '/quotations', '/quotations/new',
  '/contracts', '/contracts/new',
  '/containers',
  '/customs', '/customs/new',
  '/delivery-orders', '/delivery-orders/new',
  '/delivery',
  '/customers',
  '/leads',
  '/suppliers',
  '/warehouse-cn', '/warehouse-cn/new',
  '/warehouse-vn', '/warehouse-vn/new', '/warehouse-vn/inventory', '/warehouse-vn/outbound',
  '/warehouse-dashboard', '/warehouse-services',
  '/tracking', '/tracking/events',
  '/inventory',
  '/invoices',
  '/payment-vouchers', '/payment-vouchers/new',
  '/accounts-receivable', '/accounts-payable', '/general-ledger',
  '/debt-offset', '/exchange-rates', '/wallet',
  '/payroll', '/employees', '/drivers', '/vehicles', '/commission',
  '/attendance', '/leave', '/delegation',
  '/budget', '/operation-costs',
  '/approvals', '/reports', '/settings',
  '/tasks', '/notifications', '/documents',
  '/integrations', '/users', '/assets',
  '/purchasing', '/quality', '/complaints',
  '/package-issues', '/labels',
];

// Try a few bogus/edge routes
const EDGE = [
  '/does-not-exist',
  '/orders/999999',
  '/orders/abc',
  '/customers/999999',
  '/quotations/abc',
  '/orders/1/edit',
  '/api/health',
  '/api/orders',
];

function extract(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1].trim();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [,''])[1].replace(/<[^>]+>/g,'').trim();
  // Next.js error markers
  const nextErr = /__next_error/.test(html) || /Application error/i.test(html) || /digest: ?"\w+"/.test(html);
  const hasSidebar = /TBS ERP/.test(html);
  const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
  const errorWords = (textOnly.match(/Lỗi|Error|Không thể|Thất bại|crash|undefined|null reference/gi) || []);
  const comingSoon = /(sắp ra mắt|coming soon|đang phát triển|chưa triển khai)/i.test(textOnly);
  const empty = /(Chưa có dữ liệu|Không có dữ liệu|No data|empty)/i.test(textOnly);
  return { title, h1: h1.slice(0,120), nextErr, hasSidebar, errorCount: errorWords.length, comingSoon, empty, textLen: textOnly.length };
}

async function hit(path, timeoutMs = 30000) {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, { redirect: 'manual', signal: ctrl.signal });
    const html = await res.text();
    const dt = Math.round(performance.now() - t0);
    const info = extract(html);
    return { path, status: res.status, bytes: html.length, ms: dt, ...info };
  } catch (e) {
    return { path, status: 'ERR', error: e.message, cause: e.cause?.code, ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

const all = [...ROUTES, ...EDGE];
const results = [];
let idx = 0;
for (const r of all) {
  idx++;
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    res = await hit(r, 40000);
    if (res.status !== 'ERR') break;
    await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  results.push(res);
  const flag = res.status === 200 ? (res.nextErr ? '⚠️' : res.comingSoon ? '🚧' : '✅') : '❌';
  const extra = res.error ? ` ERR:${res.error}${res.cause?' '+res.cause:''}` : '';
  console.log(`[${idx}/${all.length}] ${flag} ${res.status} ${r} — ${res.ms ?? '-'}ms, ${res.bytes ?? '-'}B, h1="${res.h1 ?? ''}", errs=${res.errorCount ?? '-'}, empty=${res.empty ?? '-'}, soon=${res.comingSoon ?? '-'}${extra}`);
  await new Promise(r => setTimeout(r, 500)); // 500ms gap to let dev server compile
  if (idx % 15 === 0) {
    console.log('  -- pause 3s --');
    await new Promise(r => setTimeout(r, 3000));
  }
}

// Summary
const fails = results.filter(r => r.status !== 200);
const errs  = results.filter(r => r.nextErr);
const soons = results.filter(r => r.comingSoon);
const empties = results.filter(r => r.empty);
console.log('\n=== SUMMARY ===');
console.log('Total:', results.length, ' OK:', results.filter(r=>r.status===200).length, ' !200:', fails.length);
console.log('Next.js error markers:', errs.length, errs.map(r=>r.path).join(', '));
console.log('Coming soon / WIP:', soons.length, soons.map(r=>r.path).join(', '));
console.log('Empty states:', empties.length, empties.map(r=>r.path).join(', '));
console.log('Non-200:', fails.map(r=>`${r.path}(${r.status})`).join(', '));

import { writeFileSync } from 'node:fs';
writeFileSync('explore-results.json', JSON.stringify(results, null, 2));
console.log('\nSaved: explore-results.json');
