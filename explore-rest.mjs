import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
const BASE = 'http://localhost:3000';

const ROUTES = [
  '/drivers','/vehicles','/commission',
  '/attendance','/leave','/delegation',
  '/budget','/operation-costs',
  '/approvals','/reports','/settings',
  '/tasks','/notifications','/documents',
  '/integrations','/users','/assets',
  '/purchasing','/quality','/complaints',
  '/package-issues','/labels',
];

const EDGE = [
  '/does-not-exist',
  '/orders/999999','/orders/abc','/orders/1','/orders/1/edit',
  '/customers/999999','/customers/1',
  '/quotations/abc','/quotations/1',
  '/contracts/1','/containers/1','/customs/1',
  '/delivery-orders/1','/leads/1','/warehouse-cn/1','/warehouse-vn/1',
  '/api/health','/api/orders',
];

function extract(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [,''])[1].trim();
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [,''])[1].replace(/<[^>]+>/g,'').trim();
  const nextErr = /__next_error/.test(html) || /Application error/i.test(html) || /digest: ?"\w+"/.test(html) || /This page could not be found/i.test(html);
  const is404 = /This page could not be found|404/i.test(html) && !/TBS ERP/.test(html.slice(0,500));
  const textOnly = html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ');
  const errorWords = (textOnly.match(/Lỗi|Error|Không thể|Thất bại|undefined|null reference/gi) || []);
  const comingSoon = /(sắp ra mắt|coming soon|đang phát triển|chưa triển khai)/i.test(textOnly);
  const empty = /(Chưa có dữ liệu|Không có dữ liệu|No data|empty state)/i.test(textOnly);
  return { title, h1: h1.slice(0,120), nextErr, errorCount: errorWords.length, errorSamples: errorWords.slice(0,5), comingSoon, empty, textLen: textOnly.length };
}

async function hit(path, timeoutMs = 45000) {
  const t0 = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, { redirect: 'manual', signal: ctrl.signal });
    const html = await res.text();
    const dt = Math.round(performance.now() - t0);
    return { path, status: res.status, bytes: html.length, ms: dt, ...extract(html) };
  } catch (e) {
    return { path, status: 'ERR', error: e.message, cause: e.cause?.code, ms: Math.round(performance.now() - t0) };
  } finally { clearTimeout(timer); }
}

const all = [...ROUTES, ...EDGE];
const results = [];
let i = 0;
for (const r of all) {
  i++;
  let res;
  for (let a = 1; a <= 2; a++) {
    res = await hit(r);
    if (res.status !== 'ERR') break;
    await new Promise(r => setTimeout(r, 1500));
  }
  results.push(res);
  const flag = res.status === 200 ? (res.nextErr ? '⚠️' : res.comingSoon ? '🚧' : '✅') : res.status === 404 ? '📭' : '❌';
  const extra = res.error ? ` ERR:${res.error} ${res.cause||''}` : '';
  console.log(`[${i}/${all.length}] ${flag} ${res.status} ${r} — ${res.ms}ms, ${res.bytes??'-'}B, h1="${res.h1??''}", errs=${res.errorCount??'-'}(${(res.errorSamples||[]).join(',')}), soon=${res.comingSoon}, empty=${res.empty}${extra}`);
  await new Promise(r => setTimeout(r, 600));
  if (i % 10 === 0) await new Promise(r => setTimeout(r, 2500));
}

writeFileSync('explore-results-rest.json', JSON.stringify(results, null, 2));
console.log('\nSaved explore-results-rest.json');
