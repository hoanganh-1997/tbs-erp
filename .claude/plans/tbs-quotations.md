# Kế hoạch triển khai: Màn hình Báo giá (Quotations)

> Module: Báo giá — Stage ② trong 13-stage order lifecycle
> Ngày lập: 2026-04-08

---

## 1. Hiện trạng (Current State)

### Đã có:
| File | Trạng thái | Ghi chú |
|------|-----------|---------|
| `lib/quotations.ts` | ✅ Hoàn chỉnh | Entity + CRUD, 17 fields |
| `lib/quotation-items.ts` | ✅ Hoàn chỉnh | Line items + CRUD, 9 fields |
| `app/quotations/page.tsx` | ⚠️ Cơ bản | List + status tabs + search, thiếu KPI cards |
| `app/quotations/new/page.tsx` | ⚠️ Cơ bản | Form 6 sections, thiếu approval logic |
| `app/quotations/[id]/page.tsx` | ⚠️ Read-only | Chỉ xem, không edit/chuyển trạng thái |

### Thiếu (Gap Analysis):
| # | Feature | Mức độ | Lý do |
|---|---------|--------|-------|
| 1 | **Chỉnh sửa báo giá** | CRITICAL | Không thể sửa sau khi tạo |
| 2 | **Chuyển trạng thái** | CRITICAL | Không thể Gửi/Chốt/Từ chối từ UI |
| 3 | **Phê duyệt giảm giá** | HIGH | Discount >0% cần approval theo matrix |
| 4 | **Chuyển đổi BG → Đơn hàng** | HIGH | Flow chốt báo giá → tạo đơn hàng |
| 5 | **KPI cards trên list** | MEDIUM | Thiếu tổng quan nhanh (tổng BG, tỷ lệ chốt...) |
| 6 | **Tự động lấy tỷ giá** | MEDIUM | Tỷ giá hardcode 3500, nên pull từ ExchangeRates |
| 7 | **Nhân bản báo giá** | LOW | Tạo revision mới từ BG cũ |
| 8 | **Xóa báo giá** | LOW | Lib có delete nhưng UI không có |
| 9 | **Hết hạn tự động** | LOW | ValidUntil có nhưng không auto-expire |

---

## 2. Entities (Lib Files)

### 2.1 Đã có — Không cần tạo mới:
- `lib/quotations.ts` — 17 fields, đầy đủ CRUD
- `lib/quotation-items.ts` — 9 fields, đầy đủ CRUD

### 2.2 Cần sử dụng (cross-module imports):
| Lib file | Mục đích | Hàm sử dụng |
|----------|----------|-------------|
| `lib/customers.ts` | Autocomplete KH | `getCustomers()` |
| `lib/leads.ts` | Pre-fill từ lead | `getLeads()` |
| `lib/exchange-rates.ts` | Auto-fill tỷ giá hôm nay | `getExchangeRates()` |
| `lib/orders.ts` | Tạo đơn từ BG | `createOrder()` |
| `lib/order-items.ts` | Copy items sang đơn | `createOrderItem()` |
| `lib/approvals.ts` | Phê duyệt giảm giá | `createApproval()`, `getApprovals()` |

### 2.3 Schema hiện tại (Quotation):
```
QuotationCode (TEXT), LeadId (TEXT), CustomerId (TEXT), CustomerName (TEXT),
ServiceTypes (MULTIPLE_OPTIONS: VCT/MHH/UTXNK/LCLCN),
Status (SINGLE_OPTION: Nháp/Đã gửi/Đã chốt/Từ chối/Hết hạn),
IsFinal (CHECKBOX), TotalCNY (NUMBER), ServiceFeeVND (NUMBER),
ShippingFeeVND (NUMBER), TotalVND (NUMBER), ExchangeRate (NUMBER),
DiscountPercent (NUMBER), DiscountAmount (NUMBER), ValidUntil (DATE),
SaleOwner (TEXT), Branch (SINGLE_OPTION: HN/HCM), Notes (TEXT)
```

---

## 3. Pages — Route Structure

### 3.1 Đã có — Cần nâng cấp:

| Route | File | Thay đổi |
|-------|------|----------|
| `/quotations` | `app/quotations/page.tsx` | + KPI cards, + quick actions (gửi, chốt, xóa) |
| `/quotations/new` | `app/quotations/new/page.tsx` | + Auto tỷ giá, + discount approval warning, + SaleOwner field |
| `/quotations/[id]` | `app/quotations/[id]/page.tsx` | + Status actions, + Edit mode, + Chuyển đổi → Đơn hàng, + Approval status |

### 3.2 Không cần tạo page mới
Tất cả chức năng mới sẽ được tích hợp vào 3 pages hiện có (inline edit, modals, action buttons).

---

## 4. Components

### 4.1 Đã có (tái sử dụng):
- `components/page-header.tsx` — Header + action buttons
- `components/status-badge.tsx` — Status badges
- `components/empty-state.tsx` — Empty state

### 4.2 Cần tạo mới:

| Component | File | Mô tả |
|-----------|------|-------|
| `QuotationKpiCards` | Inline trong `page.tsx` | 4 KPI cards: Tổng BG / Đang chờ / Đã chốt / Tỷ lệ chốt |
| `StatusActionBar` | Inline trong `[id]/page.tsx` | Thanh action theo trạng thái (Gửi KH / Chốt / Từ chối) |
| `DiscountApprovalBanner` | Inline trong `[id]/page.tsx` | Banner cảnh báo cần phê duyệt giảm giá |
| `ConvertToOrderModal` | Inline trong `[id]/page.tsx` | Modal xác nhận chuyển BG → Đơn hàng |

> Tất cả components sẽ được định nghĩa top-level trong file page, không nested.

---

## 5. Business Rules

### 5.1 Status Machine (Quotation):
```
Nháp → Đã gửi → Đã chốt → (tạo Order)
  ↓         ↓
  Hết hạn   Từ chối
```

**Transitions cho phép:**
| Từ | Đến | Điều kiện | Action |
|----|-----|-----------|--------|
| Nháp | Đã gửi | Có ít nhất 1 item, có KH | Button "Gửi khách hàng" |
| Đã gửi | Đã chốt | Discount approved (nếu >0%) | Button "Chốt báo giá" |
| Đã gửi | Từ chối | — | Button "KH từ chối" |
| Nháp | Hết hạn | ValidUntil < today (auto) | Client-side check on load |
| Đã gửi | Hết hạn | ValidUntil < today (auto) | Client-side check on load |

### 5.2 Discount Approval Matrix:
```
0%      → Không cần duyệt
≤3%     → Leader + KT TT co-approve (SLA 2h each)
3-5%    → Leader + KT TT → GĐ KD (SLA 4h)
>5%     → Leader + KT TT → GĐ KD → BGĐ (SLA 4-8h)
>100M   → Luôn cần BGĐ duyệt (bất kể % giảm)
```

**Implementation:**
- Khi tạo/sửa BG với discount > 0%: hiển thị warning banner
- Khi "Gửi khách hàng": tự động tạo Approval record nếu discount > 0%
- Khi "Chốt báo giá": kiểm tra approval đã được duyệt (nếu có discount)

### 5.3 Quotation → Order Conversion:
Khi click "Chốt & Tạo đơn hàng":
1. Update quotation status → "Đã chốt"
2. Create Order với data map:
   - `OrderCode` = generateCode("DH")
   - `QuotationId` = quotation.id
   - `CustomerId`, `CustomerName`, `ServiceTypes` copy từ BG
   - `ExchangeRate`, `TotalCNY`, `TotalVND` copy từ BG
   - `Status` = "Nháp"
3. Copy QuotationItems → OrderItems
4. Redirect to `/orders/{newOrderId}`

### 5.4 Calculations:
```
TotalCNY = SUM(items.Quantity × items.UnitPriceCNY)
GoodsVND = TotalCNY × ExchangeRate
SubTotal = GoodsVND + ServiceFeeVND + ShippingFeeVND
DiscountAmount = ROUND(SubTotal × DiscountPercent / 100)
TotalVND = SubTotal - DiscountAmount
```

### 5.5 Validations:
**Tạo/Sửa:**
- CustomerName: required
- ServiceTypes: ít nhất 1
- Items: ít nhất 1 item với ProductName
- ExchangeRate: > 0
- DiscountPercent: 0-100

**Gửi khách hàng:**
- Tất cả validation trên +
- Có ít nhất 1 item có giá > 0
- ValidUntil >= today (nếu có)

---

## 6. Approval Flows

### Discount Approval (khi DiscountPercent > 0):

```
Sale tạo BG với discount
  → Hệ thống tạo Approval record:
    Type: "Giảm giá"
    ReferenceType: "quotation"  
    ReferenceId: quotation.id
    ReferenceCode: quotation.QuotationCode
    Amount: DiscountAmount
    ApprovalChain: (xác định theo matrix)
    Status: "Chờ duyệt"
  → BG detail page hiển thị banner "Chờ phê duyệt giảm giá"
  → Khi Approval "Đã duyệt" → cho phép "Chốt báo giá"
  → Khi Approval "Từ chối" → BG vẫn ở trạng thái cũ, hiện lý do từ chối
```

---

## 7. Cross-Module Dependencies

```
                    ┌─── lib/customers.ts (autocomplete)
                    ├─── lib/leads.ts (pre-fill from lead)
lib/quotations.ts ──┤─── lib/exchange-rates.ts (auto tỷ giá)
                    ├─── lib/approvals.ts (discount approval)
                    └─── lib/orders.ts + lib/order-items.ts (convert BG → Order)

lib/quotation-items.ts ─── lib/order-items.ts (copy items to order)
```

**Ngược lại (modules phụ thuộc vào Quotation):**
- `app/customers/[id]/page.tsx` — tab "Báo giá" hiển thị list BG của KH
- `app/leads/[id]/page.tsx` — button "Tạo báo giá" link tới `/quotations/new?leadId=`

---

## 8. SDK Workarounds

| Vấn đề | Workaround |
|--------|------------|
| **Lọc items theo QuotationId** | `getQuotationItems({ take: 200 })` → filter client-side `item.QuotationId === id` |
| **Lấy tỷ giá hôm nay** | `getExchangeRates({ take: 200, sortField: "createdAt", sortDirection: "desc" })` → find first CNY record |
| **Kiểm tra approval status** | `getApprovals({ take: 200 })` → filter `a.ReferenceId === quotationId && a.ReferenceType === "quotation"` |
| **KPI aggregation** | Fetch all 200 quotations → client-side reduce for counts/sums |
| **Auto-expire** | On page load: filter quotations with `ValidUntil < today` and status "Nháp"/"Đã gửi" → batch update to "Hết hạn" |

---

## 9. Queries Needed

Không cần Base Queries bổ sung. Tất cả aggregation sẽ thực hiện client-side vì volume < 200 records.

---

## 10. Estimated Complexity

| Scope | Files | LOC Estimate |
|-------|-------|-------------|
| Nâng cấp `quotations/page.tsx` | 1 | ~350 LOC (+100 so với hiện tại ~280) |
| Nâng cấp `quotations/new/page.tsx` | 1 | ~650 LOC (+50 so với hiện tại ~600) |
| Nâng cấp `quotations/[id]/page.tsx` | 1 | ~500 LOC (+350 so với hiện tại ~150) |
| **Tổng** | **3 files sửa** | **~1500 LOC** |

> Không cần tạo file mới. Toàn bộ là nâng cấp 3 files hiện có.

---

## 11. Build Order (Thứ tự triển khai)

### Phase 1: Detail Page + Status Actions (ưu tiên cao nhất)
**File:** `app/quotations/[id]/page.tsx`
1. Thêm status action bar (Gửi KH / Chốt / Từ chối)
2. Thêm inline edit mode (toggle edit/view)
3. Thêm chức năng cập nhật line items
4. Thêm logic auto-expire (check ValidUntil on load)

### Phase 2: Discount Approval Integration
**File:** `app/quotations/[id]/page.tsx`
1. Thêm discount approval banner
2. Tạo Approval record khi gửi BG có discount
3. Kiểm tra approval status trước khi cho chốt
4. Hiển thị approval chain progress

### Phase 3: Convert to Order
**File:** `app/quotations/[id]/page.tsx`
1. Thêm "Chốt & Tạo đơn hàng" button
2. Modal xác nhận conversion
3. Logic copy data BG → Order + OrderItems
4. Redirect to new order detail

### Phase 4: List Page Improvements
**File:** `app/quotations/page.tsx`
1. Thêm KPI cards (Tổng BG / Chờ gửi / Đã chốt / Tỷ lệ chốt)
2. Thêm quick actions trên table rows (Gửi, Xóa)
3. Cải thiện responsive + UX

### Phase 5: Create Form Improvements
**File:** `app/quotations/new/page.tsx`
1. Auto-fill tỷ giá từ ExchangeRates
2. Thêm SaleOwner field
3. Thêm discount approval warning
4. Thêm fields: SKU, ProductLink, Attributes cho line items

---

## 12. Tóm tắt quyết định thiết kế

| Quyết định | Lý do |
|-----------|-------|
| Không tạo page `/quotations/[id]/edit` riêng | Dùng inline edit mode trong detail page để giảm file bloat |
| Components inline (không tạo file riêng) | Chỉ dùng trong 1 page, tránh over-abstraction |
| Auto-expire client-side | SDK không hỗ trợ scheduled jobs; check on page load là đủ |
| Approval record tách biệt | Dùng `lib/approvals.ts` đã có, link qua ReferenceId |
| Conversion copy data (không reference) | Order cần snapshot giá tại thời điểm chốt, không thay đổi theo BG |
