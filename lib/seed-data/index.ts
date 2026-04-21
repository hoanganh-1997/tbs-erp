"use server";

import { seedMasterData } from "./master";
import { seedCrmData } from "./crm";
import { seedSalesData } from "./sales";
import { seedWarehouseData } from "./warehouse";
import { seedFinanceData } from "./finance";
import { seedOperationsData } from "./operations";

export interface SeedWaveResult {
  wave: string;
  status: "ok" | "skipped" | "error";
  recordCount: number;
  error?: string;
}

export async function seedAllData(): Promise<SeedWaveResult[]> {
  const results: SeedWaveResult[] = [];

  // Wave 1: Master (5 entity modules: employees, suppliers, vehicles, drivers, exchange-rates)
  try {
    const master = await seedMasterData();
    const count = master.employeeIds.length + master.supplierIds.length + master.vehicleIds.length + master.driverIds.length + 3;
    results.push({ wave: "Master (NV, NCC, Xe, Tài xế, Tỷ giá)", status: count > 0 ? "ok" : "skipped", recordCount: count });

    // Wave 2: CRM (3 entity modules: leads, lead-activities, customers)
    try {
      const crm = await seedCrmData(master);
      const crmCount = crm.leadIds.length + crm.customerIds.length + 20;
      results.push({ wave: "CRM (Leads, KH)", status: crmCount > 0 ? "ok" : "skipped", recordCount: crmCount });

      // Wave 3: Sales (6 entity modules: quotations, quotation-items, orders, order-items, contracts)
      try {
        const sales = await seedSalesData(master, crm);
        const salesCount = sales.quotationIds.length + 16 + sales.orderIds.length + 20 + 5;
        results.push({ wave: "Sales (Báo giá, Đơn hàng, HĐ)", status: salesCount > 0 ? "ok" : "skipped", recordCount: salesCount });

        // Wave 4: Warehouse (7 entity modules)
        try {
          const wh = await seedWarehouseData(master, crm, sales);
          const whCount = wh.receiptCnIds.length + wh.containerIds.length + 9 + wh.receiptVnIds.length + wh.deliveryOrderIds.length + wh.customsDeclarationIds.length + 6;
          results.push({ wave: "Kho & Logistics", status: whCount > 0 ? "ok" : "skipped", recordCount: whCount });

          // Wave 5: Finance (4 entity modules)
          try {
            await seedFinanceData(master, crm, sales);
            results.push({ wave: "Tài chính (PT/PC, AR, AP, Ví)", status: "ok", recordCount: 36 });
          } catch (err: any) {
            results.push({ wave: "Tài chính (PT/PC, AR, AP, Ví)", status: "error", recordCount: 0, error: err.message });
          }

          // Wave 6: Operations (6 entity modules)
          try {
            await seedOperationsData(sales, wh);
            results.push({ wave: "Vận hành (Duyệt, Lịch sử, Tracking)", status: "ok", recordCount: 53 });
          } catch (err: any) {
            results.push({ wave: "Vận hành (Duyệt, Lịch sử, Tracking)", status: "error", recordCount: 0, error: err.message });
          }

        } catch (err: any) {
          results.push({ wave: "Kho & Logistics", status: "error", recordCount: 0, error: err.message });
        }
      } catch (err: any) {
        results.push({ wave: "Sales (Báo giá, Đơn hàng, HĐ)", status: "error", recordCount: 0, error: err.message });
      }
    } catch (err: any) {
      results.push({ wave: "CRM (Leads, KH)", status: "error", recordCount: 0, error: err.message });
    }
  } catch (err: any) {
    results.push({ wave: "Master (NV, NCC, Xe, Tài xế, Tỷ giá)", status: "error", recordCount: 0, error: err.message });
  }

  return results;
}
