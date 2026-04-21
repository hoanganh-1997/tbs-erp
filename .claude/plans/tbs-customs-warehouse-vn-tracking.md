# Plan: Thông quan, Kho Việt Nam & Theo dõi

> Created: 2026-04-09
> Modules: Customs Clearance, Vietnam Warehouse (enhanced), Tracking (enhanced)

---

## 0. Current State Analysis

### Customs (`app/customs/page.tsx`)
- **Implemented**: Basic list filtering orders by customs statuses, 2 action buttons (Bắt đầu TQ / Hoàn thành TQ)
- **Gaps**: No dedicated entity, no declaration form, no document management, no fees/taxes, no HS codes, no detail page, no KPIs

### Warehouse VN (`app/warehouse-vn/`)
- **Implemented**: Receipt list + create form (from container) + detail page with status flow
- **Gaps**: No inventory overview, no shelf management, no outbound/pick-pack, no discrepancy resolution, no batch ops, no dashboard KPIs

### Tracking (`app/tracking/page.tsx`)
- **Implemented**: Search by OrderCode/TrackingCN, timeline view, container search
- **Gaps**: No granular event log entity, no customer-facing search by phone, no batch tracking, no ETA calculation, no tracking dashboard

---

## 1. New Entities

### 1.1 `lib/customs-declarations.ts` (NEW)

Tờ khai hải quan — one per container (UTXNK/LCLCN containers only).

```typescript
const TABLE_ID_PROMISE = createTable('CustomsDeclarations', [
  { name: 'DeclarationCode', type: 'TEXT' },           // TK-YYMMDD-SEQ
  { name: 'ContainerId', type: 'TEXT' },                // FK → Containers
  { name: 'ContainerCode', type: 'TEXT' },              // Denormalized
  { name: 'DeclarationType', type: 'SINGLE_OPTION', options: [
    { name: 'Chính ngạch (UTXNK)' },
    { name: 'LCL chính ngạch' },
  ]},
  { name: 'CustomsOffice', type: 'SINGLE_OPTION', options: [
    { name: 'Lạng Sơn' }, { name: 'Lào Cai' }, { name: 'Móng Cái' },
    { name: 'Hải Phòng' }, { name: 'Cát Lái' }, { name: 'Khác' },
  ]},
  { name: 'DeclarationNumber', type: 'TEXT' },          // Số tờ khai HQ chính thức
  { name: 'RegisterDate', type: 'DATE' },               // Ngày đăng ký TK
  { name: 'ClearanceDate', type: 'DATE' },              // Ngày thông quan
  { name: 'TotalOrdersCount', type: 'NUMBER' },         // Số đơn hàng trong TK
  { name: 'TotalCBM', type: 'NUMBER' },
  { name: 'TotalWeightKg', type: 'NUMBER' },
  { name: 'TotalValueCNY', type: 'NUMBER' },            // Tổng giá trị hàng
  { name: 'ImportTaxVND', type: 'NUMBER' },              // Thuế nhập khẩu
  { name: 'VATAmount', type: 'NUMBER' },                 // Thuế GTGT
  { name: 'SpecialTaxVND', type: 'NUMBER' },             // Thuế TTĐB (nếu có)
  { name: 'CustomsFeesVND', type: 'NUMBER' },            // Phí hải quan
  { name: 'TotalTaxVND', type: 'NUMBER' },               // Tổng thuế = NK + VAT + TTĐB + Phí
  { name: 'HSCodes', type: 'TEXT' },                     // Comma-separated HS codes
  { name: 'DocumentStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Thiếu chứng từ' }, { name: 'Đủ chứng từ' }, { name: 'Đã nộp HQ' },
  ]},
  { name: 'HasCO', type: 'CHECKBOX' },                   // Certificate of Origin
  { name: 'HasInvoice', type: 'CHECKBOX' },               // Commercial Invoice
  { name: 'HasPackingList', type: 'CHECKBOX' },
  { name: 'HasBillOfLading', type: 'CHECKBOX' },
  { name: 'HasInsurance', type: 'CHECKBOX' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chuẩn bị hồ sơ' },      // Preparing docs
    { name: 'Đã nộp tờ khai' },       // Submitted
    { name: 'Chờ kiểm hóa' },         // Pending inspection
    { name: 'Đang kiểm hóa' },        // Under inspection
    { name: 'Chờ nộp thuế' },         // Pending tax payment
    { name: 'Đã nộp thuế' },          // Tax paid
    { name: 'Đã thông quan' },        // Cleared
    { name: 'Bị giữ hàng' },          // Seized/held
  ]},
  { name: 'InspectionType', type: 'SINGLE_OPTION', options: [
    { name: 'Luồng xanh' },   // Green channel — auto pass
    { name: 'Luồng vàng' },   // Yellow — doc check
    { name: 'Luồng đỏ' },     // Red — physical inspection
  ]},
  { name: 'InspectionNotes', type: 'TEXT' },
  { name: 'BrokerId', type: 'TEXT' },                     // FK → Suppliers (category: Thông quan)
  { name: 'BrokerName', type: 'TEXT' },
  { name: 'XNKStaff', type: 'TEXT' },                     // Phòng XNK person assigned
  { name: 'Notes', type: 'TEXT' },
]);
```

**CRUD**: `getCustomsDeclarations`, `getCustomsDeclaration`, `createCustomsDeclaration`, `updateCustomsDeclaration`, `deleteCustomsDeclaration`

---

### 1.2 `lib/customs-declaration-items.ts` (NEW)

Chi tiết hàng hóa trong tờ khai — links declaration → orders.

```typescript
const TABLE_ID_PROMISE = createTable('CustomsDeclarationItems', [
  { name: 'DeclarationId', type: 'TEXT' },               // FK → CustomsDeclarations
  { name: 'OrderId', type: 'TEXT' },                      // FK → Orders
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'ProductDescription', type: 'TEXT' },           // Mô tả hàng hóa
  { name: 'HSCode', type: 'TEXT' },
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'ValueCNY', type: 'NUMBER' },
  { name: 'ImportTaxRate', type: 'NUMBER' },              // % thuế NK
  { name: 'ImportTaxVND', type: 'NUMBER' },
  { name: 'VATRate', type: 'NUMBER' },                    // % VAT
  { name: 'VATAmount', type: 'NUMBER' },
]);
```

**CRUD**: `getCustomsDeclarationItems`, `createCustomsDeclarationItem`, `updateCustomsDeclarationItem`, `deleteCustomsDeclarationItem`

---

### 1.3 `lib/tracking-events.ts` (NEW)

Granular event log for order/container tracking — read-mostly, append-only.

```typescript
const TABLE_ID_PROMISE = createTable('TrackingEvents', [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'ContainerCode', type: 'TEXT' },
  { name: 'EventType', type: 'SINGLE_OPTION', options: [
    { name: 'Tạo đơn' },
    { name: 'Đã báo giá' },
    { name: 'Đã cọc' },
    { name: 'Đã mua hàng' },
    { name: 'Nhập kho TQ' },
    { name: 'Đóng container' },
    { name: 'Xuất kho TQ' },
    { name: 'Đang vận chuyển' },
    { name: 'Tại biên giới' },
    { name: 'Đã nộp tờ khai' },
    { name: 'Đang kiểm hóa' },
    { name: 'Đã thông quan' },
    { name: 'Về kho VN' },
    { name: 'Đã kiểm hàng' },
    { name: 'Lên kệ' },
    { name: 'Đang giao' },
    { name: 'Đã giao' },
    { name: 'Hoàn thành' },
    { name: 'Sự cố' },
    { name: 'Ghi chú' },
  ]},
  { name: 'Description', type: 'TEXT' },          // Chi tiết sự kiện
  { name: 'Location', type: 'TEXT' },              // Vị trí (kho, cửa khẩu, etc.)
  { name: 'Actor', type: 'TEXT' },                 // Người thực hiện
  { name: 'Metadata', type: 'TEXT' },              // JSON string for extra data
]);
```

**CRUD**: `getTrackingEvents`, `createTrackingEvent` (primary — append-only pattern)

---

### 1.4 `lib/warehouse-vn-receipts.ts` (ENHANCED)

Add fields to existing entity:

```typescript
// New fields to add:
{ name: 'QCStatus', type: 'SINGLE_OPTION', options: [
  { name: 'Chưa kiểm' }, { name: 'Đạt' }, { name: 'Lỗi' }, { name: 'Chờ xử lý' },
]},
{ name: 'QCNotes', type: 'TEXT' },
{ name: 'ShelfZone', type: 'SINGLE_OPTION', options: [
  { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'VIP' }, { name: 'Tạm giữ' },
]},
{ name: 'ShelfRow', type: 'TEXT' },               // e.g. "A-03-2" (Zone-Row-Level)
{ name: 'PickedAt', type: 'DATE' },
{ name: 'PickedBy', type: 'TEXT' },
{ name: 'DeliveryOrderId', type: 'TEXT' },        // FK → DeliveryOrders
{ name: 'DiscrepancyResolved', type: 'CHECKBOX' },
{ name: 'DiscrepancyNote', type: 'TEXT' },
```

> **Migration note**: Since SDK `createTable` is idempotent (creates if not exists), add fields directly to the field list. Existing records will have `null` for new fields.

---

## 2. Pages

### 2.1 Customs Module — Enhanced

| Route | Type | Description |
|-------|------|-------------|
| `app/customs/page.tsx` | **REWRITE** | Dashboard + list of CustomsDeclarations with KPIs |
| `app/customs/new/page.tsx` | **NEW** | Create customs declaration form (from container) |
| `app/customs/[id]/page.tsx` | **NEW** | Declaration detail — documents, items, tax calc, status flow |

#### `app/customs/page.tsx` — Dashboard + List
- **4 KPI cards**: Đang xử lý, Chờ kiểm hóa, Tổng thuế tháng này, Tỷ lệ luồng xanh
- **Status tabs**: Chuẩn bị hồ sơ | Đã nộp TK | Chờ kiểm hóa | Đang kiểm hóa | Chờ nộp thuế | Đã thông quan | Bị giữ
- **Table columns**: Mã TK, Container, Loại, Cửa khẩu, Số đơn, Tổng thuế, Kênh (xanh/vàng/đỏ), NV XNK, Trạng thái, Thao tác
- **Create button**: → `/customs/new`
- **Quick actions per row**: View detail, Advance status

#### `app/customs/new/page.tsx` — Create Declaration
- **Step 1**: Select container (filter: status = "Tại biên giới" or "Hải quan", service includes UTXNK/LCLCN)
- **Step 2**: Select customs office, broker, XNK staff
- **Step 3**: Auto-populate order items from ContainerItems → show table with HS code, quantity, value
- **Step 4**: Document checklist (C/O, Invoice, Packing List, B/L, Insurance)
- **Step 5**: Tax estimation (import tax + VAT + fees)
- **Step 6**: Review & submit

#### `app/customs/[id]/page.tsx` — Declaration Detail
- **Header**: Declaration code, container link, status badge, inspection channel badge
- **Status flow bar**: 8 steps with advancement button
- **Tab: Tổng quan**: Key info + document checklist with checkboxes
- **Tab: Hàng hóa**: List of CustomsDeclarationItems with HS codes, values, tax rates
- **Tab: Thuế & Phí**: Tax breakdown table + total + link to payment voucher
- **Tab: Lịch sử**: TrackingEvents filtered by this container's customs stages

---

### 2.2 Warehouse VN — Enhanced

| Route | Type | Description |
|-------|------|-------------|
| `app/warehouse-vn/page.tsx` | **ENHANCE** | Add KPI cards, shelf filter, batch actions |
| `app/warehouse-vn/new/page.tsx` | Keep | Already good |
| `app/warehouse-vn/[id]/page.tsx` | **ENHANCE** | Add QC section, shelf assignment, pick/release flow |
| `app/warehouse-vn/inventory/page.tsx` | **NEW** | Inventory overview — stock by shelf, search, occupancy |
| `app/warehouse-vn/outbound/page.tsx` | **NEW** | Outbound management — pick list, ready for delivery |

#### `app/warehouse-vn/page.tsx` — Enhanced List
- **Add 4 KPI cards**: Tổng kiện trên kệ, Chờ giao, Chênh lệch chưa xử lý, Nhận hôm nay
- **Add batch actions**: Select multiple → batch update status
- **Add shelf zone quick filter chips**: A | B | C | D | VIP | Tạm giữ

#### `app/warehouse-vn/[id]/page.tsx` — Enhanced Detail
- **Add QC section**: QCStatus dropdown + QCNotes
- **Add shelf assignment**: ShelfZone dropdown + ShelfRow input → auto-generate location code
- **Add pick/release flow**: Button "Bắt đầu pick" → "Đã đóng gói" → "Chờ giao"
- **Add discrepancy resolution**: If discrepancy ≠ 0, show resolution form

#### `app/warehouse-vn/inventory/page.tsx` — Inventory View
- **Visual grid**: Shelf zones as cards, each showing: occupied/total slots, occupancy %
- **Table**: All receipts with Status = "Trên kệ", grouped by ShelfZone
- **Search**: By order code, receipt code, or shelf location
- **Aging indicator**: Items on shelf > 7 days highlighted yellow, > 14 days red

#### `app/warehouse-vn/outbound/page.tsx` — Outbound Management
- **Source**: Receipts with Status = "Đang pick" or "Đã đóng gói" or "Chờ giao"
- **Group by DeliveryOrderId**: Show which delivery order each receipt belongs to
- **Actions**: Mark packed, assign to delivery order, generate pick list
- **Integration**: Link to `/delivery-orders/[id]` for dispatch

---

### 2.3 Tracking — Enhanced

| Route | Type | Description |
|-------|------|-------------|
| `app/tracking/page.tsx` | **ENHANCE** | Add phone search, multi-order, ETA display |
| `app/tracking/events/page.tsx` | **NEW** | Internal tracking events dashboard (admin view) |

#### `app/tracking/page.tsx` — Enhanced Public Tracking
- **Add search mode**: "Theo số điện thoại" — find all orders for a customer by phone
- **Multi-order results**: When searching by phone, show list of all orders with mini timeline each
- **ETA calculation**: Show "Dự kiến giao: DD/MM/YYYY" based on container ETA + 2-3 days processing
- **Current location highlight**: Emphasize the current step in timeline with a pulsing indicator
- **Progress percentage**: "Đã hoàn thành 5/8 bước (62%)"

#### `app/tracking/events/page.tsx` — Admin Event Dashboard
- **Table**: All TrackingEvents sorted by date desc
- **Filters**: By EventType, by date range (client-side), by order/container
- **Stats**: Events created today, events by type (bar chart)
- **Quick create**: Manual event entry for exceptions

---

## 3. Reusable Components

### 3.1 `components/customs-status-flow.tsx` (NEW)
- Horizontal step indicator for 8 customs statuses
- Current step highlighted, completed steps checked
- Reused in customs list and detail pages

### 3.2 `components/document-checklist.tsx` (NEW)
- Checklist card with toggleable checkboxes: C/O, Invoice, Packing List, B/L, Insurance
- Shows count: "3/5 chứng từ"
- Red warning if DocumentStatus = "Thiếu chứng từ"

### 3.3 `components/tax-breakdown.tsx` (NEW)
- Table showing: Import tax, VAT, Special tax, Customs fees, Total
- Editable inputs for rates, auto-calculate amounts
- Currency formatted (VND)

### 3.4 `components/shelf-picker.tsx` (NEW)
- Zone dropdown + Row input → generates location code "A-03-2"
- Visual mini-map of shelf zones (optional, phase 2)

### 3.5 `components/tracking-timeline.tsx` (EXTRACT)
- Extract from `app/tracking/page.tsx` into reusable component
- Props: `steps: TimelineStep[]`, `orientation?: 'vertical' | 'horizontal'`
- Reuse in: tracking page, order detail, customs detail

### 3.6 `components/inspection-channel-badge.tsx` (NEW)
- Luồng xanh = green badge, Luồng vàng = yellow, Luồng đỏ = red
- Used in customs list and detail

### 3.7 `components/eta-display.tsx` (NEW)
- Shows estimated delivery date with countdown
- "Dự kiến giao: 15/04/2026 (còn 6 ngày)"
- Red if overdue

---

## 4. Business Rules

### 4.1 Customs
- **Declaration required**: Only for containers with UTXNK or LCLCN orders
- **One declaration per container**: Validate no duplicate on create
- **Document completeness**: Cannot advance past "Đã nộp tờ khai" if DocumentStatus = "Thiếu chứng từ"
- **Tax calculation**:
  - ImportTax = ValueCNY × ExchangeRate × ImportTaxRate%
  - VAT = (ValueCNY × ExchangeRate + ImportTax) × VATRate%
  - TotalTax = ImportTax + VAT + SpecialTax + CustomsFees
- **Status cascade**: When declaration → "Đã thông quan":
  1. Update container status → "Đã thông quan"
  2. Update all orders in container → status "Tại kho VN" (or next appropriate)
  3. Create TrackingEvent "Đã thông quan" for each order
- **Inspection channel**: Set by customs office, cannot be changed after submission

### 4.2 Warehouse VN
- **QC required**: Must set QCStatus before moving to "Trên kệ"
- **Shelf required**: Must assign ShelfZone + ShelfRow before "Trên kệ"
- **Discrepancy alert**: If PackagesReceived ≠ PackagesExpected, auto-flag, require DiscrepancyNote before advancing
- **Outbound flow**: "Trên kệ" → "Đang pick" (assign to delivery order) → "Đã đóng gói" → "Chờ giao" → "Đã giao"
- **Aging rule**: Items on shelf > 14 days → alert to Sale owner

### 4.3 Tracking
- **Auto-create events**: When customs/warehouse/delivery status changes, create TrackingEvent
- **ETA calculation**: `container.ETA + 3 business days` for domestic delivery estimate
- **Phone search**: Match customer phone → find all orders → show combined view

---

## 5. Approval Flows

### 5.1 Customs Tax Payment
- Linked to Payment Voucher approval (existing):
  - When customs declaration needs tax payment → create Payment Voucher (ExpenseType: "Thuế NK" or "VAT")
  - Follows existing payment voucher approval: ≤50M → KT TT → BGĐ; >50M → KT TT → KT TH → BGĐ

### 5.2 Held Goods (Bị giữ hàng)
- If inspection result = seized → auto-create Approval (type: "Hàng bị giữ")
- Flow: TP XNK → GĐ KD → BGĐ
- Include: reason, estimated delay, additional cost

> No new approval entities needed — use existing `lib/approvals.ts`.

---

## 6. Cross-Module Dependencies

```
customs-declarations.ts
  ← containers.ts (ContainerId, auto-populate CBM/weight)
  ← container-items.ts (get orders in container)
  ← orders.ts (update status on clearance)
  ← order-items.ts (HS codes, values)
  ← suppliers.ts (broker = supplier with category "Thông quan")
  ← payment-vouchers.ts (create tax payment voucher)
  ← tracking-events.ts (log customs events)
  ← exchange-rates.ts (CNY→VND for tax calc)
  ← approvals.ts (held goods approval)

warehouse-vn-receipts.ts (enhanced)
  ← containers.ts (source container)
  ← delivery-orders.ts (outbound link)
  ← tracking-events.ts (log warehouse events)
  ← orders.ts (order info)

tracking-events.ts
  ← orders.ts (order link)
  ← containers.ts (container link)
```

---

## 7. SDK Workarounds

### Complex Filtering
```typescript
// Customs: filter containers eligible for declaration
const { data: containers } = await getContainers({ take: 200 });
const eligible = containers.filter(c =>
  ['Tại biên giới', 'Hải quan'].includes(c.Status || '') 
);

// Warehouse: aging calculation
const { data: receipts } = await getWarehouseVnReceipts({ take: 200 });
const aging = receipts.filter(r => {
  if (r.Status !== 'Trên kệ') return false;
  const days = differenceInDays(new Date(), new Date(r.createdAt));
  return days > 14;
});

// Tracking: find orders by customer phone
const { data: customers } = await getCustomers({ take: 200 });
const match = customers.filter(c => c.Phone?.includes(query));
const customerIds = match.map(c => c.id);
const { data: orders } = await getOrders({ take: 200 });
const customerOrders = orders.filter(o => customerIds.includes(o.CustomerId || ''));
```

### Cross-Table Joins
```typescript
// Customs detail: enrich declaration items with order info
const [declaration, items, orders] = await Promise.all([
  getCustomsDeclaration(id),
  getCustomsDeclarationItems({ take: 200 }),
  getOrders({ take: 200 }),
]);
const declItems = items.data
  .filter(i => i.DeclarationId === id)
  .map(i => ({
    ...i,
    order: orders.data.find(o => o.id === i.OrderId),
  }));
```

### Aggregations
```typescript
// Customs KPIs: aggregate from fetched data
const declarations = await getCustomsDeclarations({ take: 200 });
const totalTaxThisMonth = declarations.data
  .filter(d => d.ClearanceDate && isThisMonth(new Date(d.ClearanceDate)))
  .reduce((sum, d) => sum + (d.TotalTaxVND || 0), 0);
```

---

## 8. Queries Needed (Base Queries)

| Query Name | Purpose | Used In |
|------------|---------|---------|
| `customs-monthly-summary` | Aggregated customs tax by month | Customs dashboard KPIs |
| `warehouse-vn-occupancy` | Shelf occupancy by zone | Inventory page |
| `tracking-events-daily` | Events count by type per day | Tracking admin dashboard |

> These are optional optimizations. The app works with client-side aggregation first; queries can be connected later if performance is an issue with >200 records.

---

## 9. Estimated Complexity

| Category | Files | ~LOC |
|----------|-------|------|
| **Lib files** (new entities) | 3 | ~450 |
| **Lib files** (enhanced) | 1 | ~50 (additions) |
| **Pages** (new) | 5 | ~2,500 |
| **Pages** (rewrite/enhance) | 3 | ~1,200 |
| **Components** (new) | 7 | ~700 |
| **Total** | **19 files** | **~4,900 LOC** |

Complexity: **Medium-High** — 3 new entities, 5 new pages, 3 enhanced pages, 7 components.

---

## 10. Build Order

### Phase 1: Entities & Foundation (Day 1)
```
1. lib/customs-declarations.ts          — NEW entity + CRUD
2. lib/customs-declaration-items.ts     — NEW entity + CRUD
3. lib/tracking-events.ts              — NEW entity + CRUD
4. lib/warehouse-vn-receipts.ts        — ADD new fields (QC, shelf, pick)
```

### Phase 2: Shared Components (Day 1-2)
```
5. components/tracking-timeline.tsx     — EXTRACT from tracking page
6. components/customs-status-flow.tsx   — NEW step indicator
7. components/document-checklist.tsx    — NEW checklist card
8. components/tax-breakdown.tsx        — NEW tax table
9. components/inspection-channel-badge.tsx — NEW badge
10. components/shelf-picker.tsx         — NEW shelf assignment
11. components/eta-display.tsx          — NEW ETA countdown
```

### Phase 3: Customs Pages (Day 2-3)
```
12. app/customs/page.tsx               — REWRITE with KPIs + declaration list
13. app/customs/new/page.tsx           — NEW declaration form (multi-step)
14. app/customs/[id]/page.tsx          — NEW declaration detail
```

### Phase 4: Warehouse VN Enhancement (Day 3-4)
```
15. app/warehouse-vn/page.tsx          — ENHANCE with KPIs, batch, shelf filter
16. app/warehouse-vn/[id]/page.tsx     — ENHANCE with QC, shelf, pick flow
17. app/warehouse-vn/inventory/page.tsx — NEW inventory overview
18. app/warehouse-vn/outbound/page.tsx — NEW outbound management
```

### Phase 5: Tracking Enhancement (Day 4)
```
19. app/tracking/page.tsx              — ENHANCE with phone search, ETA, multi-order
20. app/tracking/events/page.tsx       — NEW admin event dashboard
```

### Phase 6: Integration & Status Cascade (Day 5)
```
21. Wire up customs clearance → order status updates
22. Wire up warehouse status changes → tracking events
23. Wire up customs clearance → container status updates
24. Test end-to-end flow: Container arrives → Customs → Warehouse VN → Delivery → Tracking
```

---

## Key Decisions / Open Questions

1. **HS Code master list**: Should we create a separate `HSCodes` entity as reference data, or keep it as free text on items? → **Recommendation**: Free text for V1, reference table in V2.

2. **Broker management**: Use existing `Suppliers` entity (category = "Thông quan") or dedicated entity? → **Recommendation**: Use Suppliers with category filter.

3. **Tracking events auto-creation**: Should be triggered in status update functions or via separate utility? → **Recommendation**: Create a `logTrackingEvent()` helper called from each status transition.

4. **Shelf management depth**: Simple text (A-03-2) or structured entity with capacity? → **Recommendation**: Simple text for V1, structured entity if warehouse grows.

5. **Public tracking link**: Should tracking page require auth? → **Recommendation**: No auth (public). The Base UI wraps it; the generated app is already behind deployment.
