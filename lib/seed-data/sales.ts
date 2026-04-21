"use server";

import { createQuotation, getQuotations } from "@/lib/quotations";
import { createQuotationItem } from "@/lib/quotation-items";
import { createOrder, getOrders } from "@/lib/orders";
import { createOrderItem } from "@/lib/order-items";
import { createContract } from "@/lib/contracts";
import type { MasterIds } from "./master";
import type { CrmIds } from "./crm";

export interface SalesIds {
  quotationIds: string[];
  orderIds: string[];
  orderCodes: string[];
  orderCustomerMap: Record<string, { customerId: string; customerName: string; companyName: string }>;
}

export async function seedSalesData(master: MasterIds, crm: CrmIds): Promise<SalesIds> {
  const { total } = await getOrders({ take: 1 });
  if (total > 0) {
    const { data: orders } = await getOrders({ take: 200 });
    const { data: quots } = await getQuotations({ take: 200 });
    const orderCustomerMap: Record<string, { customerId: string; customerName: string; companyName: string }> = {};
    orders.forEach(o => {
      orderCustomerMap[o.id] = {
        customerId: o.CustomerId || "",
        customerName: o.CustomerName || "",
        companyName: o.CompanyName || "",
      };
    });
    return {
      quotationIds: quots.map(q => q.id),
      orderIds: orders.map(o => o.id),
      orderCodes: orders.map(o => o.OrderCode || ""),
      orderCustomerMap,
    };
  }

  const saleHN = "Đỗ Thị Mai";
  const saleHCM = "Ngô Quang Hải";
  const leaderHN = "Hoàng Thị Lan";
  const leaderHCM = "Vũ Đình Nam";
  const rate = 3580;

  const c = crm.customerIds;
  const cn = crm.customerNames;
  const cc = crm.customerCompanies;

  // --- Quotations (8) ---
  const quotationsData = [
    { QuotationCode: "BG-260320-001", CustomerId: c[0], CustomerName: cn[c[0]], ServiceTypes: ["UTXNK"], Status: "Đã chốt", IsFinal: true, TotalCNY: 85000, ServiceFeeVND: 15000000, ShippingFeeVND: 45000000, TotalVND: 364300000, ExchangeRate: rate, ValidUntil: "2026-04-20", SaleOwner: saleHN, Branch: "HN" },
    { QuotationCode: "BG-260322-002", CustomerId: c[1], CustomerName: cn[c[1]], ServiceTypes: ["MHH", "UTXNK"], Status: "Đã chốt", IsFinal: true, TotalCNY: 120000, ServiceFeeVND: 25000000, ShippingFeeVND: 68000000, TotalVND: 522600000, ExchangeRate: rate, ValidUntil: "2026-04-22", SaleOwner: saleHCM, Branch: "HCM" },
    { QuotationCode: "BG-260325-003", CustomerId: c[2], CustomerName: cn[c[2]], ServiceTypes: ["VCT"], Status: "Đã chốt", IsFinal: true, TotalCNY: 15000, ServiceFeeVND: 3000000, ShippingFeeVND: 12000000, TotalVND: 68700000, ExchangeRate: rate, ValidUntil: "2026-04-25", SaleOwner: saleHN, Branch: "HN" },
    { QuotationCode: "BG-260328-004", CustomerId: c[3], CustomerName: cn[c[3]], ServiceTypes: ["MHH"], Status: "Đã chốt", IsFinal: true, TotalCNY: 8500, ServiceFeeVND: 2000000, ShippingFeeVND: 8000000, TotalVND: 40430000, ExchangeRate: rate, ValidUntil: "2026-04-28", SaleOwner: saleHN, Branch: "HN" },
    { QuotationCode: "BG-260401-005", CustomerId: c[4], CustomerName: cn[c[4]], ServiceTypes: ["VCT", "LCLCN"], Status: "Đã chốt", IsFinal: true, TotalCNY: 45000, ServiceFeeVND: 8000000, ShippingFeeVND: 35000000, TotalVND: 204100000, ExchangeRate: rate, ValidUntil: "2026-05-01", SaleOwner: saleHCM, Branch: "HCM" },
    { QuotationCode: "BG-260405-006", CustomerId: c[5], CustomerName: cn[c[5]], ServiceTypes: ["UTXNK"], Status: "Đã gửi", TotalCNY: 60000, ServiceFeeVND: 12000000, ShippingFeeVND: 42000000, TotalVND: 268800000, ExchangeRate: rate, ValidUntil: "2026-05-05", SaleOwner: saleHN, Branch: "HN" },
    { QuotationCode: "BG-260407-007", LeadId: crm.leadIds[0], CustomerName: "Nguyễn Văn An", ServiceTypes: ["VCT"], Status: "Nháp", TotalCNY: 20000, ServiceFeeVND: 4000000, ShippingFeeVND: 15000000, TotalVND: 90600000, ExchangeRate: rate, ValidUntil: "2026-05-07", SaleOwner: saleHN, Branch: "HN" },
    { QuotationCode: "BG-260408-008", CustomerId: c[6], CustomerName: cn[c[6]], ServiceTypes: ["VCT"], Status: "Hết hạn", TotalCNY: 3000, ServiceFeeVND: 1000000, ShippingFeeVND: 5000000, TotalVND: 16740000, ExchangeRate: rate, ValidUntil: "2026-03-30", SaleOwner: saleHN, Branch: "HN" },
  ];

  const quotationIds: string[] = [];
  for (const q of quotationsData) {
    const created = await createQuotation(q);
    quotationIds.push(created.id);
  }

  // --- Quotation Items (16) ---
  const qItems = [
    { QuotationId: quotationIds[0], ProductName: "Bàn gốm sứ cao cấp", SKU: "GS-TABLE-001", Attributes: "120x80cm, men trắng", Quantity: 200, UnitPriceCNY: 250, TotalCNY: 50000 },
    { QuotationId: quotationIds[0], ProductName: "Bình hoa gốm Cảnh Đức", SKU: "GS-VASE-002", Attributes: "Cao 45cm, hoa văn cổ", Quantity: 500, UnitPriceCNY: 70, TotalCNY: 35000 },
    { QuotationId: quotationIds[1], ProductName: "Bàn ăn gỗ sồi 6 chỗ", SKU: "NT-TABLE-001", Attributes: "180x90x75cm, gỗ sồi Mỹ", Quantity: 50, UnitPriceCNY: 1200, TotalCNY: 60000 },
    { QuotationId: quotationIds[1], ProductName: "Ghế ăn gỗ sồi", SKU: "NT-CHAIR-001", Attributes: "Đệm da, gỗ sồi", Quantity: 300, UnitPriceCNY: 150, TotalCNY: 45000 },
    { QuotationId: quotationIds[1], ProductName: "Tủ giày 3 tầng", SKU: "NT-SHOE-001", Attributes: "120x35x100cm", Quantity: 100, UnitPriceCNY: 150, TotalCNY: 15000 },
    { QuotationId: quotationIds[2], ProductName: "Vải cotton Trung Quốc", SKU: "TX-COT-001", Attributes: "Cuộn 50m, khổ 1.5m", Quantity: 100, UnitPriceCNY: 120, TotalCNY: 12000 },
    { QuotationId: quotationIds[2], ProductName: "Chỉ may công nghiệp", SKU: "TX-THR-001", Attributes: "Polyester, 5000m/cuộn", Quantity: 50, UnitPriceCNY: 60, TotalCNY: 3000 },
    { QuotationId: quotationIds[3], ProductName: "Linh kiện điện thoại", SKU: "DT-LCD-001", Attributes: "Màn hình LCD 6.5 inch", Quantity: 500, UnitPriceCNY: 12, TotalCNY: 6000 },
    { QuotationId: quotationIds[3], ProductName: "Ốp lưng silicon", SKU: "DT-CASE-001", Attributes: "Nhiều mẫu, iPhone/Samsung", Quantity: 2000, UnitPriceCNY: 1.25, TotalCNY: 2500 },
    { QuotationId: quotationIds[4], ProductName: "Vải polyester in hoa", SKU: "TX-POLY-001", Attributes: "Cuộn 100m, khổ 1.6m", Quantity: 200, UnitPriceCNY: 150, TotalCNY: 30000 },
    { QuotationId: quotationIds[4], ProductName: "Phụ liệu may mặc", SKU: "TX-ACC-001", Attributes: "Cúc, khóa, nhãn mác", Quantity: 50, UnitPriceCNY: 300, TotalCNY: 15000 },
    { QuotationId: quotationIds[5], ProductName: "Gạch ốp lát 60x60", SKU: "VL-TILE-001", Attributes: "Porcelain, nhiều màu", Quantity: 5000, UnitPriceCNY: 8, TotalCNY: 40000 },
    { QuotationId: quotationIds[5], ProductName: "Bồn rửa đá nhân tạo", SKU: "VL-SINK-001", Attributes: "80x50cm, trắng", Quantity: 200, UnitPriceCNY: 100, TotalCNY: 20000 },
    { QuotationId: quotationIds[6], ProductName: "Hàng gia dụng tổng hợp", SKU: "GD-MIX-001", Attributes: "Nồi, chảo, dao kéo", Quantity: 300, UnitPriceCNY: 50, TotalCNY: 15000 },
    { QuotationId: quotationIds[6], ProductName: "Đèn LED trang trí", SKU: "GD-LED-001", Attributes: "Nhiều kiểu, 220V", Quantity: 200, UnitPriceCNY: 25, TotalCNY: 5000 },
    { QuotationId: quotationIds[7], ProductName: "Phụ kiện thời trang", SKU: "TT-ACC-001", Attributes: "Túi, ví, dây nịt", Quantity: 100, UnitPriceCNY: 30, TotalCNY: 3000 },
  ];

  for (const qi of qItems) {
    await createQuotationItem(qi);
  }

  // --- Orders (15) - spread across lifecycle statuses ---
  const ordersData = [
    // Order 0: UTXNK - Hoàn thành (full lifecycle done)
    { OrderCode: "DH-260320-001", CustomerId: c[0], CustomerName: cn[c[0]], CompanyName: cc[c[0]], ServiceTypes: ["UTXNK"], Status: "Hoàn thành", StageNumber: 13, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 85000, ServiceFeeVND: 15000000, ShippingFeeVND: 45000000, TaxVND: 28000000, TotalVND: 392300000, ExchangeRate: rate, DepositRequired: 117690000, DepositPaid: 117690000, DepositStatus: "Đủ cọc", TotalPaid: 392300000, PaymentStatus: "TT đủ", DeliveryAddress: "KCN Nguyên Khê, Đông Anh, HN", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", EstimatedDelivery: "2026-04-01", ActualDelivery: "2026-03-30", ProfitVND: 58000000, ProfitMargin: 14.8, CommissionVND: 8700000, Priority: "Thường" },
    // Order 1: MHH+UTXNK - Đang vận chuyển
    { OrderCode: "DH-260322-002", CustomerId: c[1], CustomerName: cn[c[1]], CompanyName: cc[c[1]], ServiceTypes: ["MHH", "UTXNK"], Status: "Đang vận chuyển", StageNumber: 8, Branch: "HCM", SaleOwner: saleHCM, LeaderName: leaderHCM, ItemsTotalCNY: 120000, ServiceFeeVND: 25000000, ShippingFeeVND: 68000000, TaxVND: 42000000, TotalVND: 564600000, ExchangeRate: rate, DepositRequired: 169380000, DepositPaid: 169380000, DepositStatus: "Đủ cọc", TotalPaid: 169380000, PaymentStatus: "Cọc", DeliveryAddress: "KCN Hóc Môn, TP.HCM", ReceiverName: "Lê Thị Thu", ReceiverPhone: "0987654322", EstimatedDelivery: "2026-04-14", Priority: "VIP" },
    // Order 2: VCT - Tại kho TQ (chờ đóng container)
    { OrderCode: "DH-260325-003", CustomerId: c[2], CustomerName: cn[c[2]], CompanyName: cc[c[2]], ServiceTypes: ["VCT"], Status: "Tại kho TQ", StageNumber: 5, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 15000, ServiceFeeVND: 3000000, ShippingFeeVND: 12000000, TotalVND: 68700000, ExchangeRate: rate, DepositRequired: 20610000, DepositPaid: 20610000, DepositStatus: "Đủ cọc", TotalPaid: 20610000, PaymentStatus: "Cọc", DeliveryAddress: "78 Trần Hưng Đạo, HN", ReceiverName: "Phạm Quốc Hải", ReceiverPhone: "0912222001", EstimatedDelivery: "2026-04-20", Priority: "Thường" },
    // Order 3: MHH - Đã đặt hàng (sourcing)
    { OrderCode: "DH-260328-004", CustomerId: c[3], CustomerName: cn[c[3]], CompanyName: cc[c[3]], ServiceTypes: ["MHH"], Status: "Đã đặt hàng", StageNumber: 4, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 8500, ServiceFeeVND: 2000000, ShippingFeeVND: 8000000, TotalVND: 40430000, ExchangeRate: rate, DepositRequired: 20215000, DepositPaid: 20215000, DepositStatus: "Đủ cọc", TotalPaid: 20215000, PaymentStatus: "Cọc", DeliveryAddress: "Phố Huế, HN", ReceiverName: "Nguyễn Tân Phát", ReceiverPhone: "0912222002", EstimatedDelivery: "2026-04-25", Priority: "Gấp" },
    // Order 4: VCT+LCLCN - Đang thông quan
    { OrderCode: "DH-260401-005", CustomerId: c[4], CustomerName: cn[c[4]], CompanyName: cc[c[4]], ServiceTypes: ["VCT", "LCLCN"], Status: "Đang thông quan", StageNumber: 9, Branch: "HCM", SaleOwner: saleHCM, LeaderName: leaderHCM, ItemsTotalCNY: 45000, ServiceFeeVND: 8000000, ShippingFeeVND: 35000000, TaxVND: 18000000, TotalVND: 222100000, ExchangeRate: rate, DepositRequired: 66630000, DepositPaid: 66630000, DepositStatus: "Đủ cọc", TotalPaid: 66630000, PaymentStatus: "Cọc", DeliveryAddress: "KCN Tân Bình, TP.HCM", ReceiverName: "Vũ Thị Hằng", ReceiverPhone: "0912222033", EstimatedDelivery: "2026-04-12", Priority: "Thường" },
    // Order 5: UTXNK - Tại kho VN (chờ giao)
    { OrderCode: "DH-260315-006", CustomerId: c[5], CustomerName: cn[c[5]], CompanyName: cc[c[5]], ServiceTypes: ["UTXNK"], Status: "Tại kho VN", StageNumber: 10, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 60000, ServiceFeeVND: 12000000, ShippingFeeVND: 42000000, TaxVND: 22000000, TotalVND: 290800000, ExchangeRate: rate, DepositRequired: 87240000, DepositPaid: 87240000, DepositStatus: "Đủ cọc", TotalPaid: 200000000, PaymentStatus: "TT một phần", DeliveryAddress: "KCN Đông Anh, HN", ReceiverName: "Đặng Thành Công", ReceiverPhone: "0912222004", EstimatedDelivery: "2026-04-10", Priority: "Thường" },
    // Order 6: VCT - Đang giao
    { OrderCode: "DH-260310-007", CustomerId: c[0], CustomerName: cn[c[0]], CompanyName: cc[c[0]], ServiceTypes: ["VCT"], Status: "Đang giao", StageNumber: 11, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 25000, ServiceFeeVND: 5000000, ShippingFeeVND: 18000000, TotalVND: 112500000, ExchangeRate: rate, DepositRequired: 33750000, DepositPaid: 33750000, DepositStatus: "Đủ cọc", TotalPaid: 80000000, PaymentStatus: "TT một phần", DeliveryAddress: "KCN Nguyên Khê, Đông Anh, HN", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", EstimatedDelivery: "2026-04-09", Priority: "Gấp" },
    // Order 7: MHH - Nháp
    { OrderCode: "DH-260408-008", CustomerId: c[6], CustomerName: cn[c[6]], CompanyName: cc[c[6]], ServiceTypes: ["MHH"], Status: "Nháp", StageNumber: 1, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 3000, ServiceFeeVND: 1000000, ShippingFeeVND: 5000000, TotalVND: 16740000, ExchangeRate: rate, DepositRequired: 8370000, DepositPaid: 0, DepositStatus: "Chưa cọc", TotalPaid: 0, PaymentStatus: "Chưa TT", Priority: "Thường" },
    // Order 8: VCT - Đã xác nhận (chờ cọc xong)
    { OrderCode: "DH-260407-009", CustomerId: c[7], CustomerName: cn[c[7]], CompanyName: cc[c[7]], ServiceTypes: ["VCT"], Status: "Đã xác nhận", StageNumber: 3, Branch: "HCM", SaleOwner: saleHCM, LeaderName: leaderHCM, ItemsTotalCNY: 18000, ServiceFeeVND: 4000000, ShippingFeeVND: 14000000, TotalVND: 82440000, ExchangeRate: rate, DepositRequired: 41220000, DepositPaid: 41220000, DepositStatus: "Đủ cọc", TotalPaid: 41220000, PaymentStatus: "Cọc", DeliveryAddress: "Quận 7, TP.HCM", ReceiverName: "Lý Đại Việt", ReceiverPhone: "0912222006", EstimatedDelivery: "2026-04-22", Priority: "Thường" },
    // Order 9: UTXNK - Trong container
    { OrderCode: "DH-260318-010", CustomerId: c[0], CustomerName: cn[c[0]], CompanyName: cc[c[0]], ServiceTypes: ["UTXNK"], Status: "Trong container", StageNumber: 7, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 95000, ServiceFeeVND: 18000000, ShippingFeeVND: 52000000, TaxVND: 32000000, TotalVND: 442100000, ExchangeRate: rate, DepositRequired: 132630000, DepositPaid: 132630000, DepositStatus: "Đủ cọc", TotalPaid: 300000000, PaymentStatus: "TT một phần", DeliveryAddress: "KCN Nguyên Khê, Đông Anh, HN", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", EstimatedDelivery: "2026-04-18", Priority: "VIP" },
    // Order 10: VCT - Đã giao (chờ quyết toán)
    { OrderCode: "DH-260301-011", CustomerId: c[2], CustomerName: cn[c[2]], CompanyName: cc[c[2]], ServiceTypes: ["VCT"], Status: "Đã giao", StageNumber: 12, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 12000, ServiceFeeVND: 2500000, ShippingFeeVND: 10000000, TotalVND: 55460000, ExchangeRate: rate, DepositRequired: 16638000, DepositPaid: 16638000, DepositStatus: "Đủ cọc", TotalPaid: 55460000, PaymentStatus: "TT đủ", DeliveryAddress: "78 Trần Hưng Đạo, HN", ReceiverName: "Phạm Quốc Hải", ReceiverPhone: "0912222001", EstimatedDelivery: "2026-04-05", ActualDelivery: "2026-04-04", ProfitVND: 8500000, ProfitMargin: 15.3, Priority: "Thường" },
    // Order 11: MHH - Tại cửa khẩu
    { OrderCode: "DH-260312-012", CustomerId: c[1], CustomerName: cn[c[1]], CompanyName: cc[c[1]], ServiceTypes: ["MHH", "LCLCN"], Status: "Tại cửa khẩu", StageNumber: 8, Branch: "HCM", SaleOwner: saleHCM, LeaderName: leaderHCM, ItemsTotalCNY: 75000, ServiceFeeVND: 15000000, ShippingFeeVND: 48000000, TaxVND: 28000000, TotalVND: 359500000, ExchangeRate: rate, DepositRequired: 107850000, DepositPaid: 107850000, DepositStatus: "Đủ cọc", TotalPaid: 250000000, PaymentStatus: "TT một phần", DeliveryAddress: "KCN Hóc Môn, TP.HCM", ReceiverName: "Lê Thị Thu", ReceiverPhone: "0987654322", EstimatedDelivery: "2026-04-15", Priority: "Thường" },
    // Order 12: Đã hủy
    { OrderCode: "DH-260305-013", CustomerId: c[8], CustomerName: cn[c[8]], CompanyName: cc[c[8]], ServiceTypes: ["VCT"], Status: "Đã hủy", Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 5000, TotalVND: 17900000, ExchangeRate: rate, DepositRequired: 8950000, DepositPaid: 0, DepositStatus: "Chưa cọc", TotalPaid: 0, PaymentStatus: "Chưa TT", Priority: "Thường", CancelReason: "KH không đặt cọc sau 7 ngày, tự động hủy" },
    // Order 13: Tạm giữ
    { OrderCode: "DH-260330-014", CustomerId: c[3], CustomerName: cn[c[3]], CompanyName: cc[c[3]], ServiceTypes: ["MHH"], Status: "Tạm giữ", StageNumber: 5, Branch: "HN", SaleOwner: saleHN, LeaderName: leaderHN, ItemsTotalCNY: 6000, ServiceFeeVND: 1500000, ShippingFeeVND: 6000000, TotalVND: 28980000, ExchangeRate: rate, DepositRequired: 14490000, DepositPaid: 14490000, DepositStatus: "Đủ cọc", TotalPaid: 14490000, PaymentStatus: "Cọc", Priority: "Thường", Notes: "Tạm giữ: KH yêu cầu kiểm tra lại chất lượng hàng tại kho TQ" },
    // Order 14: Chờ duyệt
    { OrderCode: "DH-260409-015", CustomerId: c[4], CustomerName: cn[c[4]], CompanyName: cc[c[4]], ServiceTypes: ["VCT"], Status: "Chờ duyệt", StageNumber: 2, Branch: "HCM", SaleOwner: saleHCM, LeaderName: leaderHCM, ItemsTotalCNY: 22000, ServiceFeeVND: 5000000, ShippingFeeVND: 16000000, TotalVND: 99760000, ExchangeRate: rate, DepositRequired: 29928000, DepositPaid: 0, DepositStatus: "Chưa cọc", TotalPaid: 0, PaymentStatus: "Chưa TT", Priority: "Thường", Notes: "Đơn mới hôm nay, chờ Leader duyệt" },
  ];

  const orderIds: string[] = [];
  const orderCodes: string[] = [];
  const orderCustomerMap: Record<string, { customerId: string; customerName: string; companyName: string }> = {};
  for (const o of ordersData) {
    const created = await createOrder(o);
    orderIds.push(created.id);
    orderCodes.push(o.OrderCode);
    orderCustomerMap[created.id] = {
      customerId: o.CustomerId || "",
      customerName: o.CustomerName || "",
      companyName: o.CompanyName || "",
    };
  }

  // --- Order Items (30) ---
  const sup = master.supplierIds;
  const orderItemsData = [
    // Order 0 items (UTXNK gốm sứ - hoàn thành)
    { OrderId: orderIds[0], ProductName: "Bàn gốm sứ cao cấp", SKU: "GS-TABLE-001", Attributes: "120x80cm, men trắng", Quantity: 200, QuantityReceivedCN: 200, QuantityReceivedVN: 200, QuantityDelivered: 200, UnitPriceCNY: 250, TotalCNY: 50000, HSCode: "6911.10", SupplierId: sup[2], TrackingCN: "SF1234567890", Status: "Đã giao" },
    { OrderId: orderIds[0], ProductName: "Bình hoa gốm Cảnh Đức", SKU: "GS-VASE-002", Attributes: "Cao 45cm, hoa văn cổ", Quantity: 500, QuantityReceivedCN: 500, QuantityReceivedVN: 500, QuantityDelivered: 500, UnitPriceCNY: 70, TotalCNY: 35000, HSCode: "6913.90", SupplierId: sup[2], TrackingCN: "SF1234567891", Status: "Đã giao" },
    // Order 1 items (MHH+UTXNK nội thất - đang VC)
    { OrderId: orderIds[1], ProductName: "Bàn ăn gỗ sồi 6 chỗ", SKU: "NT-TABLE-001", Attributes: "180x90x75cm", Quantity: 50, QuantityReceivedCN: 50, UnitPriceCNY: 1200, TotalCNY: 60000, HSCode: "9403.60", SupplierId: sup[0], TrackingCN: "YT9876543210", Status: "Đã về kho TQ" },
    { OrderId: orderIds[1], ProductName: "Ghế ăn gỗ sồi", SKU: "NT-CHAIR-001", Attributes: "Đệm da", Quantity: 300, QuantityReceivedCN: 300, UnitPriceCNY: 150, TotalCNY: 45000, HSCode: "9401.69", SupplierId: sup[0], TrackingCN: "YT9876543211", Status: "Đã về kho TQ" },
    { OrderId: orderIds[1], ProductName: "Tủ giày 3 tầng", SKU: "NT-SHOE-001", Attributes: "120x35x100cm", Quantity: 100, QuantityReceivedCN: 100, UnitPriceCNY: 150, TotalCNY: 15000, HSCode: "9403.60", SupplierId: sup[0], TrackingCN: "YT9876543212", Status: "Đã về kho TQ" },
    // Order 2 items (VCT vải - tại kho TQ)
    { OrderId: orderIds[2], ProductName: "Vải cotton TQ", SKU: "TX-COT-001", Attributes: "Cuộn 50m, khổ 1.5m", Quantity: 100, QuantityReceivedCN: 85, UnitPriceCNY: 120, TotalCNY: 12000, SupplierId: sup[3], TrackingCN: "ZT1111222233", Status: "Đã về kho TQ" },
    { OrderId: orderIds[2], ProductName: "Chỉ may công nghiệp", SKU: "TX-THR-001", Attributes: "5000m/cuộn", Quantity: 50, QuantityReceivedCN: 50, UnitPriceCNY: 60, TotalCNY: 3000, SupplierId: sup[3], TrackingCN: "ZT1111222234", Status: "Đã về kho TQ" },
    // Order 3 items (MHH linh kiện - đã đặt)
    { OrderId: orderIds[3], ProductName: "Màn hình LCD 6.5 inch", SKU: "DT-LCD-001", Quantity: 500, UnitPriceCNY: 12, TotalCNY: 6000, SupplierId: sup[1], Status: "Đã đặt" },
    { OrderId: orderIds[3], ProductName: "Ốp lưng silicon", SKU: "DT-CASE-001", Attributes: "Nhiều mẫu", Quantity: 2000, UnitPriceCNY: 1.25, TotalCNY: 2500, SupplierId: sup[1], Status: "Đang SX" },
    // Order 4 items (VCT+LCLCN vải - đang thông quan)
    { OrderId: orderIds[4], ProductName: "Vải polyester in hoa", SKU: "TX-POLY-001", Attributes: "Cuộn 100m", Quantity: 200, QuantityReceivedCN: 200, QuantityReceivedVN: 0, UnitPriceCNY: 150, TotalCNY: 30000, HSCode: "5407.52", SupplierId: sup[3], TrackingCN: "JD5555666677", Status: "Đã về kho TQ" },
    { OrderId: orderIds[4], ProductName: "Phụ liệu may mặc", SKU: "TX-ACC-001", Quantity: 50, QuantityReceivedCN: 50, QuantityReceivedVN: 0, UnitPriceCNY: 300, TotalCNY: 15000, HSCode: "9606.10", SupplierId: sup[3], TrackingCN: "JD5555666678", Status: "Đã về kho TQ" },
    // Order 5 items (UTXNK gạch - tại kho VN)
    { OrderId: orderIds[5], ProductName: "Gạch ốp lát 60x60", SKU: "VL-TILE-001", Quantity: 5000, QuantityReceivedCN: 5000, QuantityReceivedVN: 5000, UnitPriceCNY: 8, TotalCNY: 40000, HSCode: "6907.21", SupplierId: sup[2], TrackingCN: "DB8888999900", Status: "Đã về kho TQ" },
    { OrderId: orderIds[5], ProductName: "Bồn rửa đá nhân tạo", SKU: "VL-SINK-001", Quantity: 200, QuantityReceivedCN: 200, QuantityReceivedVN: 198, UnitPriceCNY: 100, TotalCNY: 20000, HSCode: "6810.99", SupplierId: sup[2], TrackingCN: "DB8888999901", Status: "Đã về kho TQ" },
    // Order 6 items (VCT - đang giao)
    { OrderId: orderIds[6], ProductName: "Bộ nồi inox 5 món", SKU: "GD-POT-001", Quantity: 200, QuantityReceivedCN: 200, QuantityReceivedVN: 200, QuantityDelivered: 0, UnitPriceCNY: 80, TotalCNY: 16000, TrackingCN: "EMS3333444455", Status: "Đã về kho TQ" },
    { OrderId: orderIds[6], ProductName: "Chảo chống dính", SKU: "GD-PAN-001", Quantity: 300, QuantityReceivedCN: 300, QuantityReceivedVN: 300, QuantityDelivered: 0, UnitPriceCNY: 30, TotalCNY: 9000, TrackingCN: "EMS3333444456", Status: "Đã về kho TQ" },
    // Order 9 items (UTXNK - trong container)
    { OrderId: orderIds[9], ProductName: "Bàn gốm tròn lớn", SKU: "GS-RTABLE-001", Attributes: "D120cm", Quantity: 150, QuantityReceivedCN: 150, UnitPriceCNY: 350, TotalCNY: 52500, HSCode: "6911.10", SupplierId: sup[2], TrackingCN: "SF6666777788", Status: "Đã về kho TQ" },
    { OrderId: orderIds[9], ProductName: "Lọ gốm trang trí", SKU: "GS-JAR-001", Quantity: 1000, QuantityReceivedCN: 1000, UnitPriceCNY: 42.5, TotalCNY: 42500, HSCode: "6913.90", SupplierId: sup[2], TrackingCN: "SF6666777789", Status: "Đã về kho TQ" },
    // Order 10 items (VCT - đã giao)
    { OrderId: orderIds[10], ProductName: "Vải lụa tơ tằm", SKU: "TX-SILK-001", Quantity: 80, QuantityReceivedCN: 80, QuantityReceivedVN: 80, QuantityDelivered: 80, UnitPriceCNY: 150, TotalCNY: 12000, TrackingCN: "ZTO2222333344", Status: "Đã giao" },
    // Order 11 items (MHH+LCLCN - tại cửa khẩu)
    { OrderId: orderIds[11], ProductName: "Sofa da 3 chỗ", SKU: "NT-SOFA-001", Attributes: "Da bò thật, 220cm", Quantity: 30, QuantityReceivedCN: 30, UnitPriceCNY: 1500, TotalCNY: 45000, HSCode: "9401.61", SupplierId: sup[0], TrackingCN: "YD4444555566", Status: "Đã về kho TQ" },
    { OrderId: orderIds[11], ProductName: "Bàn trà kính cường lực", SKU: "NT-CTABLE-001", Quantity: 60, QuantityReceivedCN: 60, UnitPriceCNY: 500, TotalCNY: 30000, HSCode: "9403.89", SupplierId: sup[0], TrackingCN: "YD4444555567", Status: "Đã về kho TQ" },
  ];

  for (const oi of orderItemsData) {
    await createOrderItem(oi);
  }

  // --- Contracts (5) ---
  const contractsData = [
    { ContractCode: "HD-260320-001", OrderId: orderIds[0], OrderCode: orderCodes[0], CustomerId: c[0], CustomerName: cn[c[0]], Title: "HĐ UTXNK gốm sứ Foshan - Lô 1", ContractValue: 392300000, Currency: "VND", SignDate: "2026-03-20", StartDate: "2026-03-20", EndDate: "2026-04-30", Status: "Hoàn thành", SaleOwner: saleHN },
    { ContractCode: "HD-260322-002", OrderId: orderIds[1], OrderCode: orderCodes[1], CustomerId: c[1], CustomerName: cn[c[1]], Title: "HĐ MHH+UTXNK nội thất gỗ sồi", ContractValue: 564600000, Currency: "VND", SignDate: "2026-03-22", StartDate: "2026-03-22", EndDate: "2026-05-15", Status: "Đang thực hiện", SaleOwner: saleHCM },
    { ContractCode: "HD-260318-003", OrderId: orderIds[9], OrderCode: orderCodes[9], CustomerId: c[0], CustomerName: cn[c[0]], Title: "HĐ UTXNK gốm sứ Foshan - Lô 2", ContractValue: 442100000, Currency: "VND", SignDate: "2026-03-18", StartDate: "2026-03-18", EndDate: "2026-05-10", Status: "Đang thực hiện", SaleOwner: saleHN },
    { ContractCode: "HD-260401-004", OrderId: orderIds[4], OrderCode: orderCodes[4], CustomerId: c[4], CustomerName: cn[c[4]], Title: "HĐ VC + Thông quan vải polyester", ContractValue: 222100000, Currency: "VND", SignDate: "2026-04-01", StartDate: "2026-04-01", EndDate: "2026-05-20", Status: "Đang thực hiện", SaleOwner: saleHCM },
    { ContractCode: "HD-260315-005", OrderId: orderIds[5], OrderCode: orderCodes[5], CustomerId: c[5], CustomerName: cn[c[5]], Title: "HĐ UTXNK vật liệu xây dựng", ContractValue: 290800000, Currency: "VND", SignDate: "2026-03-15", StartDate: "2026-03-15", EndDate: "2026-04-30", Status: "Đang thực hiện", SaleOwner: saleHN },
  ];

  for (const ct of contractsData) {
    await createContract(ct);
  }

  return { quotationIds, orderIds, orderCodes, orderCustomerMap };
}
