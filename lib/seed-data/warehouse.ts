"use server";

import { createWarehouseCnReceipt, getWarehouseCnReceipts } from "@/lib/warehouse-cn-receipts";
import { createContainer, getContainers } from "@/lib/containers";
import { createContainerItem } from "@/lib/container-items";
import { createWarehouseVnReceipt } from "@/lib/warehouse-vn-receipts";
import { createDeliveryOrder } from "@/lib/delivery-orders";
import { createCustomsDeclaration } from "@/lib/customs-declarations";
import { createCustomsDeclarationItem } from "@/lib/customs-declaration-items";
import type { MasterIds } from "./master";
import type { CrmIds } from "./crm";
import type { SalesIds } from "./sales";

export interface WarehouseIds {
  receiptCnIds: string[];
  containerIds: string[];
  containerCodes: string[];
  receiptVnIds: string[];
  deliveryOrderIds: string[];
  customsDeclarationIds: string[];
}

export async function seedWarehouseData(master: MasterIds, crm: CrmIds, sales: SalesIds): Promise<WarehouseIds> {
  const { total } = await getContainers({ take: 1 });
  if (total > 0) {
    const { data: containers } = await getContainers({ take: 200 });
    const { data: rcn } = await getWarehouseCnReceipts({ take: 200 });
    return {
      receiptCnIds: rcn.map(r => r.id),
      containerIds: containers.map(c => c.id),
      containerCodes: containers.map(c => c.ContainerCode || ""),
      receiptVnIds: [],
      deliveryOrderIds: [],
      customsDeclarationIds: [],
    };
  }

  const oid = sales.orderIds;
  const oc = sales.orderCodes;
  const ocm = sales.orderCustomerMap;
  const agent = "Cao Minh Phúc";

  // --- Warehouse CN Receipts (12) ---
  const cnReceipts = [
    // Order 0 (hoàn thành) - 2 receipts
    { ReceiptCode: "WCN-260325-001", OrderId: oid[0], OrderCode: oc[0], TrackingCN: "SF1234567890", PackagesExpected: 40, PackagesReceived: 40, TotalReceived: 40, WeightKg: 1200, LengthCm: 120, WidthCm: 80, HeightCm: 100, CBM: 0.96, ChargeableWeight: 1200, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-001", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-26" },
    { ReceiptCode: "WCN-260326-002", OrderId: oid[0], OrderCode: oc[0], TrackingCN: "SF1234567891", PackagesExpected: 25, PackagesReceived: 25, TotalReceived: 25, WeightKg: 800, LengthCm: 100, WidthCm: 60, HeightCm: 80, CBM: 0.48, ChargeableWeight: 800, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-002", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-27" },
    // Order 1 (đang VC) - 3 receipts
    { ReceiptCode: "WCN-260401-003", OrderId: oid[1], OrderCode: oc[1], TrackingCN: "YT9876543210", PackagesExpected: 25, PackagesReceived: 25, TotalReceived: 25, WeightKg: 2500, LengthCm: 200, WidthCm: 100, HeightCm: 80, CBM: 1.6, ChargeableWeight: 2500, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-003", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-04-02" },
    { ReceiptCode: "WCN-260401-004", OrderId: oid[1], OrderCode: oc[1], TrackingCN: "YT9876543211", PackagesExpected: 60, PackagesReceived: 60, TotalReceived: 60, WeightKg: 1800, LengthCm: 60, WidthCm: 60, HeightCm: 100, CBM: 0.36, ChargeableWeight: 1800, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-004", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-04-02" },
    { ReceiptCode: "WCN-260402-005", OrderId: oid[1], OrderCode: oc[1], TrackingCN: "YT9876543212", PackagesExpected: 20, PackagesReceived: 20, TotalReceived: 20, WeightKg: 600, LengthCm: 130, WidthCm: 40, HeightCm: 110, CBM: 0.572, ChargeableWeight: 600, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-005", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-04-03" },
    // Order 2 (tại kho TQ) - 2 receipts
    { ReceiptCode: "WCN-260405-006", OrderId: oid[2], OrderCode: oc[2], TrackingCN: "ZT1111222233", PackagesExpected: 100, PackagesReceived: 85, TotalReceived: 85, WeightKg: 4250, LengthCm: 150, WidthCm: 50, HeightCm: 120, CBM: 0.9, ChargeableWeight: 4250, QCStatus: "Đạt", LabelStatus: "Chỉ mã nội bộ", InternalBarcode: "TBS-WCN-006", Status: "Trên kệ", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-04-06" },
    { ReceiptCode: "WCN-260406-007", OrderId: oid[2], OrderCode: oc[2], TrackingCN: "ZT1111222234", PackagesExpected: 50, PackagesReceived: 50, TotalReceived: 50, WeightKg: 250, LengthCm: 40, WidthCm: 40, HeightCm: 50, CBM: 0.08, ChargeableWeight: 250, QCStatus: "Đạt", LabelStatus: "Chỉ mã nội bộ", InternalBarcode: "TBS-WCN-007", Status: "Trên kệ", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-04-07" },
    // Order 5 (tại kho VN) - 2 receipts
    { ReceiptCode: "WCN-260320-008", OrderId: oid[5], OrderCode: oc[5], TrackingCN: "DB8888999900", PackagesExpected: 100, PackagesReceived: 100, TotalReceived: 100, WeightKg: 12000, LengthCm: 60, WidthCm: 60, HeightCm: 10, CBM: 0.036, ChargeableWeight: 12000, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-008", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-21" },
    { ReceiptCode: "WCN-260321-009", OrderId: oid[5], OrderCode: oc[5], TrackingCN: "DB8888999901", PackagesExpected: 40, PackagesReceived: 40, TotalReceived: 40, WeightKg: 3200, LengthCm: 90, WidthCm: 55, HeightCm: 30, CBM: 0.1485, ChargeableWeight: 3200, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-009", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-22" },
    // Order 6 (đang giao) - 1 receipt
    { ReceiptCode: "WCN-260315-010", OrderId: oid[6], OrderCode: oc[6], TrackingCN: "EMS3333444455", PackagesExpected: 30, PackagesReceived: 30, TotalReceived: 30, WeightKg: 900, LengthCm: 50, WidthCm: 40, HeightCm: 40, CBM: 0.08, ChargeableWeight: 900, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-010", Status: "Đã xuất", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-16" },
    // Order 9 (trong container) - 2 receipts
    { ReceiptCode: "WCN-260328-011", OrderId: oid[9], OrderCode: oc[9], TrackingCN: "SF6666777788", PackagesExpected: 30, PackagesReceived: 30, TotalReceived: 30, WeightKg: 3000, LengthCm: 130, WidthCm: 130, HeightCm: 20, CBM: 0.338, ChargeableWeight: 3000, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-011", Status: "Đã load", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-29" },
    { ReceiptCode: "WCN-260329-012", OrderId: oid[9], OrderCode: oc[9], TrackingCN: "SF6666777789", PackagesExpected: 50, PackagesReceived: 50, TotalReceived: 50, WeightKg: 2000, LengthCm: 50, WidthCm: 30, HeightCm: 60, CBM: 0.09, ChargeableWeight: 2000, QCStatus: "Đạt", LabelStatus: "Tem HQ OK", InternalBarcode: "TBS-WCN-012", Status: "Đã load", Agent: agent, VerifiedBySale: true, VerifiedAt: "2026-03-30" },
  ];

  const receiptCnIds: string[] = [];
  for (const r of cnReceipts) {
    const created = await createWarehouseCnReceipt(r);
    receiptCnIds.push(created.id);
  }

  // --- Containers (4) ---
  const containersData = [
    // Container 1: Đã về kho (Order 0 - hoàn thành, Order 5 - tại kho VN)
    { ContainerCode: "CNT-260326-001", ContainerType: "40ft", Route: "Đường biển", CarrierId: master.supplierIds[4], CarrierName: "Shanghai Global Logistics", VesselCode: "COSCO-SH2603", SealNumber: "SEAL-001234", BookingDate: "2026-03-26", ETD: "2026-03-28", ETA: "2026-04-03", ActualDeparture: "2026-03-28", ActualArrival: "2026-04-02", DestinationWarehouse: "Đông Anh (HN)", TotalCBM: 48.5, MaxCBM: 65, FillRate: 74.6, TotalPackages: 205, Status: "Hoàn tất", CreatedBy: agent, ApprovedBy: "Đinh Công Vinh" },
    // Container 2: Đang vận chuyển (Order 1 - đang VC)
    { ContainerCode: "CNT-260403-002", ContainerType: "40ft HC", Route: "Đường biển", CarrierId: master.supplierIds[4], CarrierName: "Shanghai Global Logistics", VesselCode: "EVERGREEN-GZ2604", SealNumber: "SEAL-002345", BookingDate: "2026-04-03", ETD: "2026-04-05", ETA: "2026-04-14", ActualDeparture: "2026-04-05", DestinationWarehouse: "Hóc Môn (HCM)", TotalCBM: 52.5, MaxCBM: 76, FillRate: 69.1, TotalPackages: 105, Status: "Đang vận chuyển", CreatedBy: agent, ApprovedBy: "Đinh Công Vinh" },
    // Container 3: Đang xếp (Order 9 - trong container, Order 2 items pending)
    { ContainerCode: "CNT-260408-003", ContainerType: "40ft", Route: "Đường bộ", CarrierId: master.supplierIds[5], CarrierName: "Công ty TNHH Vận tải Bắc Nam", SealNumber: "SEAL-003456", BookingDate: "2026-04-08", ETD: "2026-04-10", ETA: "2026-04-13", DestinationWarehouse: "Đông Anh (HN)", TotalCBM: 38.2, MaxCBM: 65, FillRate: 58.8, TotalPackages: 80, Status: "Đang xếp", CreatedBy: agent },
    // Container 4: Lập kế hoạch
    { ContainerCode: "CNT-260412-004", ContainerType: "20ft", Route: "Đường biển", DestinationWarehouse: "Đông Anh (HN)", TotalCBM: 0, MaxCBM: 33, FillRate: 0, TotalPackages: 0, Status: "Lập kế hoạch", CreatedBy: agent },
  ];

  const containerIds: string[] = [];
  const containerCodes: string[] = [];
  for (const cnt of containersData) {
    const created = await createContainer(cnt);
    containerIds.push(created.id);
    containerCodes.push(cnt.ContainerCode);
  }

  // --- Container Items (10) ---
  const containerItemsData = [
    // Container 1 items (Order 0 + Order 5)
    { ContainerId: containerIds[0], OrderId: oid[0], OrderCode: oc[0], ReceiptId: receiptCnIds[0], Packages: 40, WeightKg: 1200, CBM: 12.5, LoadedAt: "2026-03-27", ScanVerified: true },
    { ContainerId: containerIds[0], OrderId: oid[0], OrderCode: oc[0], ReceiptId: receiptCnIds[1], Packages: 25, WeightKg: 800, CBM: 8.2, LoadedAt: "2026-03-27", ScanVerified: true },
    { ContainerId: containerIds[0], OrderId: oid[5], OrderCode: oc[5], ReceiptId: receiptCnIds[7], Packages: 100, WeightKg: 12000, CBM: 18.5, LoadedAt: "2026-03-27", ScanVerified: true },
    { ContainerId: containerIds[0], OrderId: oid[5], OrderCode: oc[5], ReceiptId: receiptCnIds[8], Packages: 40, WeightKg: 3200, CBM: 9.3, LoadedAt: "2026-03-27", ScanVerified: true },
    // Container 2 items (Order 1)
    { ContainerId: containerIds[1], OrderId: oid[1], OrderCode: oc[1], ReceiptId: receiptCnIds[2], Packages: 25, WeightKg: 2500, CBM: 22.0, LoadedAt: "2026-04-04", ScanVerified: true },
    { ContainerId: containerIds[1], OrderId: oid[1], OrderCode: oc[1], ReceiptId: receiptCnIds[3], Packages: 60, WeightKg: 1800, CBM: 18.5, LoadedAt: "2026-04-04", ScanVerified: true },
    { ContainerId: containerIds[1], OrderId: oid[1], OrderCode: oc[1], ReceiptId: receiptCnIds[4], Packages: 20, WeightKg: 600, CBM: 12.0, LoadedAt: "2026-04-04", ScanVerified: true },
    // Container 3 items (Order 9)
    { ContainerId: containerIds[2], OrderId: oid[9], OrderCode: oc[9], ReceiptId: receiptCnIds[10], Packages: 30, WeightKg: 3000, CBM: 20.5, LoadedAt: "2026-04-09", ScanVerified: true },
    { ContainerId: containerIds[2], OrderId: oid[9], OrderCode: oc[9], ReceiptId: receiptCnIds[11], Packages: 50, WeightKg: 2000, CBM: 17.7, LoadedAt: "2026-04-09", ScanVerified: false },
  ];

  for (const ci of containerItemsData) {
    await createContainerItem(ci);
  }

  // --- Warehouse VN Receipts (6) ---
  const vnReceipts = [
    // Order 0 (hoàn thành)
    { ReceiptCode: "WVN-260403-001", ContainerId: containerIds[0], OrderId: oid[0], OrderCode: oc[0], Warehouse: "Đông Anh (HN)", PackagesExpected: 65, PackagesReceived: 65, Discrepancy: 0, WeightKg: 2000, Status: "Đã giao", Location: "A-02-05", ReceivedBy: "Đặng Thị Yến", QCStatus: "Đạt", ShelfZone: "A", ShelfRow: "02" },
    // Order 5 (tại kho VN)
    { ReceiptCode: "WVN-260403-002", ContainerId: containerIds[0], OrderId: oid[5], OrderCode: oc[5], Warehouse: "Đông Anh (HN)", PackagesExpected: 140, PackagesReceived: 138, Discrepancy: 2, WeightKg: 15200, Status: "Trên kệ", Location: "B-01-03", ReceivedBy: "Đặng Thị Yến", QCStatus: "Đạt", QCNotes: "Thiếu 2 kiện bồn rửa, đã báo kho TQ", ShelfZone: "B", ShelfRow: "01", DiscrepancyNote: "2 kiện bồn rửa bị kẹt tại kho TQ, chờ chuyến sau" },
    // Order 6 (đang giao)
    { ReceiptCode: "WVN-260330-003", ContainerId: containerIds[0], OrderId: oid[6], OrderCode: oc[6], Warehouse: "Đông Anh (HN)", PackagesExpected: 30, PackagesReceived: 30, Discrepancy: 0, WeightKg: 900, Status: "Chờ giao", Location: "A-03-01", ReceivedBy: "Đặng Thị Yến", QCStatus: "Đạt", ShelfZone: "A", ShelfRow: "03", PickedAt: "2026-04-08", PickedBy: "Đặng Thị Yến" },
    // Order 10 (đã giao)
    { ReceiptCode: "WVN-260402-004", ContainerId: containerIds[0], OrderId: oid[10], OrderCode: oc[10], Warehouse: "Đông Anh (HN)", PackagesExpected: 10, PackagesReceived: 10, Discrepancy: 0, WeightKg: 400, Status: "Đã giao", Location: "C-01-02", ReceivedBy: "Đặng Thị Yến", QCStatus: "Đạt", ShelfZone: "C", ShelfRow: "01" },
  ];

  const receiptVnIds: string[] = [];
  for (const r of vnReceipts) {
    const created = await createWarehouseVnReceipt(r);
    receiptVnIds.push(created.id);
  }

  // --- Delivery Orders (6) ---
  const deliveryData = [
    // Order 0 - đã giao
    { DeliveryCode: "GH-260401-001", OrderId: oid[0], OrderCode: oc[0], CustomerId: ocm[oid[0]].customerId, CustomerName: ocm[oid[0]].customerName, DeliveryAddress: "KCN Nguyên Khê, Đông Anh, HN", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", ScheduledDate: "2026-03-30", TimeSlot: "Sáng (8-12h)", Driver: "Nguyễn Văn Tùng", Vehicle: "30H-12345", Packages: 65, Status: "Đã giao", CODAmount: 0, HasDocuments: true, AssignedBy: "Đặng Thị Yến" },
    // Order 6 - đang giao
    { DeliveryCode: "GH-260409-002", OrderId: oid[6], OrderCode: oc[6], CustomerId: ocm[oid[6]].customerId, CustomerName: ocm[oid[6]].customerName, DeliveryAddress: "KCN Nguyên Khê, Đông Anh, HN", ReceiverName: "Trần Văn Bình", ReceiverPhone: "0987654321", ScheduledDate: "2026-04-09", TimeSlot: "Sáng (8-12h)", Driver: "Nguyễn Văn Tùng", Vehicle: "30H-12345", Packages: 30, Status: "Đang giao", CODAmount: 32500000, CODCollected: 0, AssignedBy: "Đặng Thị Yến" },
    // Order 10 - đã giao
    { DeliveryCode: "GH-260404-003", OrderId: oid[10], OrderCode: oc[10], CustomerId: ocm[oid[10]].customerId, CustomerName: ocm[oid[10]].customerName, DeliveryAddress: "78 Trần Hưng Đạo, HN", ReceiverName: "Phạm Quốc Hải", ReceiverPhone: "0912222001", ScheduledDate: "2026-04-04", TimeSlot: "Chiều (13-17h)", Driver: "Trần Đức Mạnh", Vehicle: "30H-67890", Packages: 10, Status: "Đã giao", CODAmount: 0, HasDocuments: true, AssignedBy: "Đặng Thị Yến" },
    // Order 5 - chờ xếp lịch
    { DeliveryCode: "GH-260410-004", OrderId: oid[5], OrderCode: oc[5], CustomerId: ocm[oid[5]].customerId, CustomerName: ocm[oid[5]].customerName, DeliveryAddress: "KCN Đông Anh, HN", ReceiverName: "Đặng Thành Công", ReceiverPhone: "0912222004", ScheduledDate: "2026-04-10", TimeSlot: "Cả ngày", Packages: 138, Status: "Đã xếp lịch", Driver: "Phạm Hoàng Anh", Vehicle: "51H-44556", AssignedBy: "Đặng Thị Yến" },
    // Failed delivery example
    { DeliveryCode: "GH-260407-005", OrderId: oid[5], OrderCode: oc[5], CustomerId: ocm[oid[5]].customerId, CustomerName: ocm[oid[5]].customerName, DeliveryAddress: "KCN Đông Anh, HN", ReceiverName: "Đặng Thành Công", ReceiverPhone: "0912222004", ScheduledDate: "2026-04-07", TimeSlot: "Sáng (8-12h)", Driver: "Lê Hữu Phước", Vehicle: "30H-11223", Packages: 138, Status: "Giao lỗi", FailureReason: "KH không có người nhận tại địa chỉ, đã gọi 3 lần không nghe máy", AssignedBy: "Đặng Thị Yến" },
    // Chờ xếp lịch
    { DeliveryCode: "GH-260411-006", OrderId: oid[1], OrderCode: oc[1], CustomerId: ocm[oid[1]].customerId, CustomerName: ocm[oid[1]].customerName, DeliveryAddress: "KCN Hóc Môn, TP.HCM", ReceiverName: "Lê Thị Thu", ReceiverPhone: "0987654322", Packages: 105, Status: "Chờ xếp lịch", AssignedBy: "Đặng Thị Yến" },
  ];

  const deliveryOrderIds: string[] = [];
  for (const d of deliveryData) {
    const created = await createDeliveryOrder(d);
    deliveryOrderIds.push(created.id);
  }

  // --- Customs Declarations (3) ---
  const customsData = [
    // Order 0 (UTXNK hoàn thành)
    { DeclarationCode: "TK-260329-001", ContainerId: containerIds[0], ContainerCode: containerCodes[0], DeclarationType: "Chính ngạch (UTXNK)", CustomsOffice: "Lạng Sơn", DeclarationNumber: "310.2026.HQ.001234", RegisterDate: "2026-03-29", ClearanceDate: "2026-04-01", TotalOrdersCount: 2, TotalCBM: 48.5, TotalWeightKg: 17200, TotalValueCNY: 145000, ImportTaxVND: 42000000, VATAmount: 18000000, CustomsFeesVND: 3500000, TotalTaxVND: 63500000, HSCodes: "6911.10, 6913.90, 6907.21, 6810.99", DocumentStatus: "Đã nộp HQ", HasCO: true, HasInvoice: true, HasPackingList: true, HasBillOfLading: true, HasInsurance: true, Status: "Đã thông quan", InspectionType: "Luồng xanh", BrokerId: master.supplierIds[7], BrokerName: "Công ty Dịch vụ HQ Lạng Sơn", XNKStaff: "Đinh Công Vinh" },
    // Order 4 (LCLCN đang thông quan)
    { DeclarationCode: "TK-260408-002", ContainerId: containerIds[1], ContainerCode: containerCodes[1], DeclarationType: "LCL chính ngạch", CustomsOffice: "Cát Lái", DeclarationNumber: "312.2026.HQ.005678", RegisterDate: "2026-04-08", TotalOrdersCount: 1, TotalCBM: 22.5, TotalWeightKg: 8500, TotalValueCNY: 45000, ImportTaxVND: 15000000, VATAmount: 8000000, CustomsFeesVND: 2500000, TotalTaxVND: 25500000, HSCodes: "5407.52, 9606.10", DocumentStatus: "Đã nộp HQ", HasCO: true, HasInvoice: true, HasPackingList: true, HasBillOfLading: true, Status: "Đang kiểm hóa", InspectionType: "Luồng vàng", InspectionNotes: "Yêu cầu kiểm tra mẫu vải, đang chờ kết quả", BrokerId: master.supplierIds[7], BrokerName: "Công ty Dịch vụ HQ Lạng Sơn", XNKStaff: "Đinh Công Vinh" },
    // Order 11 (MHH+LCLCN tại cửa khẩu)
    { DeclarationCode: "TK-260409-003", ContainerId: containerIds[1], ContainerCode: containerCodes[1], DeclarationType: "LCL chính ngạch", CustomsOffice: "Cát Lái", TotalOrdersCount: 1, TotalCBM: 30.0, TotalWeightKg: 6500, TotalValueCNY: 75000, HSCodes: "9401.61, 9403.89", DocumentStatus: "Thiếu chứng từ", HasInvoice: true, HasPackingList: true, Status: "Chuẩn bị hồ sơ", BrokerId: master.supplierIds[7], BrokerName: "Công ty Dịch vụ HQ Lạng Sơn", XNKStaff: "Đinh Công Vinh", Notes: "Chờ bổ sung C/O và B/L từ nhà cung cấp" },
  ];

  const customsDeclarationIds: string[] = [];
  for (const cd of customsData) {
    const created = await createCustomsDeclaration(cd);
    customsDeclarationIds.push(created.id);
  }

  // --- Customs Declaration Items (6) ---
  const cdItems = [
    // Declaration 1 (Order 0)
    { DeclarationId: customsDeclarationIds[0], OrderId: oid[0], OrderCode: oc[0], CustomerName: ocm[oid[0]].customerName, ProductDescription: "Bàn gốm sứ cao cấp", HSCode: "6911.10", Quantity: 200, WeightKg: 1200, CBM: 12.5, ValueCNY: 50000, ImportTaxRate: 15, ImportTaxVND: 26850000, VATRate: 8, VATAmount: 11480000 },
    { DeclarationId: customsDeclarationIds[0], OrderId: oid[0], OrderCode: oc[0], CustomerName: ocm[oid[0]].customerName, ProductDescription: "Bình hoa gốm Cảnh Đức", HSCode: "6913.90", Quantity: 500, WeightKg: 800, CBM: 8.2, ValueCNY: 35000, ImportTaxRate: 15, ImportTaxVND: 18775000, VATRate: 8, VATAmount: 8040000 },
    // Declaration 2 (Order 4)
    { DeclarationId: customsDeclarationIds[1], OrderId: oid[4], OrderCode: oc[4], CustomerName: ocm[oid[4]].customerName, ProductDescription: "Vải polyester in hoa", HSCode: "5407.52", Quantity: 200, WeightKg: 6000, CBM: 15.0, ValueCNY: 30000, ImportTaxRate: 12, ImportTaxVND: 12888000, VATRate: 8, VATAmount: 5520000 },
    { DeclarationId: customsDeclarationIds[1], OrderId: oid[4], OrderCode: oc[4], CustomerName: ocm[oid[4]].customerName, ProductDescription: "Phụ liệu may mặc", HSCode: "9606.10", Quantity: 50, WeightKg: 2500, CBM: 7.5, ValueCNY: 15000, ImportTaxRate: 10, ImportTaxVND: 5370000, VATRate: 8, VATAmount: 2300000 },
    // Declaration 3 (Order 11)
    { DeclarationId: customsDeclarationIds[2], OrderId: oid[11], OrderCode: oc[11], CustomerName: ocm[oid[11]].customerName, ProductDescription: "Sofa da 3 chỗ", HSCode: "9401.61", Quantity: 30, WeightKg: 3500, CBM: 18.0, ValueCNY: 45000, ImportTaxRate: 20, ImportTaxVND: 32220000, VATRate: 10, VATAmount: 16110000 },
    { DeclarationId: customsDeclarationIds[2], OrderId: oid[11], OrderCode: oc[11], CustomerName: ocm[oid[11]].customerName, ProductDescription: "Bàn trà kính cường lực", HSCode: "9403.89", Quantity: 60, WeightKg: 3000, CBM: 12.0, ValueCNY: 30000, ImportTaxRate: 20, ImportTaxVND: 21480000, VATRate: 10, VATAmount: 10740000 },
  ];

  for (const cdi of cdItems) {
    await createCustomsDeclarationItem(cdi);
  }

  return { receiptCnIds, containerIds, containerCodes, receiptVnIds, deliveryOrderIds, customsDeclarationIds };
}
