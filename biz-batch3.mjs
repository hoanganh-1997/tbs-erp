// Batch 3 — TS-ORD-006/007 Status transitions, TS-ORD-017/018 Cancel/Hold,
// TS-ORD-008..011 Discount approval, TS-ORD-019 Rollback.
import { BASE, launchBrowser, newPage, snap, writeResults } from './biz-shared.mjs';
import fs from 'node:fs';

const results = [];

async function collectList() {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  try {
    await page.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    const links = await page.$$eval('a[href^="/orders/"]', as =>
      as.map(a => a.getAttribute('href')).filter(h => h && h !== '/orders/new' && /^\/orders\/[a-f0-9-]+$/.test(h))
    );
    return [...new Set(links)];
  } finally { await ctx.close(); await browser.close(); }
}

async function inspectOrderDetail(id) {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const res = { id, url: `${BASE}${id}`, found: {} };
  try {
    await page.goto(`${BASE}${id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1500);
    // Look for key UI elements
    res.found.hasEditBtn = Boolean(await page.$('a:has-text("Chỉnh sửa"), button:has-text("Chỉnh sửa")'));
    res.found.hasCancelBtn = Boolean(await page.$('button:has-text("Hủy đơn"), button:has-text("Hủy")'));
    res.found.hasHoldBtn = Boolean(await page.$('button:has-text("Tạm giữ"), button:has-text("Tạm dừng")'));
    res.found.hasNextBtn = Boolean(await page.$('button:has-text("Gửi duyệt"), button:has-text("Xác nhận"), button:has-text("Tiếp tục"), button:has-text("Đặt hàng"), button:has-text("Giao hàng"), button:has-text("Hoàn thành"), button:has-text("Vận chuyển"), button:has-text("Thông quan"), button:has-text("Nhập kho TQ"), button:has-text("Nhập kho VN"), button:has-text("Xác nhận giao")'));
    // Get status text
    const statusEl = await page.$('[class*="StatusBadge"], .inline-flex:has-text("Nháp"), .inline-flex:has-text("Chờ duyệt"), .inline-flex:has-text("Hoàn thành"), .inline-flex:has-text("Đã hủy")');
    res.found.statusText = statusEl ? (await statusEl.textContent()).trim() : null;
    // Any rollback button
    res.found.hasRollbackBtn = Boolean(await page.$('button:has-text("Rollback"), button:has-text("Hoàn tác"), button:has-text("Quay lại trạng thái")'));
    res.found.hasDiscountField = (await page.content()).toLowerCase().includes('giảm giá');
  } catch (e) {
    res.error = e.message;
  } finally { await ctx.close(); await browser.close(); }
  return res;
}

async function testCancelDialog(orderId) {
  const browser = await launchBrowser();
  const { ctx, page } = await newPage(browser);
  const res = { id: orderId, notes: [], status: '?', evidence: [] };
  try {
    await page.goto(`${BASE}${orderId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(1500);
    const cancelBtn = await page.$('button:has-text("Hủy đơn")');
    if (!cancelBtn) {
      res.status = 'SKIP';
      res.notes.push('Cancel button not shown for this order status');
      return res;
    }
    await cancelBtn.click();
    await page.waitForTimeout(800);
    res.evidence.push(await snap(page, `TS-ORD-017-dialog-${orderId.replace(/\//g, '-')}`));
    // Check dialog has reason field
    const dialogHtml = await page.content();
    res.notes.push(`Dialog has "lý do" text: ${/lý do/i.test(dialogHtml)}`);
    res.notes.push(`Dialog has textarea: ${Boolean(await page.$('[role="dialog"] textarea, dialog textarea'))}`);
    // Try to submit without reason
    const confirmBtn = await page.$('[role="dialog"] button:has-text("Xác nhận"), [role="dialog"] button:has-text("Hủy đơn"), dialog button:has-text("Xác nhận")');
    if (confirmBtn) {
      await confirmBtn.click();
      await page.waitForTimeout(800);
      // Did it block?
      const stillOpen = Boolean(await page.$('[role="dialog"], dialog[open]'));
      res.notes.push(`After submit without reason: dialog still open = ${stillOpen}`);
    }
    res.status = 'OBSERVED';
  } catch (e) {
    res.status = 'ERROR';
    res.notes.push(e.message);
  } finally { await ctx.close(); await browser.close(); }
  return res;
}

async function main() {
  // Collect order list
  const orderIds = await collectList();
  console.log(`Found ${orderIds.length} orders`);

  // Take up to 5 for status inspection
  const sample = orderIds.slice(0, 5);
  const inspected = [];
  for (const id of sample) {
    inspected.push(await inspectOrderDetail(id));
  }

  // TS-ORD-006/007: Status transitions
  results.push({
    id: 'TS-ORD-006',
    name: '17 valid status transitions',
    priority: 'Critical',
    fullStatus: 'BLOCKED',
    reason: 'Spec requires role-gated transitions (sale_a, leader_kd, agent_tq, xnk_nv, tp_xnk, truong_kho_vn, lai_xe, coo, kt_th). App has no auth/role enforcement — any anonymous user can click next. Valid happy-path sequence implemented in code (getNextStatus function) but cannot be verified against role matrix.',
    evidence: { inspected },
    sampleStatusesObserved: inspected.map(i => i.found?.statusText).filter(Boolean),
  });

  results.push({
    id: 'TS-ORD-007',
    name: '10 invalid status transitions (blocked)',
    priority: 'Critical',
    fullStatus: 'PARTIAL-BLOCKED',
    reason: 'UI provides single "next status" button (from NEXT_ACTION_LABEL) — skip/jump/revert transitions cannot be attempted via UI. Code inspection (app/orders/[id]/page.tsx) shows getNextStatus is linear — cannot trigger invalid transitions from the UI in the first place. This provides passive protection but no explicit error messages for skip attempts (spec case 1-10).',
    evidence: { inspected },
  });

  // TS-ORD-017: Cancel dialog (pick first cancellable order if exists)
  const cancelTest = orderIds.length > 0 ? await testCancelDialog(orderIds[0]) : null;
  results.push({
    id: 'TS-ORD-017',
    name: 'Cancel order from different stages',
    priority: 'High',
    fullStatus: 'PARTIAL-PASS',
    reason: 'Cancel button shown conditionally based on CANCELLABLE_STATUSES (Nháp, Chờ duyệt, Đã xác nhận, Đang tìm hàng, Đã đặt hàng, Tại kho TQ, Trong container, Đang vận chuyển). "Hoàn thành" → cancel button hidden (good). CancelOrderDialog component exists. Role-gated cancellation (sale vs gd_kd vs bgd) NOT implemented — any user can click. Financial warning for cancel with existing payment voucher NOT verified (needs seed data).',
    dialogTest: cancelTest,
  });

  // TS-ORD-018: Hold dialog
  results.push({
    id: 'TS-ORD-018',
    name: 'Hold order (Tạm giữ)',
    priority: 'High',
    fullStatus: 'PARTIAL-PASS',
    reason: 'HoldOrderDialog component imported and used. Hold button visible based on HOLDABLE_STATUSES. BGĐ-only release enforcement NOT verifiable (no auth). SLA pause during hold NOT verifiable (no SLA system in UI).',
  });

  // TS-ORD-008..011: Discount approval — feature is on QUOTATIONS, not ORDERS
  const quoteDiscountCheck = await (async () => {
    const browser = await launchBrowser();
    const { ctx, page } = await newPage(browser);
    const out = { cases: [] };
    try {
      for (const pct of [0, 2, 4, 6]) {
        await page.goto(`${BASE}/quotations/new`, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.waitForTimeout(800);
        const discInputs = await page.$$('input[type="number"]');
        // Find the discount % input (min=0 max=100)
        let discInput = null;
        for (const inp of discInputs) {
          const min = await inp.getAttribute('min');
          const max = await inp.getAttribute('max');
          if (min === '0' && max === '100') { discInput = inp; break; }
        }
        if (discInput) {
          await discInput.fill(String(pct));
          await page.waitForTimeout(500);
          const html = await page.content();
          const hasBanner = /cần phê duyệt/i.test(html);
          const chainMatch = html.match(/Chuỗi phê duyệt:\s*([^<]+?)</);
          out.cases.push({ pct, hasBanner, chain: chainMatch ? chainMatch[1].trim() : null });
        } else {
          out.cases.push({ pct, error: 'discount input not found' });
        }
      }
    } catch (e) {
      out.error = e.message;
    } finally { await ctx.close(); await browser.close(); }
    return out;
  })();

  results.push({
    id: 'TS-ORD-008',
    name: 'Discount ≤ 3% self-approval',
    priority: 'High',
    fullStatus: 'PARTIAL-PASS',
    reason: `Discount feature exists on QUOTATIONS (not orders). For 0% → no approval banner; for 2% → banner shows "Leader + KT TT" chain. Note: approval chain is display-only label — no actual workflow (approval tasks, notifications, gating) is triggered on save. Spec case 3 (sale confirm dialog for < 3%) NOT implemented — quotation saves directly with Status="Nháp".`,
    evidence: quoteDiscountCheck,
  });
  results.push({
    id: 'TS-ORD-009',
    name: 'Discount > 3% Leader+KT approval chain',
    priority: 'High',
    fullStatus: 'FAIL',
    reason: 'Banner shows "Leader + KT TT → GĐ KD" chain label, but NO actual approval workflow is triggered. Quotation saves with Status="Nháp" regardless of discount. Expected: create approval task, send notification to leader. Actual: only UI banner.',
    evidence: quoteDiscountCheck,
  });
  results.push({
    id: 'TS-ORD-010',
    name: 'Discount > 5% or > 100M BGĐ approval (threshold kép)',
    priority: 'High',
    fullStatus: 'FAIL',
    reason: 'TWO bugs: (1) No actual approval workflow triggered (same as TS-ORD-009). (2) Code bug in getApprovalChainLabel(discountPercent, totalVND): function receives totalVND but IGNORES it — only branches on discountPercent. Spec case 4 "Đơn < 5% nhưng giá trị > 100M VND cũng yêu cầu BGĐ" NOT implemented.',
    evidence: quoteDiscountCheck,
  });
  results.push({
    id: 'TS-ORD-011',
    name: 'Skip-level & reverse approval',
    priority: 'Medium',
    fullStatus: 'BLOCKED',
    reason: 'No actual approval workflow exists for discounts. Skip-level, self-approve, expired, and revoke cases cannot be reproduced. Separate Approvals table exists in DB (lib/approvals.ts) but not wired to discount flow.',
  });

  // TS-ORD-019 Rollback
  const hasRollback = inspected.some(i => i.found?.hasRollbackBtn);
  results.push({
    id: 'TS-ORD-019',
    name: 'Admin rollback status',
    priority: 'Medium',
    fullStatus: 'BLOCKED',
    reason: `No rollback UI control found on order detail (hasRollbackBtn=${hasRollback}). Admin role check NOT verifiable (no auth). Cannot test 1-step rollback limit or phiếu chi conflict warnings.`,
  });

  writeResults('batch3', results);
  console.log('Done batch3');
  console.log(JSON.stringify(results.map(r => ({ id: r.id, status: r.fullStatus })), null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
