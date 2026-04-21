# Kế hoạch sửa lỗi: Thiếu createdAt / updatedAt trên tất cả bảng dữ liệu

> Ngày lập: 2026-04-08

---

## 1. Vấn đề (Problem)

Hầu hết dữ liệu tạo mới trong hệ thống **không có ngày tạo (createdAt)** và **ngày cập nhật (updatedAt)**.

### Nguyên nhân gốc (Root Cause):
- SDK Inforact hỗ trợ 2 field type hệ thống: `CREATED_AT` và `UPDATED_AT`
- Khi khai báo trong `createTable()`, platform sẽ tự động gán giá trị cho các field này mỗi khi record được tạo/cập nhật
- **Tất cả 25 file `lib/*.ts`** đều KHÔNG khai báo 2 field này trong `createTable()`
- Kết quả: `record.createdAt` và `record.updatedAt` trả về `undefined`

### Bằng chứng:
```typescript
// Hiện tại — THIẾU
const TABLE_ID_PROMISE = createTable('Customers', [
  { name: 'CustomerCode', type: 'TEXT' },
  // ... other fields ...
  // ❌ Không có CREATED_AT, UPDATED_AT
]);

// Cần sửa thành
const TABLE_ID_PROMISE = createTable('Customers', [
  { name: 'CustomerCode', type: 'TEXT' },
  // ... other fields ...
  { name: 'createdAt', type: 'CREATED_AT' },   // ✅ Thêm
  { name: 'updatedAt', type: 'UPDATED_AT' },   // ✅ Thêm
]);
```

### Ảnh hưởng:
- Cột "Ngày tạo" trên tất cả list pages hiển thị `—` thay vì ngày thực tế
- `sortField: "createdAt"` không hoạt động đúng (sort trên field không tồn tại)
- Detail pages không hiển thị được thời gian tạo/cập nhật

---

## 2. Danh sách files cần sửa (25 files)

| # | File | Table Name |
|---|------|-----------|
| 1 | `lib/customers.ts` | Customers |
| 2 | `lib/orders.ts` | Orders |
| 3 | `lib/order-items.ts` | OrderItems |
| 4 | `lib/order-history.ts` | OrderHistory |
| 5 | `lib/leads.ts` | Leads |
| 6 | `lib/lead-activities.ts` | LeadActivities |
| 7 | `lib/quotations.ts` | Quotations |
| 8 | `lib/quotation-items.ts` | QuotationItems |
| 9 | `lib/contracts.ts` | Contracts |
| 10 | `lib/payment-vouchers.ts` | PaymentVouchers |
| 11 | `lib/wallet-transactions.ts` | WalletTransactions |
| 12 | `lib/accounts-receivable.ts` | AccountsReceivable |
| 13 | `lib/accounts-payable.ts` | AccountsPayable |
| 14 | `lib/exchange-rates.ts` | ExchangeRates |
| 15 | `lib/containers.ts` | Containers |
| 16 | `lib/container-items.ts` | ContainerItems |
| 17 | `lib/delivery-orders.ts` | DeliveryOrders |
| 18 | `lib/warehouse-cn-receipts.ts` | WarehouseCnReceipts |
| 19 | `lib/warehouse-vn-receipts.ts` | WarehouseVnReceipts |
| 20 | `lib/quality-issues.ts` | QualityIssues |
| 21 | `lib/suppliers.ts` | Suppliers |
| 22 | `lib/employees.ts` | Employees |
| 23 | `lib/approvals.ts` | Approvals |

> **Không cần sửa:** `lib/inforact-sdk.ts` (SDK core), `lib/init-tables.ts` (import-only), `lib/utils.ts` (utilities)

---

## 3. Thay đổi cần thực hiện

### 3.1 Cho mỗi file `lib/*.ts`:

**Thêm 2 dòng cuối cùng** vào mảng fields trong `createTable()`:

```typescript
  { name: 'createdAt', type: 'CREATED_AT' },
  { name: 'updatedAt', type: 'UPDATED_AT' },
```

### 3.2 Không cần thay đổi:

- ❌ **Type definitions** — `createdAt?: string` và `updatedAt?: string` đã khai báo đúng
- ❌ **mapRecord()** — Đã map `createdAt: record.createdAt` đúng
- ❌ **CreateInput types** — Đã `Omit<..., 'createdAt' | 'updatedAt'>` đúng
- ❌ **Page files** — Đã hiển thị `formatDate(c.createdAt)` đúng
- ❌ **Sort options** — `sortField: "createdAt"` sẽ hoạt động đúng sau khi fix

---

## 4. Verification

Sau khi sửa, kiểm tra:
1. `npx tsc --noEmit` — Không có lỗi TypeScript mới
2. Tạo 1 record mới → kiểm tra `createdAt` có giá trị
3. List pages hiển thị đúng cột "Ngày tạo"
4. Sort theo `createdAt` hoạt động đúng

---

## 5. Estimated Complexity

| Metric | Value |
|--------|-------|
| Files to modify | 23 |
| Lines added per file | 2 |
| Total lines added | ~46 |
| Risk level | LOW — chỉ thêm field declaration, không thay đổi logic |
| Breaking changes | Không |

---

## 6. Build Order

Chỉ có 1 phase duy nhất — sửa tất cả 23 lib files cùng lúc:

### Phase 1: Thêm CREATED_AT + UPDATED_AT vào tất cả createTable() calls
- Sửa lần lượt 23 files
- Mỗi file chỉ thêm 2 dòng vào cuối mảng fields
- Chạy TypeScript check sau khi hoàn thành

> **Lưu ý:** Dữ liệu cũ (đã tạo trước khi fix) có thể vẫn không có `createdAt`. Chỉ dữ liệu tạo mới sau fix mới có giá trị. Tuy nhiên, Inforact platform có thể backfill system fields cho records cũ khi field được khai báo — cần kiểm tra thực tế.
