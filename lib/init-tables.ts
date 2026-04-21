"use server";

import { getEmployees } from "@/lib/employees";
import { getSuppliers } from "@/lib/suppliers";
import { getVehicles } from "@/lib/vehicles";
import { getDrivers } from "@/lib/drivers";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getLeads } from "@/lib/leads";
import { getLeadActivities } from "@/lib/lead-activities";
import { getCustomers } from "@/lib/customers";
import { getQuotations } from "@/lib/quotations";
import { getQuotationItems } from "@/lib/quotation-items";
import { getOrders } from "@/lib/orders";
import { getOrderItems } from "@/lib/order-items";
import { getOrderHistories } from "@/lib/order-history";
import { getContracts } from "@/lib/contracts";
import { getWarehouseCnReceipts } from "@/lib/warehouse-cn-receipts";
import { getContainers } from "@/lib/containers";
import { getContainerItems } from "@/lib/container-items";
import { getWarehouseVnReceipts } from "@/lib/warehouse-vn-receipts";
import { getDeliveryOrders } from "@/lib/delivery-orders";
import { getPaymentVouchers } from "@/lib/payment-vouchers";
import { getWalletTransactions } from "@/lib/wallet-transactions";
import { getAccountsReceivable } from "@/lib/accounts-receivable";
import { getAccountsPayable } from "@/lib/accounts-payable";
import { getApprovals } from "@/lib/approvals";
import { getQualityIssues } from "@/lib/quality-issues";
import { getTrackingEvents } from "@/lib/tracking-events";
import { getPackageIssues } from "@/lib/package-issues";
import { getWarehouseServices } from "@/lib/warehouse-services";
import { getCustomsDeclarations } from "@/lib/customs-declarations";
import { getCustomsDeclarationItems } from "@/lib/customs-declaration-items";

export interface InitResult {
  table: string;
  status: "ok" | "error";
  error?: string;
}

/**
 * Initialize all 30 tables sequentially.
 *
 * Each get function triggers getTableId() → ensureTable() → registry queue.
 * The registry serializes createTable() calls with 500ms delay to avoid 403.
 * Static imports are used because dynamic import() fails in App Builder.
 */
export async function initAllTables(): Promise<InitResult[]> {
  const results: InitResult[] = [];

  const tables: [string, () => Promise<any>][] = [
    ["Employees", () => getEmployees({ take: 1 })],
    ["Suppliers", () => getSuppliers({ take: 1 })],
    ["Vehicles", () => getVehicles({ take: 1 })],
    ["Drivers", () => getDrivers({ take: 1 })],
    ["ExchangeRates", () => getExchangeRates({ take: 1 })],
    ["Leads", () => getLeads({ take: 1 })],
    ["LeadActivities", () => getLeadActivities({ take: 1 })],
    ["Customers", () => getCustomers({ take: 1 })],
    ["Quotations", () => getQuotations({ take: 1 })],
    ["QuotationItems", () => getQuotationItems({ take: 1 })],
    ["Orders", () => getOrders({ take: 1 })],
    ["OrderItems", () => getOrderItems({ take: 1 })],
    ["OrderHistory", () => getOrderHistories({ take: 1 })],
    ["Contracts", () => getContracts({ take: 1 })],
    ["WarehouseCnReceipts", () => getWarehouseCnReceipts({ take: 1 })],
    ["Containers", () => getContainers({ take: 1 })],
    ["ContainerItems", () => getContainerItems({ take: 1 })],
    ["WarehouseVnReceipts", () => getWarehouseVnReceipts({ take: 1 })],
    ["DeliveryOrders", () => getDeliveryOrders({ take: 1 })],
    ["PaymentVouchers", () => getPaymentVouchers({ take: 1 })],
    ["WalletTransactions", () => getWalletTransactions({ take: 1 })],
    ["AccountsReceivable", () => getAccountsReceivable({ take: 1 })],
    ["AccountsPayable", () => getAccountsPayable({ take: 1 })],
    ["Approvals", () => getApprovals({ take: 1 })],
    ["QualityIssues", () => getQualityIssues({ take: 1 })],
    ["TrackingEvents", () => getTrackingEvents({ take: 1 })],
    ["PackageIssues", () => getPackageIssues({ take: 1 })],
    ["WarehouseServices", () => getWarehouseServices({ take: 1 })],
    ["CustomsDeclarations", () => getCustomsDeclarations({ take: 1 })],
    ["CustomsDeclarationItems", () => getCustomsDeclarationItems({ take: 1 })],
  ];

  for (const [name, init] of tables) {
    try {
      await init();
      results.push({ table: name, status: "ok" });
    } catch (err: any) {
      results.push({ table: name, status: "error", error: err.message || String(err) });
    }
  }

  return results;
}
