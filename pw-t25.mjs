// Playwright verify the 3 bug-fix UIs in a real browser.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });

  const out = { bugs: {}, errors: [] };
  try {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));
    page.on('console', msg => {
      if (msg.type() === 'error') pageErrors.push('console.error: ' + msg.text());
    });

    // ========== BUG-BIZ-001: payment-vouchers/new should have file input ==========
    pageErrors.length = 0;
    console.log('\n--- BUG-BIZ-001: /payment-vouchers/new ---');
    await page.goto(`${BASE}/payment-vouchers/new`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const typeSelect = await page.locator('[role="combobox"]').all();
    const fileInputs = await page.locator('input[type="file"]').count();
    const attachmentButton = await page.locator('text=/Chọn tệp|Tải lên|Tải tập tin|Upload|đính kèm|Đính kèm|file/i').count();
    const bodyHtml = await page.content();
    const beneficiaryField = /beneficiary|Người thụ hưởng|Thụ hưởng/i.test(bodyHtml);
    out.bugs['BUG-BIZ-001'] = {
      fileInputCount: fileInputs,
      attachmentButtonHits: attachmentButton,
      beneficiaryFieldPresent: beneficiaryField,
      typeCombobox: typeSelect.length,
      pageErrors: [...pageErrors],
    };
    console.log('  fileInputs:', fileInputs, 'attachmentButton:', attachmentButton, 'beneficiary:', beneficiaryField, 'errors:', pageErrors.length);
    await page.screenshot({ path: '/tmp/t25-bug001.png', fullPage: true });

    // ========== BUG-BIZ-009: quotations/new discount + auto-approval ==========
    pageErrors.length = 0;
    console.log('\n--- BUG-BIZ-009: /quotations/new ---');
    await page.goto(`${BASE}/quotations/new`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const quotationForm = await page.locator('form').count();
    const discountField = await page.locator('input[type="number"]').count();
    const approvalLabel = await page.locator('text=/Leader|Chờ duyệt|Không cần phê duyệt|Phê duyệt/i').count();
    out.bugs['BUG-BIZ-009'] = {
      formCount: quotationForm,
      numberInputs: discountField,
      approvalLabelHits: approvalLabel,
      pageErrors: [...pageErrors],
    };
    console.log('  forms:', quotationForm, 'numberInputs:', discountField, 'approval-labels:', approvalLabel, 'errors:', pageErrors.length);
    await page.screenshot({ path: '/tmp/t25-bug009.png', fullPage: true });

    // ========== BUG-BIZ-008: approvals page role-gate ==========
    pageErrors.length = 0;
    console.log('\n--- BUG-BIZ-008: /approvals ---');
    await page.goto(`${BASE}/approvals`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    const approvalCards = await page.locator('.border.rounded-xl, [class*="border"]').count();
    const approveBtn = await page.locator('button:has-text("Duyệt"), button:has-text("Phê duyệt"), button:has-text("Approve")').count();
    const rejectBtn = await page.locator('button:has-text("Từ chối"), button:has-text("Reject")').count();
    const waitingLockText = await page.locator('text=/Chờ.*\\w+|🔒/i').count();
    const bodyText = await page.textContent('body');
    const hasEmptyState = /chưa có|không có|Empty/i.test(bodyText || '');
    out.bugs['BUG-BIZ-008'] = {
      approvalCards,
      approveButtons: approveBtn,
      rejectButtons: rejectBtn,
      waitingLockHits: waitingLockText,
      hasEmptyState,
      pageErrors: [...pageErrors],
    };
    console.log('  cards:', approvalCards, 'approve-btn:', approveBtn, 'reject-btn:', rejectBtn, 'empty:', hasEmptyState, 'errors:', pageErrors.length);
    await page.screenshot({ path: '/tmp/t25-bug008.png', fullPage: true });

    // ========== Regression check: load 5 migrated list pages ==========
    console.log('\n--- Migrated list pages ---');
    out.migrated = {};
    for (const p of ['orders','customers','quotations','payment-vouchers','approvals']) {
      pageErrors.length = 0;
      try {
        await page.goto(`${BASE}/${p}`, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);
        const h1 = await page.locator('h1').first().textContent().catch(() => null);
        const rows = await page.locator('table tbody tr, [role="row"]').count();
        const errorToast = await page.locator('[class*="sonner"], [role="status"][class*="error"]').count();
        out.migrated[p] = {
          h1,
          rows,
          errorToast,
          pageErrors: [...pageErrors],
        };
        console.log(`  /${p}: h1="${h1}" rows=${rows} errors=${pageErrors.length}`);
      } catch (e) {
        out.migrated[p] = { error: e.message };
        console.log(`  /${p}: ERROR ${e.message}`);
      }
    }

    await ctx.close();
  } catch (e) {
    out.errors.push(e.message);
    console.error('FATAL:', e);
  } finally {
    await browser.close();
  }
  fs.writeFileSync('/tmp/pw-t25.json', JSON.stringify(out, null, 2));
  console.log('\nDONE. JSON -> /tmp/pw-t25.json');
}

main();
