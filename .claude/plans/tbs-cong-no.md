# Kế hoạch triển khai: Module Công nợ (AR/AP)

> Module: Công nợ — Quản lý công nợ phải thu (AR), công nợ phải trả (AP), bù trừ, xóa nợ, ân hạn
> Ngày lập: 2026-04-09

---

## 1. Hiện trạng (Current State)

### Đã có:
| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `lib/accounts-receivable.ts` | ✅ Hoàn chỉnh | Entity + CRUD, 12 fields + timestamps |
| `lib/accounts-payable.ts` | ✅ Hoàn chỉnh | Entity + CRUD, 11 fields + timestamps |
| `lib/accountsreceivable.ts` | ⚠️ Duplicate | Bản cũ auto-generated (hardcoded TABLE_ID), nên cleanup |
| `lib/payment-vouchers.ts` | ✅ Hoàn chỉnh | Phiếu thu/chi — liên kết với công nợ |
| `lib/exchange-rates.ts` | ✅ Hoàn chỉnh | Tỷ giá quy đổi CNY/USD → VND |
| `lib/approvals.ts` | ✅ Hoàn chỉnh | Workflow duyệt (hỗ trợ loại "Ân hạn") |
| `app/accounts-receivable/page.tsx` | ✅ Cơ bản | List + aging cards + status tabs + payment modal + pagination |
| `app/accounts-payable/page.tsx` | ✅ Cơ bản | List + summary cards + status tabs + pagination |
| `app/debt-offset/page.tsx` | ❌ Placeholder | Empty state — chưa triển khai |
| `app/invoices/page.tsx` | ❌ Placeholder | Empty state — chưa triển khai |

### Thiếu (Gap Analysis):
| # | Feature | Mức độ | Lý do |
|---|---------|--------|-------|
| 1 | **AR Detail page** | CRITICAL | Không xem chi tiết, lịch sử thu tiền, liên kết đơn hàng |
| 2 | **AP Detail page** | CRITICAL | Không xem chi tiết, không tạo phiếu chi từ AP |
| 3 | **AR search/filter** | HIGH | Không tìm kiếm theo KH, mã đơn, Sale, date range |
| 4 | **AP search/filter** | HIGH | Không tìm kiếm theo NCC, tiền tệ, date range |
| 5 | **Bù trừ công nợ** | HIGH | Page placeholder, chưa implement logic bù trừ AR↔AP |
| 6 | **Tổng hợp công nợ KH** | HIGH | Thiếu view tổng nợ theo từng khách hàng |
| 7 | **Xóa nợ (write-off)** | MEDIUM | Có status "Xóa nợ" nhưng không có workflow duyệt |
| 8 | **Ân hạn (credit extension)** | MEDIUM | Approval flow đã define trong `lib/approvals.ts` nhưng chưa có UI |
| 9 | **AR: ghi nhận thu tiền chi tiết** | MEDIUM | Modal hiện tại đơn giản, thiếu lịch sử payment, nhiều đợt thu |
| 10 | **AP: tạo phiếu chi từ AP** | MEDIUM | Không link trực tiếp AP → tạo PaymentVoucher |
| 11 | **Công nợ Dashboard** | MEDIUM | Thiếu dashboard tổng quan AR+AP, biểu đồ, cảnh báo |
| 12 | **AP: ghi nhận thanh toán** | MEDIUM | Không có modal/flow thanh toán cho AP |
| 13 | **Collection reminders** | LOW | Nhắc Sale thu tiền AR quá hạn |
| 14 | **Cleanup duplicate lib** | LOW | `lib/accountsreceivable.ts` nên xóa |

---

## 2. Entities (Lib Files)

### 2.1 Đã có — Không cần tạo mới:
- `lib/accounts-receivable.ts` — 12 fields, đầy đủ CRUD
- `lib/accounts-payable.ts` — 11 fields, đầy đủ CRUD

### 2.2 Cần tạo mới:

#### `lib/payment-history.ts` — Lịch sử thu/trả tiền
```
PaymentHistoryCode (TEXT)
ReferenceType (SINGLE_OPTION: AR / AP)
ReferenceId (TEXT)               — ID của AR hoặc AP record
ReferenceCode (TEXT)             — ARCode hoặc APCode
OrderId (TEXT)
OrderCode (TEXT)
CustomerId (TEXT)                — Cho AR
CustomerName (TEXT)
SupplierId (TEXT)                — Cho AP
SupplierName (TEXT)
Amount (NUMBER)
Currency (SINGLE_OPTION: VND / CNY / USD)
ExchangeRate (NUMBER)
AmountVND (NUMBER)               — Quy đổi về VND
PaymentMethod (SINGLE_OPTION: Chuyển khoản / Tiền mặt / Ví KH / Bù trừ)
VoucherId (TEXT)                 — Link tới PaymentVoucher
Note (TEXT)
CreatedBy (TEXT)
```
> Mục đích: Ghi lại từng lần thu/trả tiền, hỗ trợ audit trail. Hiện tại AR chỉ có PaidAmount tổng, không biết thu bao nhiêu lần, mỗi lần bao nhiêu.

#### `lib/debt-offsets.ts` — Bù trừ công nợ
```
OffsetCode (TEXT)
CustomerId (TEXT)
CustomerName (TEXT)
ARId (TEXT)                      — AR record được bù
ARCode (TEXT)
APId (TEXT)                      — AP record được bù (nếu có)
APCode (TEXT)
OffsetAmount (NUMBER)
Currency (SINGLE_OPTION: VND / CNY / USD)
Reason (TEXT)
Status (SINGLE_OPTION: Nháp / Chờ KT duyệt / Đã duyệt / Từ chối)
CreatedBy (TEXT)
ApprovedBy (TEXT)
```
> Mục đích: Bù trừ giữa AR (KH nợ mình) và AP (mình nợ cùng KH/NCC), hoặc bù trừ giữa các khoản nợ.

### 2.3 Schema hiện tại:

**AccountsReceivable:**
```
ARCode (TEXT), OrderId (TEXT), OrderCode (TEXT),
CustomerId (TEXT), CustomerName (TEXT),
InvoiceAmount (NUMBER), PaidAmount (NUMBER), Remaining (NUMBER),
DueDate (DATE),
Status (SINGLE_OPTION: Chưa thu / Thu một phần / Quá hạn / Đã thu / Xóa nợ),
CollectionNotes (TEXT), SaleOwner (TEXT)
```

**AccountsPayable:**
```
APCode (TEXT), OrderId (TEXT),
SupplierId (TEXT), SupplierName (TEXT),
InvoiceAmount (NUMBER), Currency (SINGLE_OPTION: VND/CNY/USD),
PaidAmount (NUMBER), Remaining (NUMBER),
DueDate (DATE),
Status (SINGLE_OPTION: Mở / Đã duyệt / Đã lên lịch / TT một phần / Đã TT),
VoucherId (TEXT)
```

### 2.4 Schema cần bổ sung fields (update existing):

**AccountsReceivable — thêm fields:**
- `Currency` (SINGLE_OPTION: VND / CNY / USD) — hiện thiếu, mặc định VND
- `ExchangeRate` (NUMBER) — tỷ giá tại thời điểm tạo
- `DueDays` (NUMBER) — số ngày cho phép (ví dụ: 30 ngày sau giao hàng)
- `ExtendedDueDate` (DATE) — hạn ân hạn mới (nếu được duyệt ân hạn)

**AccountsPayable — thêm fields:**
- `OrderCode` (TEXT) — hiện thiếu, cần để hiển thị

> **Lưu ý**: Thêm fields vào schema hiện có bằng cách sửa `createTable()` call. SDK sẽ auto-migrate.

---

## 3. Pages — Route Structure

### 3.1 Đã có — Cần nâng cấp:

| Route | File | Thay đổi |
|-------|------|----------|
| `/accounts-receivable` | `app/accounts-receivable/page.tsx` | + Search bar + filters (KH, Sale, date range) + bulk actions + aging chart |
| `/accounts-payable` | `app/accounts-payable/page.tsx` | + Search bar + filters (NCC, currency) + aging cards + ghi nhận TT + link tạo phiếu chi |

### 3.2 Cần tạo mới:

| Route | File | Mô tả |
|-------|------|-------|
| `/accounts-receivable/[id]` | `app/accounts-receivable/[id]/page.tsx` | Detail AR: thông tin, lịch sử thu tiền, liên kết order, xóa nợ, ân hạn |
| `/accounts-payable/[id]` | `app/accounts-payable/[id]/page.tsx` | Detail AP: thông tin, lịch sử TT, link phiếu chi, link NCC |
| `/debt-offset` | `app/debt-offset/page.tsx` | Full implementation: list bù trừ + tạo bù trừ mới |
| `/cong-no` | `app/cong-no/page.tsx` | Dashboard tổng hợp AR+AP: KPI, aging chart, top nợ, cảnh báo quá hạn |
| `/cong-no/khach-hang` | `app/cong-no/khach-hang/page.tsx` | Tổng hợp công nợ theo khách hàng: bảng tổng nợ mỗi KH |

---

## 4. Components

### 4.1 Đã có (tái sử dụng):
- `components/page-header.tsx` — Header + action buttons
- `components/status-badge.tsx` — Status badges (đã có AR/AP status colors)
- `components/empty-state.tsx` — Empty state
- `components/kpi-card.tsx` — KPI card component

### 4.2 Cần tạo mới (inline trong page files):

| Component | File | Mô tả |
|-----------|------|-------|
| `AgingBarChart` | Inline `app/cong-no/page.tsx` | Biểu đồ aging AR bằng recharts (5 buckets) |
| `CustomerDebtTable` | Inline `app/cong-no/khach-hang/page.tsx` | Bảng tổng nợ mỗi KH (tổng AR, đã thu, còn lại) |
| `PaymentHistoryList` | Inline `app/accounts-receivable/[id]/page.tsx` | Timeline lịch sử thu tiền |
| `WriteOffModal` | Inline `app/accounts-receivable/[id]/page.tsx` | Modal xóa nợ (nhập lý do → tạo approval) |
| `CreditExtensionModal` | Inline `app/accounts-receivable/[id]/page.tsx` | Modal ân hạn (chọn ngày mới → tạo approval) |
| `RecordPaymentModal` | Inline `app/accounts-payable/[id]/page.tsx` | Modal ghi nhận thanh toán AP |
| `CreateOffsetForm` | Inline `app/debt-offset/page.tsx` | Form tạo bù trừ: chọn AR + AP + amount |

> Tất cả components top-level trong file page, không nested.

---

## 5. Business Rules

### 5.1 AR Status Machine:
```
Chưa thu → Thu một phần → Đã thu
   ↓          ↓
Quá hạn → Thu một phần → Đã thu
   ↓
Xóa nợ (cần approval)
```

**Transitions:**
| Từ | Đến | Điều kiện | Action |
|----|-----|-----------|--------|
| Chưa thu | Thu một phần | PaidAmount > 0 && Remaining > 0 | Thu tiền (modal) |
| Chưa thu | Đã thu | PaidAmount >= InvoiceAmount | Thu tiền (modal, full amount) |
| Chưa thu | Quá hạn | DueDate < today (auto-check on load) | Auto-update |
| Thu một phần | Đã thu | PaidAmount >= InvoiceAmount | Thu thêm (modal) |
| Thu một phần | Quá hạn | DueDate < today && Remaining > 0 | Auto-update |
| Quá hạn | Thu một phần | PaidAmount > 0 | Thu tiền |
| Quá hạn | Đã thu | PaidAmount >= InvoiceAmount | Thu tiền |
| Any open | Xóa nợ | Approval(Ân hạn/Xóa nợ) đã duyệt | KT action |

### 5.2 AP Status Machine:
```
Mở → Đã duyệt → Đã lên lịch → TT một phần → Đã TT
                  Đã duyệt → Đã TT (full payment)
```

**Transitions:**
| Từ | Đến | Điều kiện | Action |
|----|-----|-----------|--------|
| Mở | Đã duyệt | KT duyệt | KT approve |
| Đã duyệt | Đã lên lịch | Link payment voucher | Tạo phiếu chi |
| Đã lên lịch | TT một phần | Voucher đã chi, amount < total | Auto-update from voucher |
| Đã lên lịch | Đã TT | Voucher đã chi, amount >= total | Auto-update from voucher |
| TT một phần | Đã TT | Remaining <= 0 | Thu thêm |

### 5.3 Overdue Auto-Check (on page load):
```typescript
// Run when AR list or detail loads
for (const ar of openARs) {
  if (ar.DueDate && new Date(ar.DueDate) < new Date() 
      && ar.Status !== 'Đã thu' && ar.Status !== 'Xóa nợ' && ar.Status !== 'Quá hạn') {
    await updateAccountReceivable(ar.id, { Status: 'Quá hạn' });
  }
}
```

### 5.4 Xóa nợ (Write-off) Flow:
1. KT click "Xóa nợ" trên AR detail
2. Nhập lý do (min 20 ký tự) + số tiền xóa
3. Tạo Approval (type = "Ân hạn", chain: Sale → CFO → CEO)
4. Khi approval đã duyệt → update AR: Status = "Xóa nợ", Remaining = 0

### 5.5 Ân hạn (Credit Extension) Flow:
1. Sale/KT click "Ân hạn" trên AR detail
2. Chọn ngày hạn mới (phải > DueDate hiện tại)
3. Tạo Approval (type = "Ân hạn", chain: Sale → CFO → CEO, SLA: 24h + 48h + 48h)
4. Khi approval đã duyệt → update AR: ExtendedDueDate = ngày mới, Status reset về trạng thái trước (nếu đang "Quá hạn" → "Chưa thu"/"Thu một phần")

### 5.6 Bù trừ công nợ Rules:
- Chỉ bù trừ giữa AR và AP **cùng khách hàng** (KH vừa là buyer vừa là supplier)
- Hoặc bù trừ giữa nhiều AR của cùng KH (KH trả dư đơn A, bù cho đơn B)
- OffsetAmount ≤ min(AR.Remaining, AP.Remaining)
- Cần KT duyệt trước khi apply
- Khi duyệt: giảm AR.Remaining + giảm AP.Remaining, ghi PaymentHistory (method: "Bù trừ")

### 5.7 Validations:
**Thu tiền AR:**
- Amount > 0
- Amount ≤ AR.Remaining
- Khi thu xong: update PaidAmount, Remaining, Status

**Thanh toán AP:**
- Phải có Phiếu chi (link VoucherId)
- Amount ≤ AP.Remaining

**Xóa nợ:**
- Reason ≥ 20 ký tự
- Amount ≤ AR.Remaining
- Cần approval

---

## 6. Approval Flows

| Loại | Khi nào | Chain | SLA |
|------|---------|-------|-----|
| Xóa nợ | KT request xóa nợ AR | Sale → CFO → CEO | 24h + 48h + 48h |
| Ân hạn | Sale/KT request gia hạn | Sale → CFO → CEO | 24h + 48h + 48h |
| Bù trừ CN | KT tạo bù trừ | KT TT → BGĐ | 2h + 4h |

> Tất cả sử dụng `lib/approvals.ts` hiện có. Type "Ân hạn" đã có sẵn trong schema. Cần thêm "Bù trừ CN" vào options nếu cần (hoặc dùng type chung).

---

## 7. Cross-Module Dependencies

```
                       ┌─── lib/orders.ts (liên kết đơn hàng, tạo AR khi quyết toán)
                       ├─── lib/customers.ts (thông tin KH, tổng nợ KH)
lib/accounts-         ├─── lib/suppliers.ts (thông tin NCC cho AP)
receivable.ts ────────├─── lib/payment-vouchers.ts (link phiếu thu/chi ↔ AR/AP)
lib/accounts-         ├─── lib/exchange-rates.ts (quy đổi tiền tệ)
payable.ts            ├─── lib/approvals.ts (xóa nợ, ân hạn)
                       ├─── lib/wallet-transactions.ts (thu từ ví KH)
                       └─── lib/payment-history.ts (NEW — lịch sử thu/trả)
                       
lib/debt-offsets.ts ──┼─── lib/accounts-receivable.ts
                       └─── lib/accounts-payable.ts
```

**Modules phụ thuộc ngược vào Công nợ:**
- `app/orders/[id]/page.tsx` — hiển thị AR/AP liên kết, nút "Xem công nợ"
- `app/customers/[id]/page.tsx` — tab "Công nợ" hiển thị tổng nợ KH
- `app/payment-vouchers/page.tsx` — hiển thị AR/AP code liên kết

---

## 8. SDK Workarounds

| Vấn đề | Workaround |
|--------|------------|
| **Aging buckets (date range)** | Fetch all AR (take: 200) → client-side `daysDiff()` để phân bucket (đã implement) |
| **Tổng nợ theo KH** | Fetch all AR → `reduce()` group by CustomerId → sum Remaining |
| **AR quá hạn** | Fetch all, filter `DueDate < today && Status !== 'Đã thu'` |
| **Join AR + Order** | `Promise.all([getAccountsReceivable(), getOrders()])` → client-side join by OrderId |
| **Join AP + Supplier** | Fetch both → join by SupplierId |
| **Join AR + Payment History** | Fetch PaymentHistory with filter `{ ReferenceId: arId }` (equality OK) |
| **Tổng hợp dashboard** | Fetch all AR + all AP → client-side aggregate (sums, counts by status) |
| **Multi-currency totals** | Fetch exchange rates → convert all amounts to VND client-side |
| **Bù trừ: tìm AR+AP cùng KH** | Fetch all open AR + all open AP → filter by CustomerId client-side |

---

## 9. Queries Needed (Base Queries)

| Query | Mục đích | Ưu tiên |
|-------|----------|---------|
| `AR Aging Summary` | Tổng nợ theo aging bucket (pre-aggregated) | NICE-TO-HAVE — có thể client-side nếu < 200 records |
| `Customer Debt Summary` | Tổng nợ AR mỗi KH | NICE-TO-HAVE — client-side reduce OK |
| `AR+AP Monthly Trend` | Biến động nợ theo tháng (cho dashboard chart) | NICE-TO-HAVE |

> Hiện tại tất cả có thể client-side aggregation vì dự kiến < 200 records giai đoạn đầu. Nếu scale > 200, cần chuyển sang Base Queries.

---

## 10. Estimated Complexity

| Scope | Files | LOC Estimate |
|-------|-------|-------------|
| `lib/payment-history.ts` | 1 file mới | ~80 LOC |
| `lib/debt-offsets.ts` | 1 file mới | ~80 LOC |
| Sửa `lib/accounts-receivable.ts` (thêm fields) | 1 file sửa | +15 LOC |
| Sửa `lib/accounts-payable.ts` (thêm field) | 1 file sửa | +5 LOC |
| `app/accounts-receivable/[id]/page.tsx` | 1 file mới | ~450 LOC |
| `app/accounts-payable/[id]/page.tsx` | 1 file mới | ~350 LOC |
| Nâng cấp `app/accounts-receivable/page.tsx` | 1 file sửa | +120 LOC (~400 total) |
| Nâng cấp `app/accounts-payable/page.tsx` | 1 file sửa | +150 LOC (~320 total) |
| `app/debt-offset/page.tsx` (full rewrite) | 1 file rewrite | ~400 LOC |
| `app/cong-no/page.tsx` (dashboard) | 1 file mới | ~350 LOC |
| `app/cong-no/khach-hang/page.tsx` | 1 file mới | ~300 LOC |
| **Tổng** | **4 files mới + 1 rewrite + 4 files sửa** | **~2,300 LOC** |

---

## 11. Build Order (Thứ tự triển khai)

### Phase 1: Lib files + Schema updates (foundation)
**Mục tiêu:** Chuẩn bị data layer trước khi build UI

1. **Tạo `lib/payment-history.ts`** — Entity + CRUD
2. **Tạo `lib/debt-offsets.ts`** — Entity + CRUD
3. **Sửa `lib/accounts-receivable.ts`** — thêm Currency, ExchangeRate, DueDays, ExtendedDueDate
4. **Sửa `lib/accounts-payable.ts`** — thêm OrderCode
5. (Optional) Cleanup `lib/accountsreceivable.ts` — xóa file duplicate

### Phase 2: AR Detail page (ưu tiên cao nhất)
**File:** `app/accounts-receivable/[id]/page.tsx` (TẠO MỚI)

1. Header: ARCode + Status badge + action buttons
2. Info section: thông tin AR (OrderCode link, Customer, amounts, due date)
3. Payment history timeline (from PaymentHistory)
4. Thu tiền modal (nâng cấp từ list, ghi PaymentHistory)
5. Xóa nợ modal → tạo Approval request
6. Ân hạn modal → chọn ngày mới → tạo Approval request
7. Collection notes (text area, save on blur)

### Phase 3: AP Detail page
**File:** `app/accounts-payable/[id]/page.tsx` (TẠO MỚI)

1. Header: APCode + Status badge + action buttons
2. Info section: Supplier, amounts by currency, due date
3. Link tới Payment Voucher (nếu có)
4. Ghi nhận thanh toán modal → update PaidAmount, Remaining, Status
5. Button "Tạo phiếu chi" → redirect `/payment-vouchers/new?apId=xxx`

### Phase 4: Nâng cấp AR List
**File:** `app/accounts-receivable/page.tsx` (NÂNG CẤP)

1. Thêm search bar (tìm theo ARCode, OrderCode, CustomerName)
2. Thêm filter dropdowns (Sale, Status)
3. Row clickable → navigate to detail page
4. Overdue auto-check on load

### Phase 5: Nâng cấp AP List
**File:** `app/accounts-payable/page.tsx` (NÂNG CẤP)

1. Thêm search bar
2. Thêm aging cards (giống AR)
3. Thêm filter dropdowns (NCC, Currency, Status)
4. Row clickable → navigate to detail page
5. Button "Ghi nhận TT" inline trên row

### Phase 6: Bù trừ công nợ
**File:** `app/debt-offset/page.tsx` (REWRITE)

1. List bù trừ đã tạo (table + status tabs)
2. Button "Tạo bù trừ" → form:
   - Chọn khách hàng (autocomplete)
   - Hiển thị AR mở + AP mở của KH đó
   - Chọn AR record + AP record
   - Nhập số tiền bù trừ (≤ min of remaining)
   - Lý do
3. Submit → tạo DebtOffset (status: Nháp) → tạo Approval
4. Khi approval duyệt → update AR.Remaining + AP.Remaining + ghi PaymentHistory

### Phase 7: Dashboard Công nợ
**File:** `app/cong-no/page.tsx` (TẠO MỚI)

1. KPI cards row (4 cards):
   - Tổng phải thu (AR open)
   - Tổng phải trả (AP open)
   - Tổng quá hạn (AR overdue)
   - Số nợ xấu (AR > 60 ngày)
2. AR Aging bar chart (recharts)
3. Top 5 KH nợ nhiều nhất (table)
4. AP sắp đến hạn (table, next 7 days)
5. Bù trừ gần đây (table)

### Phase 8: Tổng hợp công nợ theo KH
**File:** `app/cong-no/khach-hang/page.tsx` (TẠO MỚI)

1. Bảng: KH | Tổng AR | Đã thu | Còn nợ | Quá hạn | Action
2. Search by customer name
3. Click row → filter AR list for that customer
4. Export potential (future)

---

## 12. Tóm tắt quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| Tạo `lib/payment-history.ts` riêng | AR chỉ có PaidAmount tổng, cần audit trail từng lần thu. Không thêm fields vào AR vì 1-to-many |
| Tạo `lib/debt-offsets.ts` riêng | Bù trừ là nghiệp vụ phức tạp, cần tracking riêng, có approval |
| Thêm fields vào AR/AP thay vì tạo entity mới | Chỉ thiếu vài fields (Currency, ExchangeRate), SDK auto-migrate |
| Dashboard `/cong-no` thay vì tab trong page khác | Công nợ là module riêng, cần view tổng hợp cả AR lẫn AP |
| Client-side aggregation thay vì Base Queries | Volume < 200 records giai đoạn đầu, đơn giản hơn. Migrate khi cần |
| Overdue auto-check on page load | Không có cron/scheduler trong App Builder, chỉ check khi user truy cập |
| Xóa nợ + ân hạn dùng Approval system hiện có | Đã có type "Ân hạn" trong `lib/approvals.ts`, chain: Sale → CFO → CEO |
| Không tạo form tạo AR/AP riêng | AR tạo tự động khi Order quyết toán (hoặc import), không cần manual create form |
| Giữ PaymentModal trên list (AR) | Quick action phổ biến, không cần vào detail chỉ để thu tiền |

---

## 13. Rủi ro & Lưu ý

| Rủi ro | Mitigation |
|--------|------------|
| **> 200 AR records** khi business scale | Migrate sang Base Queries cho aggregation, giữ CRUD bình thường |
| **Duplicate `lib/accountsreceivable.ts`** | Phase 1 cleanup, grep toàn bộ imports trước khi xóa |
| **Multi-currency aggregation sai** | Luôn quy đổi về VND bằng ExchangeRate trước khi sum |
| **Overdue check chỉ chạy khi user visit** | Acceptable cho MVP. Nếu cần real-time, dùng Base automation |
| **Bù trừ AR↔AP cần KH trùng** | Validate client-side: so khớp CustomerId giữa AR và AP |
