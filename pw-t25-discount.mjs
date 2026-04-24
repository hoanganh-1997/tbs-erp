// Interact with /quotations/new and enter a discount to verify BUG-BIZ-009 label
import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const errs = [];
    page.on('console', msg => { if (msg.type() === 'error') errs.push(msg.text()); });
    page.on('pageerror', e => errs.push('pageerror: ' + e.message));

    await page.goto(`${BASE}/quotations/new`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Scan existing HTML for label
    const html0 = await page.content();
    console.log('Initial has "Không cần":', /Không cần phê duyệt/.test(html0));
    console.log('Initial has "Leader":', /Leader/.test(html0));

    // Find discount input — it's an input type=number that has % near it
    const discountInputs = await page.locator('input[type="number"]').all();
    console.log('Number of number inputs:', discountInputs.length);

    // Find discount label specifically
    const discountLabel = await page.locator('label:has-text("Giảm giá"), label:has-text("Discount"), label:has-text("giảm")').count();
    console.log('Discount labels:', discountLabel);

    // Try setting discount to 4 (medium chain)
    try {
      const discount = page.locator('input[type="number"]').nth(5); // last number input likely = discount
      await discount.fill('4');
      await page.waitForTimeout(1500);
      const html4 = await page.content();
      console.log('\nAfter discount=4:');
      console.log('  has "Leader + KT TT → GĐ KD":', /Leader \+ KT TT → GĐ KD$/m.test(html4) || /Leader \+ KT TT → GĐ KD[^B]/m.test(html4));
      console.log('  has "Leader + KT TT" text:', /Leader \+ KT TT/.test(html4));

      // Try 7 (highest chain)
      await discount.fill('7');
      await page.waitForTimeout(1500);
      const html7 = await page.content();
      console.log('\nAfter discount=7:');
      console.log('  has "→ BGĐ":', /→ BGĐ/.test(html7));
      console.log('  has "GĐ KD → BGĐ":', /GĐ KD → BGĐ/.test(html7));
    } catch (e) {
      console.log('fill failed:', e.message);
    }

    await page.screenshot({ path: '/tmp/t25-quotation-discount.png', fullPage: true });
    console.log('\nconsole errors:', errs.length);
    errs.slice(0, 5).forEach(e => console.log('  ', e.substring(0, 150)));

    await ctx.close();
  } finally {
    await browser.close();
  }
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
