import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'], headless: true });
const page = await (await browser.newContext()).newPage();

// Get a real order id
await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2500);
const links = await page.$$eval('a[href^="/orders/"]', as => as.map(a => a.getAttribute('href')));
const detail = links.find(h => h && h !== '/orders/new' && h.match(/^\/orders\/[a-f0-9]+/));
console.log('detail link:', detail);
if (!detail) { console.log('FAIL no detail link'); await browser.close(); process.exit(0); }

const id = detail.split('/').pop();
// 1. Direct edit URL cold
const t0 = Date.now();
const resp1 = await page.goto(`http://localhost:3000/orders/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 60000 });
const dt1 = Date.now() - t0;
await page.waitForTimeout(3000);
const dt1stable = Date.now() - t0;
const h1 = await page.locator('h1').first().textContent().catch(()=>'');
console.log(`COLD /orders/${id}/edit: DOMContentLoaded=${dt1}ms, +3s-stable=${dt1stable}ms, status=${resp1?.status()}, h1="${h1}"`);

// 2. Warm
const t2 = Date.now();
await page.goto(`http://localhost:3000/orders/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 30000 });
const dt2 = Date.now() - t2;
console.log(`WARM /orders/${id}/edit: DOMContentLoaded=${dt2}ms`);

// 3. Via detail → edit click
await page.goto(`http://localhost:3000/orders/${id}`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
const buttons = await page.$$eval('button, a', els => els.map(e => ({tag:e.tagName, text:(e.innerText||'').trim().slice(0,40), href:e.getAttribute('href'), cls:e.className.slice(0,60)})).filter(x => /Chỉnh|Edit|Sửa/i.test(x.text)));
console.log('Edit-like controls:', JSON.stringify(buttons, null, 2));

// Try MoreHorizontal
const more = await page.$('button:has(svg.lucide-more-horizontal)');
console.log('Has MoreHorizontal:', !!more);
if (more) {
  await more.click();
  await page.waitForTimeout(500);
  const items = await page.$$eval('[role="menuitem"]', el => el.map(e => e.innerText.trim()));
  console.log('Menu items:', JSON.stringify(items));
}

await browser.close();
