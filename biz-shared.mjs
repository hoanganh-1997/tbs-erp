import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

export const BASE = 'http://localhost:3000';
export const ART_DIR = '/tmp/biz-artifacts';
fs.mkdirSync(ART_DIR, { recursive: true });

export async function launchBrowser() {
  return chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
}

export async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  const consoleErrors = [];
  page.on('pageerror', e => consoleErrors.push(String(e)));
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page._consoleErrors = consoleErrors;
  return { ctx, page };
}

export async function snap(page, name) {
  const p = path.join(ART_DIR, `${name}.png`);
  try { await page.screenshot({ path: p, fullPage: true }); } catch {}
  return p;
}

export function writeResults(batchName, results) {
  const p = path.join(ART_DIR, `${batchName}.json`);
  fs.writeFileSync(p, JSON.stringify(results, null, 2));
  console.log(`Wrote ${p}`);
}
