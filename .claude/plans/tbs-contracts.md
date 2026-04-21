# Kế hoạch triển khai: Module Hợp đồng (Contracts)

> Module: Hợp đồng — Stage liên kết với Đơn hàng trong order lifecycle
> Ngày lập: 2026-04-08

---

## 1. Hiện trạng (Current State)

### Đã có:
| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `lib/contracts.ts` | ✅ Hoàn chỉnh | Entity + CRUD, 14 fields |
| `app/contracts/page.tsx` | ⚠️ Cơ bản | List + status tabs + search + pagination, thiếu KPI cards, quick actions |
| `app/contracts/[id]/page.tsx` | ⚠️ Read-only | Chỉ xem, không edit/chuyển trạng thái |
| `app/contracts/new/page.tsx` | ❌ Chưa có | Không thể tạo hợp đồng từ UI |

### Thiếu (Gap Analysis):
| # | Feature | Mức độ | Lý do |
|---|---------|--------|-------|
| 1 | **Tạo hợp đồng** | CRITICAL | Không thể tạo HĐ từ UI, chỉ có lib CRUD |
| 2 | **Chỉnh sửa hợp đồng** | CRITICAL | Detail page chỉ read-only |
| 3 | **Chuyển trạng thái** | CRITICAL | Không thể Gửi ký / Ký / Kích hoạt / Hoàn thành / Hủy |
| 4 | **KPI cards trên list** | MEDIUM | Thiếu tổng quan (tổng HĐ, giá trị, đang hiệu lực...) |
| 5 | **Quick actions trên list** | MEDIUM | Không có hành động nhanh trên row |
| 6 | **Tạo HĐ từ Đơn hàng** | HIGH | Khi đơn hàng xác nhận → tạo HĐ, copy data |
| 7 | **Gia hạn / Nhân bản HĐ** | LOW | Tạo HĐ mới từ HĐ cũ với thời hạn mới |
| 8 | **Xóa hợp đồng** | LOW | Lib có delete nhưng UI không có |
| 9 | **Liên kết ngược Order → Contract** | LOW | Order hiện không có ContractId để hiển thị HĐ liên quan |

---

## 2. Entities (Lib Files)

### 2.1 Đã có — Không cần tạo mới:
- `lib/contracts.ts` — 14 fields, đầy đủ CRUD

### 2.2 Schema hiện tại (Contract):
```
ContractCode (TEXT), OrderId (TEXT), OrderCode (TEXT),
CustomerId (TEXT), CustomerName (TEXT), Title (TEXT),
ContractValue (NUMBER), Currency (SINGLE_OPTION: VND/CNY/USD),
SignDate (DATE), StartDate (DATE), EndDate (DATE),
Status (SINGLE_OPTION: Nháp/Chờ ký/Đã ký/Đang thực hiện/Hoàn thành/Đã hủy),
SaleOwner (TEXT), Notes (TEXT)
```

### 2.3 Cần sử dụng (cross-module imports):
| Lib file | Mục đích | Hàm sử dụng |
|----------|----------|-------------|
| `lib/customers.ts` | Autocomplete KH | `getCustomers()` |
| `lib/orders.ts` | Liên kết đơn hàng | `getOrders()`, `getOrder()` |
| `lib/quotations.ts` | Tham chiếu báo giá gốc (thông qua Order.QuotationId) | `getQuotation()` |

---

## 3. Pages — Route Structure

### 3.1 Đã có — Cần nâng cấp:

| Route | File | Thay đổi |
|-------|------|----------|
| `/contracts` | `app/contracts/page.tsx` | + KPI cards, + quick actions (gửi ký, xóa), + cải thiện UX |
| `/contracts/[id]` | `app/contracts/[id]/page.tsx` | + Status actions, + Edit mode, + Liên kết Order, + Gia hạn |

### 3.2 Cần tạo mới:

| Route | File | Mô tả |
|-------|------|-------|
| `/contracts/new` | `app/contracts/new/page.tsx` | Form tạo hợp đồng mới |

---

## 4. Components

### 4.1 Đã có (tái sử dụng):
- `components/page-header.tsx` — Header + action buttons
- `components/status-badge.tsx` — Status badges
- `components/empty-state.tsx` — Empty state

### 4.2 Cần tạo mới (inline):

| Component | File | Mô tả |
|-----------|------|-------|
| `ContractKpiCards` | Inline trong `page.tsx` | 4 KPI: Tổng HĐ / Đang hiệu lực / Sắp hết hạn / Tổng giá trị |
| `StatusActionBar` | Inline trong `[id]/page.tsx` | Thanh action theo trạng thái (Gửi ký / Ký / Kích hoạt / Hoàn thành / Hủy) |
| `ContractEditForm` | Inline trong `[id]/page.tsx` | Form chỉnh sửa inline (toggle edit/view) |

> Tất cả components sẽ được định nghĩa top-level trong file page, không nested.

---

## 5. Business Rules

### 5.1 Status Machine (Contract):
```
Nháp → Chờ ký → Đã ký → Đang thực hiện → Hoàn thành
  ↓       ↓                     ↓
Đã hủy  Đã hủy              Đã hủy
```

**Transitions cho phép:**
| Từ | Đến | Điều kiện | Action |
|----|-----|-----------|--------|
| Nháp | Chờ ký | Có CustomerName, ContractValue > 0, có Title | Button "Gửi ký" |
| Nháp | Đã hủy | — | Button "Hủy hợp đồng" |
| Chờ ký | Đã ký | — | Button "Xác nhận đã ký" (auto-fill SignDate = today nếu trống) |
| Chờ ký | Đã hủy | — | Button "Hủy hợp đồng" |
| Đã ký | Đang thực hiện | StartDate <= today (hoặc manual) | Button "Kích hoạt" |
| Đang thực hiện | Hoàn thành | EndDate <= today (hoặc manual) | Button "Hoàn thành" |
| Đang thực hiện | Đã hủy | — | Button "Hủy hợp đồng" (cần confirm) |

### 5.2 Auto-checks on page load:
- Nếu Status = "Đang thực hiện" và EndDate < today → hiển thị warning "Hợp đồng đã quá hạn"
- Nếu Status = "Đã ký" và StartDate <= today → hiển thị suggestion "Hợp đồng sẵn sàng kích hoạt"

### 5.3 Validations:

**Tạo hợp đồng:**
- Title: required
- CustomerName: required (autocomplete từ customers)
- ContractValue: required, > 0
- Currency: required (mặc định VND)
- StartDate, EndDate: optional nhưng nếu có EndDate thì EndDate >= StartDate
- SaleOwner: optional

**Gửi ký (Nháp → Chờ ký):**
- Tất cả validation trên +
- ContractValue > 0
- Có Title

**Xác nhận đã ký:**
- Auto-fill SignDate = today nếu chưa có

### 5.4 Tạo HĐ từ Đơn hàng (pre-fill):
Khi truy cập `/contracts/new?orderId=xxx`:
1. Load order data
2. Pre-fill: CustomerName, CustomerId, OrderId, OrderCode, Currency (VND)
3. ContractValue = Order.TotalVND
4. Title = `Hợp đồng dịch vụ - ${OrderCode}`
5. SaleOwner = Order.SaleOwner

### 5.5 Gia hạn hợp đồng:
Khi click "Gia hạn" trên HĐ Hoàn thành/Đang thực hiện:
1. Tạo HĐ mới với data copy từ HĐ cũ
2. ContractCode mới (auto-generate)
3. StartDate = EndDate cũ + 1 ngày
4. EndDate = trống (để user điền)
5. Status = "Nháp"
6. Redirect to `/contracts/{newId}`

---

## 6. Cross-Module Dependencies

```
                    ┌─── lib/customers.ts (autocomplete KH)
lib/contracts.ts ───┤─── lib/orders.ts (liên kết đơn hàng, pre-fill)
                    └─── lib/quotations.ts (tham chiếu BG gốc qua Order)
```

**Ngược lại (modules phụ thuộc vào Contract):**
- `app/orders/[id]/page.tsx` — có thể hiển thị link "Xem hợp đồng" nếu có Contract liên kết
- `app/customers/[id]/page.tsx` — tab "Hợp đồng" hiển thị list HĐ của KH

---

## 7. SDK Workarounds

| Vấn đề | Workaround |
|--------|------------|
| **Lọc HĐ theo OrderId** | `getContracts({ take: 200 })` → filter client-side `c.OrderId === orderId` |
| **Lọc HĐ theo CustomerId** | `getContracts({ take: 200 })` → filter client-side `c.CustomerId === customerId` |
| **KPI aggregation** | Fetch all contracts (max 200) → client-side reduce for counts/sums |
| **Sắp hết hạn** | Filter client-side: `EndDate` within 30 days from today |
| **Liên kết Order** | Fetch order by OrderId để hiển thị thông tin đơn hàng trên detail |
| **Customer autocomplete** | `getCustomers({ take: 200 })` → client-side search by name |

---

## 8. Queries Needed

Không cần Base Queries bổ sung. Tất cả aggregation sẽ thực hiện client-side vì volume < 200 records.

---

## 9. Estimated Complexity

| Scope | Files | LOC Estimate |
|-------|-------|-------------|
| Tạo `contracts/new/page.tsx` | 1 file mới | ~300 LOC |
| Nâng cấp `contracts/page.tsx` | 1 file sửa | ~350 LOC (+100 so với hiện tại) |
| Nâng cấp `contracts/[id]/page.tsx` | 1 file sửa | ~500 LOC (+370 so với hiện tại ~135) |
| **Tổng** | **1 file mới + 2 files sửa** | **~1150 LOC** |

---

## 10. Build Order (Thứ tự triển khai)

### Phase 1: Create Form (ưu tiên cao nhất)
**File:** `app/contracts/new/page.tsx` (TẠO MỚI)
1. Form tạo hợp đồng với các fields: Title, Customer (autocomplete), ContractValue, Currency, StartDate, EndDate, SaleOwner, Notes
2. Auto-generate ContractCode
3. Liên kết Order (optional, pre-fill từ ?orderId= query param)
4. Validation với Zod
5. Redirect to detail page sau khi tạo

### Phase 2: Detail Page + Status Actions + Edit Mode
**File:** `app/contracts/[id]/page.tsx` (NÂNG CẤP)
1. Thêm status action bar (Gửi ký / Xác nhận ký / Kích hoạt / Hoàn thành / Hủy)
2. Thêm inline edit mode (toggle edit/view)
3. Thêm auto-checks: quá hạn warning, sẵn sàng kích hoạt suggestion
4. Thêm button "Gia hạn" cho HĐ Hoàn thành/Đang thực hiện
5. Hiển thị thông tin Order liên kết (nếu có)

### Phase 3: List Page Improvements
**File:** `app/contracts/page.tsx` (NÂNG CẤP)
1. Thêm KPI cards (Tổng HĐ / Đang hiệu lực / Sắp hết hạn / Tổng giá trị)
2. Thêm quick actions trên table rows (Gửi ký, Xóa nháp)
3. Cải thiện responsive + UX

---

## 11. Tóm tắt quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| Không tạo `/contracts/[id]/edit` riêng | Dùng inline edit mode trong detail page, giống pattern quotation |
| Không cần Approval flow | HĐ chỉ cần confirm ký, không cần multi-level approval (khác discount) |
| Components inline | Chỉ dùng trong 1 page, tránh over-abstraction |
| Gia hạn = tạo HĐ mới (không extend HĐ cũ) | Giữ lịch sử rõ ràng, mỗi HĐ có thời hạn riêng |
| Pre-fill từ Order qua query param | Đơn giản, không cần modal phức tạp |
| Không thêm ContractId vào Orders | Duy trì 1-way relationship (Contract → Order), tránh migration |
