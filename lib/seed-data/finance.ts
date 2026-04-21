"use server";

import { createPaymentVoucher, getPaymentVouchers } from "@/lib/payment-vouchers";
import { createAccountReceivable } from "@/lib/accounts-receivable";
import { createAccountPayable } from "@/lib/accounts-payable";
import { createWalletTransaction } from "@/lib/wallet-transactions";
import type { MasterIds } from "./master";
import type { CrmIds } from "./crm";
import type { SalesIds } from "./sales";

export async function seedFinanceData(master: MasterIds, crm: CrmIds, sales: SalesIds): Promise<void> {
  const { total } = await getPaymentVouchers({ take: 1 });
  if (total > 0) return;

  const oid = sales.orderIds;
  const oc = sales.orderCodes;
  const ocm = sales.orderCustomerMap;
  const c = crm.customerIds;
  const cn = crm.customerNames;
  const kttt = "Bùi Văn Thắng";
  const ktth = "Lý Thị Hồng";
  const ceo = "Trần Bình Sơn";
  const saleHN = "Đỗ Thị Mai";
  const saleHCM = "Ngô Quang Hải";
  const rate = 3580;

  // --- Payment Vouchers (12) ---
  const vouchers = [
    // Phiếu thu - cọc Order 0
    { VoucherCode: "PT-260320-001", Type: "Phiếu thu", OrderId: oid[0], OrderCode: oc[0], CustomerId: ocm[oid[0]].customerId, CustomerName: ocm[oid[0]].customerName, ExpenseType: "Cọc", Amount: 117690000, Currency: "VND", ExchangeRate: rate, Beneficiary: "TBS Group", Reason: "Thu tiền cọc 30% đơn hàng UTXNK gốm sứ Foshan lô 1", Status: "Đã chi", CreatedBy: saleHN, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu thu - thanh toán đủ Order 0
    { VoucherCode: "PT-260402-002", Type: "Phiếu thu", OrderId: oid[0], OrderCode: oc[0], CustomerId: ocm[oid[0]].customerId, CustomerName: ocm[oid[0]].customerName, ExpenseType: "Cọc", Amount: 274610000, Currency: "VND", ExchangeRate: rate, Beneficiary: "TBS Group", Reason: "Thu thanh toán phần còn lại đơn hàng UTXNK gốm sứ, đã giao đủ hàng", Status: "Đã chi", CreatedBy: saleHN, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu chi - thanh toán NCC Order 0
    { VoucherCode: "PC-260325-003", Type: "Phiếu chi", OrderId: oid[0], OrderCode: oc[0], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", ExpenseType: "Thanh toán NCC", Amount: 85000, Currency: "CNY", ExchangeRate: rate, Beneficiary: "Foshan Ceramic World", Reason: "Thanh toán tiền hàng gốm sứ cho NCC Foshan theo PO đã ký", Status: "Đã chi", CreatedBy: saleHN, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu chi - cước VC Order 1
    { VoucherCode: "PC-260403-004", Type: "Phiếu chi", OrderId: oid[1], OrderCode: oc[1], SupplierId: master.supplierIds[4], SupplierName: "Shanghai Global Logistics", ExpenseType: "Cước VC", Amount: 18500, Currency: "CNY", ExchangeRate: rate, Beneficiary: "Shanghai Global Logistics", Reason: "Chi phí vận chuyển container 40ft HC đường biển GZ-HCM cho đơn nội thất", Status: "KT đã duyệt", CreatedBy: saleHCM, ApprovedByKT: kttt },
    // Phiếu thu - cọc Order 1
    { VoucherCode: "PT-260322-005", Type: "Phiếu thu", OrderId: oid[1], OrderCode: oc[1], CustomerId: ocm[oid[1]].customerId, CustomerName: ocm[oid[1]].customerName, ExpenseType: "Cọc", Amount: 169380000, Currency: "VND", ExchangeRate: rate, Beneficiary: "TBS Group", Reason: "Thu cọc 30% đơn hàng MHH+UTXNK nội thất gỗ sồi container 40ft HC", Status: "Đã chi", CreatedBy: saleHCM, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu chi - thuế NK Order 0
    { VoucherCode: "PC-260401-006", Type: "Phiếu chi", OrderId: oid[0], OrderCode: oc[0], ExpenseType: "Thuế NK", Amount: 42000000, Currency: "VND", ExchangeRate: rate, Beneficiary: "Cục Hải quan Lạng Sơn", Reason: "Nộp thuế nhập khẩu tờ khai TK-260329-001, gốm sứ Foshan container 40ft", Status: "Đã chi", CreatedBy: saleHN, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu chi - phát sinh >5M (FLAGGED)
    { VoucherCode: "PC-260408-007", Type: "Phiếu chi", OrderId: oid[5], OrderCode: oc[5], ExpenseType: "Phát sinh", Amount: 8500000, Currency: "VND", ExchangeRate: rate, Beneficiary: "Công ty CP Kho bãi Đông Anh", Reason: "Chi phí phát sinh lưu kho quá hạn 15 ngày cho lô hàng vật liệu xây dựng tại kho VN", Status: "Chờ KT duyệt", IsFlagged: true, FlagReason: "Phát sinh > 5M VND", CreatedBy: saleHN },
    // Phiếu chi - ngoài giờ (FLAGGED)
    { VoucherCode: "PC-260409-008", Type: "Phiếu chi", OrderId: oid[9], OrderCode: oc[9], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", ExpenseType: "Thanh toán NCC", Amount: 95000, Currency: "CNY", ExchangeRate: rate, Beneficiary: "Foshan Ceramic World", Reason: "Thanh toán tiền hàng gốm sứ lô 2 cho NCC Foshan, đơn UTXNK container 40ft", Status: "Chờ KT duyệt", IsFlagged: true, FlagReason: "Tạo ngoài giờ làm việc (19:30)", CreatedBy: saleHN },
    // Phiếu thu - cọc Order 4
    { VoucherCode: "PT-260401-009", Type: "Phiếu thu", OrderId: oid[4], OrderCode: oc[4], CustomerId: ocm[oid[4]].customerId, CustomerName: ocm[oid[4]].customerName, ExpenseType: "Cọc", Amount: 66630000, Currency: "VND", ExchangeRate: rate, Beneficiary: "TBS Group", Reason: "Thu cọc 30% đơn hàng VCT+LCLCN vải polyester cho Dệt may Sài Gòn Star", Status: "Đã chi", CreatedBy: saleHCM, ApprovedByKT: kttt, ApprovedByMgmt: ceo },
    // Phiếu chi - Nháp
    { VoucherCode: "PC-260409-010", Type: "Phiếu chi", OrderId: oid[1], OrderCode: oc[1], SupplierId: master.supplierIds[0], SupplierName: "Guangzhou Yida Trading Co.", ExpenseType: "Thanh toán NCC", Amount: 120000, Currency: "CNY", ExchangeRate: rate, Beneficiary: "Guangzhou Yida Trading Co.", Reason: "Thanh toán tiền hàng nội thất gỗ sồi MHH lô đơn hàng DH-260322-002", Status: "Nháp", CreatedBy: saleHCM },
    // Phiếu chi lớn >50M - chờ BGĐ
    { VoucherCode: "PC-260408-011", Type: "Phiếu chi", OrderId: oid[5], OrderCode: oc[5], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", ExpenseType: "Thanh toán NCC", Amount: 60000, Currency: "CNY", ExchangeRate: rate, Beneficiary: "Foshan Ceramic World", Reason: "Thanh toán tiền hàng gạch ốp lát và bồn rửa cho NCC, đơn UTXNK vật liệu XD", Status: "Chờ BGĐ chi", CreatedBy: saleHN, ApprovedByKT: kttt },
    // Phiếu chi - từ chối
    { VoucherCode: "PC-260407-012", Type: "Phiếu chi", OrderId: oid[3], OrderCode: oc[3], ExpenseType: "Phí giao hàng", Amount: 3000000, Currency: "VND", ExchangeRate: rate, Beneficiary: "Công ty TNHH Vận tải Bắc Nam", Reason: "Chi phí giao hàng nội thành cho đơn linh kiện điện tử (chưa rõ ràng)", Status: "Từ chối", CreatedBy: saleHN, ApprovedByKT: kttt },
  ];

  for (const v of vouchers) {
    await createPaymentVoucher(v);
  }

  // --- Accounts Receivable (10) ---
  const arData = [
    { ARCode: "AR-260320-001", OrderId: oid[0], OrderCode: oc[0], CustomerId: ocm[oid[0]].customerId, CustomerName: ocm[oid[0]].customerName, InvoiceAmount: 392300000, PaidAmount: 392300000, Remaining: 0, DueDate: "2026-04-20", Status: "Đã thu", SaleOwner: saleHN },
    { ARCode: "AR-260322-002", OrderId: oid[1], OrderCode: oc[1], CustomerId: ocm[oid[1]].customerId, CustomerName: ocm[oid[1]].customerName, InvoiceAmount: 564600000, PaidAmount: 169380000, Remaining: 395220000, DueDate: "2026-04-22", Status: "Thu một phần", SaleOwner: saleHCM },
    { ARCode: "AR-260325-003", OrderId: oid[2], OrderCode: oc[2], CustomerId: ocm[oid[2]].customerId, CustomerName: ocm[oid[2]].customerName, InvoiceAmount: 68700000, PaidAmount: 20610000, Remaining: 48090000, DueDate: "2026-04-25", Status: "Thu một phần", SaleOwner: saleHN },
    { ARCode: "AR-260328-004", OrderId: oid[3], OrderCode: oc[3], CustomerId: ocm[oid[3]].customerId, CustomerName: ocm[oid[3]].customerName, InvoiceAmount: 40430000, PaidAmount: 20215000, Remaining: 20215000, DueDate: "2026-04-28", Status: "Thu một phần", SaleOwner: saleHN },
    { ARCode: "AR-260401-005", OrderId: oid[4], OrderCode: oc[4], CustomerId: ocm[oid[4]].customerId, CustomerName: ocm[oid[4]].customerName, InvoiceAmount: 222100000, PaidAmount: 66630000, Remaining: 155470000, DueDate: "2026-05-01", Status: "Thu một phần", SaleOwner: saleHCM },
    { ARCode: "AR-260315-006", OrderId: oid[5], OrderCode: oc[5], CustomerId: ocm[oid[5]].customerId, CustomerName: ocm[oid[5]].customerName, InvoiceAmount: 290800000, PaidAmount: 200000000, Remaining: 90800000, DueDate: "2026-04-15", Status: "Thu một phần", CollectionNotes: "KH cam kết TT nốt khi nhận hàng", SaleOwner: saleHN },
    // Quá hạn >30 ngày
    { ARCode: "AR-260210-007", OrderId: oid[10], OrderCode: oc[10], CustomerId: ocm[oid[10]].customerId, CustomerName: ocm[oid[10]].customerName, InvoiceAmount: 55460000, PaidAmount: 55460000, Remaining: 0, DueDate: "2026-04-01", Status: "Đã thu", SaleOwner: saleHN },
    // Quá hạn - chưa thu
    { ARCode: "AR-260301-008", OrderId: oid[6], OrderCode: oc[6], CustomerId: ocm[oid[6]].customerId, CustomerName: ocm[oid[6]].customerName, InvoiceAmount: 112500000, PaidAmount: 80000000, Remaining: 32500000, DueDate: "2026-04-01", Status: "Quá hạn", CollectionNotes: "Đã nhắc KH 2 lần, hẹn TT khi nhận hàng hôm nay", SaleOwner: saleHN },
    { ARCode: "AR-260318-009", OrderId: oid[9], OrderCode: oc[9], CustomerId: ocm[oid[9]].customerId, CustomerName: ocm[oid[9]].customerName, InvoiceAmount: 442100000, PaidAmount: 300000000, Remaining: 142100000, DueDate: "2026-04-18", Status: "Thu một phần", SaleOwner: saleHN },
    // Xóa nợ
    { ARCode: "AR-260305-010", OrderId: oid[12], OrderCode: oc[12], CustomerId: ocm[oid[12]].customerId, CustomerName: ocm[oid[12]].customerName, InvoiceAmount: 17900000, PaidAmount: 0, Remaining: 0, DueDate: "2026-04-05", Status: "Xóa nợ", CollectionNotes: "Đơn hủy, không phát sinh chi phí, xóa nợ", SaleOwner: saleHN },
  ];

  for (const ar of arData) {
    await createAccountReceivable(ar);
  }

  // --- Accounts Payable (6) ---
  const apData = [
    { APCode: "AP-260325-001", OrderId: oid[0], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", InvoiceAmount: 304300000, Currency: "VND", PaidAmount: 304300000, Remaining: 0, DueDate: "2026-04-25", Status: "Đã TT" },
    { APCode: "AP-260403-002", OrderId: oid[1], SupplierId: master.supplierIds[4], SupplierName: "Shanghai Global Logistics", InvoiceAmount: 66230000, Currency: "VND", PaidAmount: 0, Remaining: 66230000, DueDate: "2026-04-18", Status: "Đã duyệt" },
    { APCode: "AP-260322-003", OrderId: oid[1], SupplierId: master.supplierIds[0], SupplierName: "Guangzhou Yida Trading Co.", InvoiceAmount: 429600000, Currency: "VND", PaidAmount: 0, Remaining: 429600000, DueDate: "2026-04-22", Status: "Mở" },
    { APCode: "AP-260320-004", OrderId: oid[5], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", InvoiceAmount: 214800000, Currency: "VND", PaidAmount: 0, Remaining: 214800000, DueDate: "2026-04-20", Status: "Đã lên lịch" },
    { APCode: "AP-260318-005", OrderId: oid[9], SupplierId: master.supplierIds[2], SupplierName: "Foshan Ceramic World", InvoiceAmount: 340100000, Currency: "VND", PaidAmount: 0, Remaining: 340100000, DueDate: "2026-04-18", Status: "Mở" },
    { APCode: "AP-260328-006", OrderId: oid[3], SupplierId: master.supplierIds[1], SupplierName: "Shenzhen Huawei Electronics", InvoiceAmount: 30430000, Currency: "VND", PaidAmount: 0, Remaining: 30430000, DueDate: "2026-04-28", Status: "Mở" },
  ];

  for (const ap of apData) {
    await createAccountPayable(ap);
  }

  // --- Wallet Transactions (8) ---
  const walletData = [
    { TxCode: "WL-260318-001", CustomerId: c[0], CustomerName: cn[c[0]], Type: "Nạp VND", Amount: 200000000, Currency: "VND", BalanceAfter: 200000000, Status: "Đã duyệt", CreatedBy: saleHN, ApprovedBy: kttt },
    { TxCode: "WL-260319-002", CustomerId: c[0], CustomerName: cn[c[0]], Type: "Nạp CNY", Amount: 30000, Currency: "CNY", ExchangeRate: rate, BalanceAfter: 30000, Status: "Đã duyệt", CreatedBy: saleHN, ApprovedBy: kttt },
    { TxCode: "WL-260320-003", CustomerId: c[0], CustomerName: cn[c[0]], Type: "Phân bổ cọc", Amount: 117690000, Currency: "VND", OrderId: oid[0], OrderCode: oc[0], BalanceAfter: 82310000, Status: "Đã duyệt", CreatedBy: saleHN, ApprovedBy: kttt },
    { TxCode: "WL-260321-004", CustomerId: c[1], CustomerName: cn[c[1]], Type: "Nạp VND", Amount: 350000000, Currency: "VND", BalanceAfter: 350000000, Status: "Đã duyệt", CreatedBy: saleHCM, ApprovedBy: kttt },
    { TxCode: "WL-260322-005", CustomerId: c[1], CustomerName: cn[c[1]], Type: "Phân bổ cọc", Amount: 169380000, Currency: "VND", OrderId: oid[1], OrderCode: oc[1], BalanceAfter: 180620000, Status: "Đã duyệt", CreatedBy: saleHCM, ApprovedBy: kttt },
    { TxCode: "WL-260405-006", CustomerId: c[2], CustomerName: cn[c[2]], Type: "Nạp VND", Amount: 50000000, Currency: "VND", BalanceAfter: 50000000, Status: "Đã duyệt", CreatedBy: saleHN, ApprovedBy: kttt },
    { TxCode: "WL-260408-007", CustomerId: c[0], CustomerName: cn[c[0]], Type: "Nạp CNY", Amount: 10000, Currency: "CNY", ExchangeRate: rate, BalanceAfter: 35000, Status: "Chờ KT duyệt", CreatedBy: saleHN },
    { TxCode: "WL-260409-008", CustomerId: c[4], CustomerName: cn[c[4]], Type: "Nạp VND", Amount: 80000000, Currency: "VND", BalanceAfter: 140000000, Status: "Từ chối", RejectReason: "Chưa nhận được xác nhận chuyển khoản từ ngân hàng", CreatedBy: saleHCM, ApprovedBy: kttt },
  ];

  for (const w of walletData) {
    await createWalletTransaction(w);
  }
}
