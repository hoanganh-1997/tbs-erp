#!/usr/bin/env node
// Regression smoke test — all 49 module URLs
import fs from "node:fs";

const BASE = "http://localhost:3000";
const LOG = "/app/workspace/teams/019dae27-f0e2-74db-baeb-df4f3fbb59c0/tbs-erp/smoke-task31.log";

fs.writeFileSync(LOG, `Smoke test started at ${new Date().toISOString()}\n`);
function log(m) { fs.appendFileSync(LOG, m + "\n"); }

const urls = [
  "/",
  "/dashboard",
  // Sales
  "/quotations", "/quotations/new",
  "/orders", "/orders/new",
  "/contracts", "/deposits", "/commissions",
  "/leads", "/customers", "/brands",
  // Finance
  "/payment-vouchers", "/payment-vouchers/new",
  "/payment-schedules", "/receivables",
  "/exchange-rates", "/bank-accounts",
  // Logistics
  "/containers", "/containers/new",
  "/inbound-vn", "/outbound-china", "/transit-lanes",
  "/delivery-orders", "/routes", "/carriers",
  // Warehouse
  "/warehouse-cn", "/warehouse-vn", "/allocations", "/stock-movements",
  // Purchasing
  "/purchase-orders", "/purchase-orders/new",
  "/suppliers", "/goods-receipts", "/supplier-invoices",
  // HR
  "/employees", "/departments", "/roles", "/permissions", "/attendance",
  // Support
  "/complaints", "/complaints/new", "/tickets", "/knowledge-base",
  // System
  "/users", "/audit-logs", "/approvals", "/settings",
  // Reports
  "/reports/sales", "/reports/finance",
];

async function main() {
  let pass = 0, fail = 0;
  for (const u of urls) {
    try {
      const res = await fetch(BASE + u, { cache: "no-store" });
      const ok = res.status < 500;
      const verdict = ok ? "PASS" : "FAIL";
      if (ok) pass++; else fail++;
      log(`${verdict.padEnd(4)} ${String(res.status).padEnd(3)} ${u}`);
    } catch (err) {
      fail++;
      log(`ERR       ${u} — ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  log(`\nTotal: ${urls.length} | PASS: ${pass} | FAIL: ${fail}`);
}

main().catch((e) => log("FATAL: " + e.message));
