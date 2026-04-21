# TBS ERP — Data Model Reference (App Builder Edition)

> Quick reference for all tables. Actual `createTable()` code lives in each module skill.
> Field types follow Inforact SDK: TEXT, NUMBER, DATE, SINGLE_OPTION, MULTIPLE_OPTIONS, CHECKBOX, LINK, ATTACHMENT, IMAGE.
> Use TEXT for email/phone/URL/currency. Cross-entity references use TEXT (store record ID).

---

## Table Map (23 tables, Wave 1)

| # | Table Name | Lib File | Module Skill | Description |
|---|-----------|----------|-------------|-------------|
| 1 | Leads | `lib/leads.ts` | tbs-crm-lead | Lead/opportunity — NOT a customer yet |
| 2 | LeadActivities | `lib/lead-activities.ts` | tbs-crm-lead | Call logs, notes, interactions |
| 3 | Customers | `lib/customers.ts` | tbs-crm-lead | Converted customers with wallet + QR |
| 4 | Quotations | `lib/quotations.ts` | tbs-order-management | Price quotes with versioning |
| 5 | QuotationItems | `lib/quotation-items.ts` | tbs-order-management | Line items in quotation |
| 6 | Contracts | `lib/contracts.ts` | tbs-order-management | Customer/supplier contracts |
| 7 | **Orders** | `lib/orders.ts` | tbs-order-management | **HUB** — central entity |
| 8 | OrderItems | `lib/order-items.ts` | tbs-order-management | Products in order |
| 9 | OrderHistory | `lib/order-history.ts` | tbs-order-management | Audit trail — status changes |
| 10 | WarehouseCnReceipts | `lib/warehouse-cn-receipts.ts` | tbs-warehouse-logistics | Goods received at China warehouse |
| 11 | Containers | `lib/containers.ts` | tbs-warehouse-logistics | Container planning & tracking |
| 12 | ContainerItems | `lib/container-items.ts` | tbs-warehouse-logistics | Packages assigned to container |
| 13 | WarehouseVnReceipts | `lib/warehouse-vn-receipts.ts` | tbs-warehouse-logistics | Goods received at Vietnam warehouse |
| 14 | DeliveryOrders | `lib/delivery-orders.ts` | tbs-warehouse-logistics | Last-mile delivery dispatch |
| 15 | WalletTransactions | `lib/wallet-transactions.ts` | tbs-finance | Customer wallet top-up & allocation |
| 16 | PaymentVouchers | `lib/payment-vouchers.ts` | tbs-finance | Phiếu thu/chi with anti-fraud |
| 17 | AccountsReceivable | `lib/accounts-receivable.ts` | tbs-finance | AR — công nợ phải thu |
| 18 | AccountsPayable | `lib/accounts-payable.ts` | tbs-finance | AP — công nợ phải trả |
| 19 | ExchangeRates | `lib/exchange-rates.ts` | tbs-finance | Daily CNY/USD → VND rates |
| 20 | Suppliers | `lib/suppliers.ts` | tbs-order-management | NCC, carriers, agents |
| 21 | Approvals | `lib/approvals.ts` | tbs-approval-workflow | Multi-level approval requests |
| 22 | QualityIssues | `lib/quality-issues.ts` | tbs-order-management | Complaints & claims |
| 23 | Employees | `lib/employees.ts` | tbs-erp-domain | Staff + Agent records |

---

## Entity Relationship Diagram (Text)

```
Leads ──(convert)──→ Customers
                        │
                        ├──→ Quotations ──→ QuotationItems
                        │       │
                        │       └──(accept)──→ Orders ◄── HUB
                        │                        │
                        ├──→ Contracts ◄─────────┤
                        │                        │
                        └──→ WalletTransactions   ├──→ OrderItems
                                                  ├──→ OrderHistory
                                                  ├──→ PaymentVouchers
                                                  ├──→ AccountsReceivable
                                                  ├──→ WarehouseCnReceipts
                                                  │       │
                                                  │       └──→ ContainerItems ──→ Containers
                                                  │                                   │
                                                  ├──→ WarehouseVnReceipts ◄──────────┘
                                                  │       │
                                                  │       └──→ DeliveryOrders
                                                  │
                                                  ├──→ Approvals
                                                  ├──→ QualityIssues
                                                  └──→ AccountsPayable ──→ Suppliers
```

**Cross-entity linking**: All references use TEXT fields storing record IDs (e.g., `OrderId`, `CustomerId`, `ContainerId`). The SDK has no relational join — fetch both tables and join client-side.

---

## Field Summary Per Table

### Leads (14 fields)
LeadCode (TEXT), Phone (TEXT), FullName (TEXT), Source (SINGLE_OPTION: Facebook/TikTok/Website/Zalo/Giới thiệu/Khác), Rating (SINGLE_OPTION: Nóng/Ấm/Lạnh/Xấu), Needs (TEXT), Status (SINGLE_OPTION: Mới/Đang khai thác/Đã giao Sale/Đang tư vấn/Đã báo giá/Thành KH/Thất bại), MarketingOwner (TEXT), CSKHOwner (TEXT), SaleOwner (TEXT), LeaderName (TEXT), Branch (SINGLE_OPTION: HN/HCM), FailureReason (TEXT), ConvertedCustomerId (TEXT)

### LeadActivities (5 fields)
LeadId (TEXT), ActivityType (SINGLE_OPTION: Gọi điện/Zalo/Email/Gặp mặt/Ghi chú), Content (TEXT), Result (TEXT), CreatedBy (TEXT)

### Customers (21 fields)
CustomerCode (TEXT), CompanyName (TEXT), ContactName (TEXT), Phone (TEXT), Email (TEXT), Address (TEXT), DeliveryAddress (TEXT), ReceiverName (TEXT), ReceiverPhone (TEXT), TaxCode (TEXT), Tier (SINGLE_OPTION: Prospect/Active/VIP/Inactive/Blacklist), DepositRate (NUMBER), CreditLimit (NUMBER), VNDBalance (NUMBER), CNYBalance (NUMBER), SaleOwner (TEXT), LeaderName (TEXT), Branch (SINGLE_OPTION: HN/HCM), HasXNKLicense (CHECKBOX), SourceLeadId (TEXT), Notes (TEXT)

### Quotations (18 fields)
QuoteCode (TEXT), LeadId (TEXT), CustomerId (TEXT), CustomerName (TEXT), Version (NUMBER), ServiceTypes (MULTIPLE_OPTIONS: VCT/MHH/UTXNK/LCLCN), Route (SINGLE_OPTION: Đường biển/Đường bộ), ItemsTotalCNY (NUMBER), ServiceFee (NUMBER), ShippingFee (NUMBER), EstimatedTax (NUMBER), TotalVND (NUMBER), ExchangeRate (NUMBER), DiscountPercent (NUMBER), Status (SINGLE_OPTION: Nháp/Đã gửi/Đang đàm phán/Chốt/Từ chối/Hết hạn), IsFinal (CHECKBOX), ConvertedOrderId (TEXT), SaleOwner (TEXT)

### QuotationItems (8 fields)
QuotationId (TEXT), ProductLink (TEXT), ProductName (TEXT), Attributes (TEXT), Quantity (NUMBER), UnitPriceCNY (NUMBER), TotalCNY (NUMBER), HSCode (TEXT)

### Contracts (10 fields)
ContractCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), QuotationId (TEXT), OrderId (TEXT), Status (SINGLE_OPTION: Nháp/Chờ ký/Đã ký/Đang thực hiện/Hoàn thành/Chấm dứt), SignedDate (DATE), ExpiryDate (DATE), TotalValue (NUMBER), SaleOwner (TEXT)

### Orders (31 fields)
OrderCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), CompanyName (TEXT), ServiceTypes (MULTIPLE_OPTIONS: VCT/MHH/UTXNK/LCLCN), Status (SINGLE_OPTION: 16 statuses), StageNumber (NUMBER), Branch (SINGLE_OPTION: HN/HCM), SaleOwner (TEXT), LeaderName (TEXT), ItemsTotalCNY (NUMBER), ServiceFeeVND (NUMBER), ShippingFeeVND (NUMBER), TaxVND (NUMBER), TotalVND (NUMBER), ExchangeRate (NUMBER), DepositRequired (NUMBER), DepositPaid (NUMBER), DepositStatus (SINGLE_OPTION: 4), TotalPaid (NUMBER), PaymentStatus (SINGLE_OPTION: 5), DeliveryAddress (TEXT), ReceiverName (TEXT), ReceiverPhone (TEXT), EstimatedDelivery (DATE), ActualDelivery (DATE), ProfitVND (NUMBER), ProfitMargin (NUMBER), CommissionVND (NUMBER), Priority (SINGLE_OPTION: Thường/Gấp/VIP), Notes (TEXT), CancelReason (TEXT), SubOrderCount (NUMBER)

### OrderItems (15 fields)
OrderId (TEXT), ProductName (TEXT), ProductLink (TEXT), SKU (TEXT), Attributes (TEXT), Quantity (NUMBER), QuantityReceivedCN (NUMBER), QuantityReceivedVN (NUMBER), QuantityDelivered (NUMBER), UnitPriceCNY (NUMBER), TotalCNY (NUMBER), HSCode (TEXT), SupplierId (TEXT), TrackingCN (TEXT), Status (SINGLE_OPTION: Chờ mua/Đã đặt/Đang SX/Đã về kho TQ/Đã giao)

### OrderHistory (6 fields)
OrderId (TEXT), FromStatus (TEXT), ToStatus (TEXT), Action (TEXT), Note (TEXT), PerformedBy (TEXT)

### WarehouseCnReceipts (22 fields)
ReceiptCode (TEXT), OrderId (TEXT), OrderCode (TEXT), TrackingCN (TEXT), PackagesExpected (NUMBER), PackagesReceived (NUMBER), TotalReceived (NUMBER), WeightKg (NUMBER), LengthCm (NUMBER), WidthCm (NUMBER), HeightCm (NUMBER), CBM (NUMBER), ChargeableWeight (NUMBER), QCStatus (SINGLE_OPTION: Đạt/Lỗi/Chờ KH duyệt), QCNotes (TEXT), LabelStatus (SINGLE_OPTION: Tem HQ OK/Cần in bù/Chỉ mã nội bộ), InternalBarcode (TEXT), Status (SINGLE_OPTION: 8 statuses), ExtraServices (MULTIPLE_OPTIONS: 5 options), ExtraServiceFee (NUMBER), IsUnidentified (CHECKBOX), Agent (TEXT), VerifiedBySale (CHECKBOX), VerifiedAt (DATE)

### Containers (18 fields)
ContainerCode (TEXT), ContainerType (SINGLE_OPTION: 20ft/40ft/40ft HC/Xe tải), Route (SINGLE_OPTION: Đường biển/Đường bộ), CarrierId (TEXT), CarrierName (TEXT), VesselCode (TEXT), SealNumber (TEXT), BookingDate (DATE), ETD (DATE), ETA (DATE), ActualDeparture (DATE), ActualArrival (DATE), DestinationWarehouse (SINGLE_OPTION: Đông Anh (HN)/Hóc Môn (HCM)), TotalCBM (NUMBER), MaxCBM (NUMBER), FillRate (NUMBER), TotalPackages (NUMBER), Status (SINGLE_OPTION: 11 statuses), CreatedBy (TEXT), ApprovedBy (TEXT)

### ContainerItems (8 fields)
ContainerId (TEXT), OrderId (TEXT), OrderCode (TEXT), ReceiptId (TEXT), Packages (NUMBER), WeightKg (NUMBER), CBM (NUMBER), LoadedAt (DATE), ScanVerified (CHECKBOX)

### WarehouseVnReceipts (12 fields)
ReceiptCode (TEXT), ContainerId (TEXT), OrderId (TEXT), OrderCode (TEXT), Warehouse (SINGLE_OPTION: Đông Anh (HN)/Hóc Môn (HCM)), PackagesExpected (NUMBER), PackagesReceived (NUMBER), Discrepancy (NUMBER), WeightKg (NUMBER), Status (SINGLE_OPTION: 8 statuses), Location (TEXT), Notes (TEXT), ReceivedBy (TEXT)

### DeliveryOrders (18 fields)
DeliveryCode (TEXT), OrderId (TEXT), OrderCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), DeliveryAddress (TEXT), ReceiverName (TEXT), ReceiverPhone (TEXT), ScheduledDate (DATE), TimeSlot (SINGLE_OPTION: Sáng (8-12h)/Chiều (13-17h)/Cả ngày), Driver (TEXT), Vehicle (TEXT), Packages (NUMBER), Status (SINGLE_OPTION: 6 statuses), CODAmount (NUMBER), CODCollected (NUMBER), CODSubmitted (CHECKBOX), FailureReason (TEXT), AssignedBy (TEXT), HasDocuments (CHECKBOX)

### WalletTransactions (12 fields)
TxCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), Type (SINGLE_OPTION: Nạp VND/Nạp CNY/Phân bổ cọc/Phân bổ trả nợ/Đổi tệ/Hoàn tiền), Amount (NUMBER), Currency (SINGLE_OPTION: VND/CNY/USD), ExchangeRate (NUMBER), OrderId (TEXT), OrderCode (TEXT), BalanceAfter (NUMBER), Status (SINGLE_OPTION: Chờ KT duyệt/Đã duyệt/Từ chối), RejectReason (TEXT), CreatedBy (TEXT), ApprovedBy (TEXT)

### PaymentVouchers (19 fields)
VoucherCode (TEXT), Type (SINGLE_OPTION: Phiếu thu/Phiếu chi), OrderId (TEXT), OrderCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), SupplierId (TEXT), SupplierName (TEXT), ExpenseType (SINGLE_OPTION: 10 types), Amount (NUMBER), Currency (SINGLE_OPTION: VND/CNY/USD), ExchangeRate (NUMBER), Beneficiary (TEXT), Reason (TEXT), Status (SINGLE_OPTION: 6 statuses), IsFlagged (CHECKBOX), FlagReason (TEXT), CreatedBy (TEXT), ApprovedByKT (TEXT), ApprovedByMgmt (TEXT)

### AccountsReceivable (12 fields)
ARCode (TEXT), OrderId (TEXT), OrderCode (TEXT), CustomerId (TEXT), CustomerName (TEXT), InvoiceAmount (NUMBER), PaidAmount (NUMBER), Remaining (NUMBER), DueDate (DATE), Status (SINGLE_OPTION: Chưa thu/Thu một phần/Quá hạn/Đã thu/Xóa nợ), CollectionNotes (TEXT), SaleOwner (TEXT)

### AccountsPayable (10 fields)
APCode (TEXT), OrderId (TEXT), SupplierId (TEXT), SupplierName (TEXT), InvoiceAmount (NUMBER), Currency (SINGLE_OPTION: VND/CNY/USD), PaidAmount (NUMBER), Remaining (NUMBER), DueDate (DATE), Status (SINGLE_OPTION: Mở/Đã duyệt/Đã lên lịch/TT một phần/Đã TT), VoucherId (TEXT)

### ExchangeRates (5 fields)
Date (DATE), FromCurrency (SINGLE_OPTION: CNY/USD), ToCurrency (SINGLE_OPTION: VND), Rate (NUMBER), SetBy (TEXT)

### Suppliers (13 fields)
SupplierCode (TEXT), Name (TEXT), Type (SINGLE_OPTION: NCC hàng hóa/Hãng tàu/Hãng xe/Agent/Khác), Country (SINGLE_OPTION: TQ/VN/Khác), ContactName (TEXT), Phone (TEXT), Platform (SINGLE_OPTION: 1688/Taobao/Trực tiếp/Khác), PlatformLink (TEXT), PaymentTerms (TEXT), Rating (NUMBER), Status (SINGLE_OPTION: 6 statuses), IsApproved (CHECKBOX), Notes (TEXT)

### Approvals (18 fields)
ApprovalCode (TEXT), Type (SINGLE_OPTION: 7 types), ReferenceType (SINGLE_OPTION: 5 types), ReferenceId (TEXT), ReferenceCode (TEXT), RequestedBy (TEXT), CurrentApprover (TEXT), ApprovalChain (TEXT — JSON), CurrentStep (NUMBER), TotalSteps (NUMBER), Status (SINGLE_OPTION: 5 statuses), SLAHours (NUMBER), SLADeadline (DATE), IsOverdue (CHECKBOX), EscalatedTo (TEXT), Decision (SINGLE_OPTION: Chấp nhận/Từ chối), DecisionNote (TEXT), DecidedAt (DATE), Summary (TEXT), Amount (NUMBER)

### QualityIssues (13 fields)
IssueCode (TEXT), OrderId (TEXT), CustomerId (TEXT), Type (SINGLE_OPTION: Hết hàng/Sai hàng/Thiếu hàng/Hỏng/Giao chậm/Khác), Severity (SINGLE_OPTION: Nhẹ/Nặng/Nghiêm trọng), Description (TEXT), CustomerChoice (SINGLE_OPTION: Giữ hàng/Trả hàng/Đổi hàng), Status (SINGLE_OPTION: 6 statuses), Resolution (TEXT), Compensation (NUMBER), AssignedTo (TEXT), EscalatedTo (TEXT), CreatedBy (TEXT)

### Employees (11 fields)
EmployeeCode (TEXT), FullName (TEXT), Email (TEXT), Phone (TEXT), Department (SINGLE_OPTION: BGĐ/KD/MKT/CSKH/KT/XNK/KHO-TQ/KHO-VN/VT/LOG/NS), Role (TEXT), Branch (SINGLE_OPTION: HN/HCM/TQ), ManagerId (TEXT), Status (SINGLE_OPTION: Đang làm/Nghỉ phép/Đã nghỉ), JoinDate (DATE), Notes (TEXT)

---

## Total: 23 tables, ~290 fields
