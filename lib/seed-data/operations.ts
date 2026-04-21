"use server";

import { createApproval, getApprovals } from "@/lib/approvals";
import { createOrderHistory } from "@/lib/order-history";
import { createTrackingEvent } from "@/lib/tracking-events";
import { createPackageIssue } from "@/lib/package-issues";
import { createQualityIssue } from "@/lib/quality-issues";
import { createWarehouseService } from "@/lib/warehouse-services";
import type { SalesIds } from "./sales";
import type { WarehouseIds } from "./warehouse";

export async function seedOperationsData(sales: SalesIds, warehouse: WarehouseIds): Promise<void> {
  const { total } = await getApprovals({ take: 1 });
  if (total > 0) return;

  const oid = sales.orderIds;
  const oc = sales.orderCodes;
  const cntId = warehouse.containerIds;
  const cntC = warehouse.containerCodes;
  const rcnId = warehouse.receiptCnIds;

  const leaderHN = "Hoàng Thị Lan";
  const leaderHCM = "Vũ Đình Nam";
  const kttt = "Bùi Văn Thắng";
  const ktth = "Lý Thị Hồng";
  const gdkd = "Phạm Minh Tuấn";
  const ceo = "Trần Bình Sơn";
  const saleHN = "Đỗ Thị Mai";
  const saleHCM = "Ngô Quang Hải";
  const tpxnk = "Đinh Công Vinh";
  const tkTQ = "Cao Minh Phúc";
  const tkVN = "Đặng Thị Yến";

  // --- Approvals (6) ---
  const approvals = [
    // Chờ duyệt - Giảm giá >5%
    { ApprovalCode: "APR-260408-001", Type: "Giảm giá", ReferenceType: "quotation", ReferenceCode: "BG-260405-006", RequestedBy: saleHN, CurrentApprover: leaderHN, ApprovalChain: `${leaderHN} + ${kttt} → ${gdkd} → ${ceo}`, CurrentStep: 1, TotalSteps: 3, Status: "Chờ duyệt", SLAHours: 2, SLADeadline: "2026-04-08", Summary: "Xin giảm giá 8% cho KH Vật liệu XD Thành Công, đơn UTXNK gạch ốp lát 60000 CNY", Amount: 268800000 },
    // Chờ duyệt - Phiếu chi >50M
    { ApprovalCode: "APR-260408-002", Type: "Phiếu chi", ReferenceType: "payment_voucher", ReferenceCode: "PC-260408-011", RequestedBy: saleHN, CurrentApprover: ceo, ApprovalChain: `${kttt} → ${ceo}`, CurrentStep: 2, TotalSteps: 2, Status: "Chờ duyệt", SLAHours: 4, SLADeadline: "2026-04-09", Summary: "Phiếu chi thanh toán NCC Foshan 60,000 CNY (~214.8M VND) cho đơn vật liệu XD", Amount: 214800000 },
    // Đã duyệt - Container plan
    { ApprovalCode: "APR-260403-003", Type: "Container plan", ReferenceType: "container", ReferenceCode: cntC[1], RequestedBy: tkTQ, CurrentApprover: tpxnk, ApprovalChain: `${tpxnk}`, CurrentStep: 1, TotalSteps: 1, Status: "Đã duyệt", SLAHours: 4, Summary: "Duyệt kế hoạch container 40ft HC đường biển GZ-HCM, đơn nội thất", Amount: 0, Decision: "Chấp nhận", DecisionNote: "Fill rate 69% - chấp nhận do hàng gấp", DecidedAt: "2026-04-03" },
    // Đã duyệt - Hủy đơn
    { ApprovalCode: "APR-260312-004", Type: "Hủy đơn", ReferenceType: "order", ReferenceCode: oc[12], RequestedBy: saleHN, CurrentApprover: leaderHN, ApprovalChain: `${leaderHN} → ${gdkd}`, CurrentStep: 2, TotalSteps: 2, Status: "Đã duyệt", SLAHours: 2, Summary: "Hủy đơn VCT cho Bao bì Đông Á - KH không đặt cọc sau 7 ngày", Amount: 17900000, Decision: "Chấp nhận", DecisionNote: "KH không phản hồi, đồng ý hủy", DecidedAt: "2026-03-12" },
    // Từ chối - Miễn cọc
    { ApprovalCode: "APR-260405-005", Type: "Miễn cọc", ReferenceType: "order", ReferenceCode: oc[7], RequestedBy: saleHN, CurrentApprover: gdkd, ApprovalChain: `${leaderHN} → ${gdkd}`, CurrentStep: 2, TotalSteps: 2, Status: "Từ chối", SLAHours: 4, Summary: "Xin miễn cọc cho Shop online Mèo Cute, đơn MHH nhỏ 3000 CNY", Amount: 8370000, Decision: "Từ chối", DecisionNote: "KH mới (Prospect), chưa có lịch sử giao dịch, cần thu cọc đầy đủ", DecidedAt: "2026-04-06" },
    // Đã leo thang
    { ApprovalCode: "APR-260407-006", Type: "Ân hạn", ReferenceType: "order", ReferenceCode: oc[6], RequestedBy: saleHN, CurrentApprover: ceo, ApprovalChain: `${leaderHN} → ${gdkd} → ${ceo}`, CurrentStep: 3, TotalSteps: 3, Status: "Đã leo thang", SLAHours: 8, SLADeadline: "2026-04-09", IsOverdue: true, EscalatedTo: ceo, Summary: "Xin ân hạn 15 ngày cho KH Nội thất Hoàng Gia, đơn VCT 112.5M, còn nợ 32.5M", Amount: 32500000 },
  ];

  for (const a of approvals) {
    await createApproval(a);
  }

  // --- Order History (25) ---
  const historyData = [
    // Order 0 full lifecycle
    { OrderId: oid[0], FromStatus: "", ToStatus: "Nháp", Action: "Tạo đơn", PerformedBy: saleHN },
    { OrderId: oid[0], FromStatus: "Nháp", ToStatus: "Chờ duyệt", Action: "Gửi duyệt", PerformedBy: saleHN },
    { OrderId: oid[0], FromStatus: "Chờ duyệt", ToStatus: "Đã xác nhận", Action: "Duyệt đơn", PerformedBy: leaderHN },
    { OrderId: oid[0], FromStatus: "Đã xác nhận", ToStatus: "Tại kho TQ", Action: "Nhập kho TQ", PerformedBy: tkTQ },
    { OrderId: oid[0], FromStatus: "Tại kho TQ", ToStatus: "Trong container", Action: "Đóng container", PerformedBy: tkTQ },
    { OrderId: oid[0], FromStatus: "Trong container", ToStatus: "Đang vận chuyển", Action: "Xuất container", PerformedBy: tpxnk },
    { OrderId: oid[0], FromStatus: "Đang vận chuyển", ToStatus: "Đang thông quan", Action: "Nộp tờ khai HQ", PerformedBy: tpxnk },
    { OrderId: oid[0], FromStatus: "Đang thông quan", ToStatus: "Tại kho VN", Action: "Thông quan xong", PerformedBy: tpxnk },
    { OrderId: oid[0], FromStatus: "Tại kho VN", ToStatus: "Đang giao", Action: "Xuất kho giao hàng", PerformedBy: tkVN },
    { OrderId: oid[0], FromStatus: "Đang giao", ToStatus: "Đã giao", Action: "Xác nhận đã giao", PerformedBy: tkVN },
    { OrderId: oid[0], FromStatus: "Đã giao", ToStatus: "Hoàn thành", Action: "Quyết toán", PerformedBy: kttt },
    // Order 1 partial
    { OrderId: oid[1], FromStatus: "", ToStatus: "Nháp", Action: "Tạo đơn", PerformedBy: saleHCM },
    { OrderId: oid[1], FromStatus: "Nháp", ToStatus: "Đã xác nhận", Action: "Duyệt đơn", PerformedBy: leaderHCM },
    { OrderId: oid[1], FromStatus: "Đã xác nhận", ToStatus: "Đang tìm hàng", Action: "Bắt đầu tìm NCC", PerformedBy: saleHCM },
    { OrderId: oid[1], FromStatus: "Đang tìm hàng", ToStatus: "Đã đặt hàng", Action: "Đã PO cho NCC", PerformedBy: saleHCM },
    { OrderId: oid[1], FromStatus: "Đã đặt hàng", ToStatus: "Tại kho TQ", Action: "Nhập kho TQ", PerformedBy: tkTQ },
    { OrderId: oid[1], FromStatus: "Tại kho TQ", ToStatus: "Trong container", Action: "Đóng container", PerformedBy: tkTQ },
    { OrderId: oid[1], FromStatus: "Trong container", ToStatus: "Đang vận chuyển", Action: "Xuất container", PerformedBy: tpxnk },
    // Order 12 cancel
    { OrderId: oid[12], FromStatus: "", ToStatus: "Nháp", Action: "Tạo đơn", PerformedBy: saleHN },
    { OrderId: oid[12], FromStatus: "Nháp", ToStatus: "Đã xác nhận", Action: "Duyệt đơn", PerformedBy: leaderHN },
    { OrderId: oid[12], FromStatus: "Đã xác nhận", ToStatus: "Đã hủy", Action: "Hủy đơn", Note: "KH không đặt cọc sau 7 ngày", PerformedBy: leaderHN },
    // Order 14 new today
    { OrderId: oid[14], FromStatus: "", ToStatus: "Nháp", Action: "Tạo đơn", PerformedBy: saleHCM },
    { OrderId: oid[14], FromStatus: "Nháp", ToStatus: "Chờ duyệt", Action: "Gửi duyệt", PerformedBy: saleHCM },
    // Order 13 on hold
    { OrderId: oid[13], FromStatus: "Tại kho TQ", ToStatus: "Tạm giữ", Action: "Tạm giữ đơn", Note: "KH yêu cầu kiểm tra lại chất lượng", PerformedBy: saleHN },
    // Order 6 delivery
    { OrderId: oid[6], FromStatus: "Tại kho VN", ToStatus: "Đang giao", Action: "Xuất kho giao hàng", PerformedBy: tkVN },
  ];

  for (const h of historyData) {
    await createOrderHistory(h);
  }

  // --- Tracking Events (15) ---
  const trackingData = [
    // Order 0 (hoàn thành)
    { OrderId: oid[0], OrderCode: oc[0], ContainerId: cntId[0], ContainerCode: cntC[0], EventType: "Tạo đơn", Description: "Đơn hàng UTXNK gốm sứ Foshan được tạo", Location: "Hà Nội", Actor: saleHN },
    { OrderId: oid[0], OrderCode: oc[0], EventType: "Đã cọc", Description: "Nhận cọc 30% - 117,690,000 VND", Location: "Hà Nội", Actor: kttt },
    { OrderId: oid[0], OrderCode: oc[0], EventType: "Nhập kho TQ", Description: "65 kiện nhập kho Quảng Châu, QC đạt", Location: "Quảng Châu, TQ", Actor: tkTQ },
    { OrderId: oid[0], OrderCode: oc[0], ContainerId: cntId[0], ContainerCode: cntC[0], EventType: "Đóng container", Description: "Đóng vào container 40ft CNT-260326-001", Location: "Quảng Châu, TQ", Actor: tkTQ },
    { OrderId: oid[0], OrderCode: oc[0], ContainerId: cntId[0], ContainerCode: cntC[0], EventType: "Đang vận chuyển", Description: "Container xuất phát, tàu COSCO-SH2603", Location: "Cảng Thượng Hải", Actor: tpxnk },
    { OrderId: oid[0], OrderCode: oc[0], EventType: "Đã thông quan", Description: "Thông quan luồng xanh tại Lạng Sơn", Location: "Cửa khẩu Lạng Sơn", Actor: tpxnk },
    { OrderId: oid[0], OrderCode: oc[0], EventType: "Đã giao", Description: "Giao hàng thành công cho KH", Location: "KCN Nguyên Khê, Đông Anh", Actor: "Nguyễn Văn Tùng" },
    { OrderId: oid[0], OrderCode: oc[0], EventType: "Hoàn thành", Description: "Quyết toán hoàn tất, profit 14.8%", Location: "Hà Nội", Actor: kttt },
    // Container 2 (đang VC)
    { OrderId: oid[1], OrderCode: oc[1], ContainerId: cntId[1], ContainerCode: cntC[1], EventType: "Đóng container", Description: "105 kiện nội thất đóng vào 40ft HC", Location: "Quảng Châu, TQ", Actor: tkTQ },
    { OrderId: oid[1], OrderCode: oc[1], ContainerId: cntId[1], ContainerCode: cntC[1], EventType: "Đang vận chuyển", Description: "Container xuất phát, tàu EVERGREEN-GZ2604", Location: "Cảng Quảng Châu", Actor: tpxnk },
    // Order 4 (đang thông quan)
    { OrderId: oid[4], OrderCode: oc[4], EventType: "Đã nộp tờ khai", Description: "Nộp tờ khai HQ tại Cát Lái, phân luồng vàng", Location: "Cảng Cát Lái, HCM", Actor: tpxnk },
    { OrderId: oid[4], OrderCode: oc[4], EventType: "Đang kiểm hóa", Description: "Hải quan yêu cầu kiểm tra mẫu vải", Location: "Cảng Cát Lái, HCM", Actor: tpxnk },
    // Order 6 (đang giao)
    { OrderId: oid[6], OrderCode: oc[6], EventType: "Đang giao", Description: "Tài xế Tùng xuất phát giao hàng", Location: "Kho Đông Anh", Actor: "Nguyễn Văn Tùng" },
    // Container 3 (đang xếp)
    { ContainerId: cntId[2], ContainerCode: cntC[2], EventType: "Đóng container", Description: "Bắt đầu xếp hàng vào container, 80/150 kiện", Location: "Quảng Châu, TQ", Actor: tkTQ },
    // Sự cố
    { OrderId: oid[5], OrderCode: oc[5], EventType: "Sự cố", Description: "Phát hiện thiếu 2 kiện bồn rửa khi dỡ container tại kho VN", Location: "Kho Đông Anh, HN", Actor: tkVN },
  ];

  for (const t of trackingData) {
    await createTrackingEvent(t);
  }

  // --- Package Issues (4) ---
  const packageIssues = [
    { IssueCode: "PKG-260403-001", ReceiptId: rcnId[7] || "", OrderId: oid[5], OrderCode: oc[5], IssueType: "Thiếu kiện", Description: "Thiếu 2 kiện bồn rửa đá nhân tạo, expected 40 nhưng chỉ nhận 38 khi dỡ container", Severity: "Trung bình", Status: "Đang xử lý", Resolution: "Đang liên hệ kho TQ xác nhận, 2 kiện kẹt lại chờ chuyến sau", ReportedBy: tkVN, AssignedTo: tkTQ },
    { IssueCode: "PKG-260402-002", ReceiptId: rcnId[5] || "", OrderId: oid[2], OrderCode: oc[2], IssueType: "Sai kích thước", Description: "15 cuộn vải cotton thiếu so với đơn, packagesExpected 100 nhưng mới nhận 85", Severity: "Nhẹ", Status: "Chờ KH", Resolution: "NCC cam kết gửi bù 15 cuộn trong lô tiếp theo", ReportedBy: tkTQ, AssignedTo: saleHN },
    { IssueCode: "PKG-260405-003", OrderId: oid[1], OrderCode: oc[1], IssueType: "Hàng hư hỏng", Description: "2 bàn ăn gỗ sồi bị trầy xước mặt bàn trong quá trình vận chuyển nội địa TQ", Severity: "Trung bình", Status: "Đã giải quyết", Resolution: "NCC đã thay 2 bàn mới trước khi đóng container", ReportedBy: tkTQ, AssignedTo: saleHCM },
    { IssueCode: "PKG-260407-004", OrderId: oid[13], OrderCode: oc[13], IssueType: "Sai hàng", Description: "KH phản hồi: mẫu màn hình khác với mẫu đã duyệt, cần xác nhận lại với NCC", Severity: "Nặng", Status: "Mở", ReportedBy: saleHN, AssignedTo: tkTQ },
  ];

  for (const pi of packageIssues) {
    await createPackageIssue(pi);
  }

  // --- Quality Issues (3) ---
  const qualityIssues = [
    { IssueCode: "QI-260404-001", OrderId: oid[0], OrderCode: oc[0], CustomerId: sales.orderCustomerMap[oid[0]].customerId, CustomerName: sales.orderCustomerMap[oid[0]].customerName, IssueType: "Hàng lỗi", Description: "KH phản hồi 3 bình hoa gốm bị nứt chân sau khi nhận hàng", Severity: "Trung bình", Status: "Đã giải quyết", Resolution: "Bồi thường 3 bình x 70 CNY = 210 CNY, trừ vào đơn tiếp theo", CompensationAmount: 751800, ReportedBy: saleHN, AssignedTo: tkTQ },
    { IssueCode: "QI-260408-002", OrderId: oid[5], OrderCode: oc[5], CustomerId: sales.orderCustomerMap[oid[5]].customerId, CustomerName: sales.orderCustomerMap[oid[5]].customerName, IssueType: "Thiếu hàng", Description: "Thiếu 2 kiện bồn rửa so với đơn đặt, đang chờ kho TQ xác nhận", Severity: "Cao", Status: "Đang xử lý", ReportedBy: saleHN, AssignedTo: tkVN },
    { IssueCode: "QI-260409-003", OrderId: oid[6], OrderCode: oc[6], CustomerId: sales.orderCustomerMap[oid[6]].customerId, CustomerName: sales.orderCustomerMap[oid[6]].customerName, IssueType: "Chậm giao", Description: "Đơn hàng chậm giao 2 ngày so với cam kết, KH phàn nàn", Severity: "Thấp", Status: "Đã đóng", Resolution: "Đã xin lỗi KH, giảm 5% phí giao hàng đơn tiếp theo", ReportedBy: saleHN, AssignedTo: tkVN },
  ];

  for (const qi of qualityIssues) {
    await createQualityIssue(qi);
  }

  // --- Warehouse Services (5) ---
  const whServices = [
    { ServiceCode: "WS-260325-001", ReceiptId: rcnId[0] || "", OrderId: oid[0], OrderCode: oc[0], ServiceType: "Kiểm đếm", Quantity: 40, UnitPrice: 5000, TotalFee: 200000, Status: "Đã tính phí", CompletedBy: tkTQ, CompletedAt: "2026-03-25" },
    { ServiceCode: "WS-260326-002", ReceiptId: rcnId[1] || "", OrderId: oid[0], OrderCode: oc[0], ServiceType: "Ảnh chi tiết", Quantity: 10, UnitPrice: 10000, TotalFee: 100000, Status: "Đã tính phí", CompletedBy: tkTQ, CompletedAt: "2026-03-26" },
    { ServiceCode: "WS-260401-003", ReceiptId: rcnId[2] || "", OrderId: oid[1], OrderCode: oc[1], ServiceType: "Đóng gói lại", Quantity: 25, UnitPrice: 15000, TotalFee: 375000, Status: "Hoàn thành", CompletedBy: tkTQ, CompletedAt: "2026-04-01" },
    { ServiceCode: "WS-260405-004", ReceiptId: rcnId[5] || "", OrderId: oid[2], OrderCode: oc[2], ServiceType: "Kiểm đếm", Quantity: 85, UnitPrice: 5000, TotalFee: 425000, Status: "Hoàn thành", CompletedBy: tkTQ, CompletedAt: "2026-04-05" },
    { ServiceCode: "WS-260408-005", ReceiptId: rcnId[10] || "", OrderId: oid[9], OrderCode: oc[9], ServiceType: "Kiện gỗ", Quantity: 5, UnitPrice: 50000, TotalFee: 250000, Status: "Đang xử lý", Notes: "Đóng kiện gỗ cho 5 bàn gốm tròn lớn, đang chờ gỗ" },
  ];

  for (const ws of whServices) {
    await createWarehouseService(ws);
  }
}
