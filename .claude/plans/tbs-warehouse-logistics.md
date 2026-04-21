# Kế hoạch triển khai Module Kho Vận (Warehouse & Logistics)

> Ngày lập: 2026-04-09
> Hoàn thành: 2026-04-09 (Sprint 1-4 DONE)
> Module: Kho TQ + Container + Kho VN + Giao hàng + Theo dõi

---

## Tổng quan hiện trạng

### Đã có (lib files - DONE)
| File | Entity | Trạng thái |
|------|--------|------------|
| `lib/warehouse-cn-receipts.ts` | WarehouseCnReceipts | Done - 25 fields |
| `lib/containers.ts` | Containers | Done - 20 fields |
| `lib/container-items.ts` | ContainerItems | Done - 9 fields |
| `lib/warehouse-vn-receipts.ts` | WarehouseVnReceipts | Done - 13 fields |
| `lib/delivery-orders.ts` | DeliveryOrders | Done - 17 fields |
| `lib/quality-issues.ts` | QualityIssues | Done - 13 fields |

### Đã có (pages - cơ bản)
| Page | Route | Trạng thái | Thiếu |
|------|-------|------------|-------|
| `app/warehouse-cn/page.tsx` | `/warehouse-cn` | List view cơ bản | Thiếu: form tạo phiếu, detail, scan flow mobile, bilingual |
| `app/warehouse-vn/page.tsx` | `/warehouse-vn` | List view cơ bản | Thiếu: form nhận hàng, detail, đối soát container |
| `app/containers/page.tsx` | `/containers` | List + create modal | Thiếu: detail page, packing list, add items flow |
| `app/delivery/page.tsx` | `/delivery` | Driver-grouped + list | Thiếu: tạo lệnh giao, assign driver, POD capture |
| `app/delivery-orders/page.tsx` | `/delivery-orders` | List view cơ bản | Thiếu: tạo/sửa lệnh, assign driver modal |
| `app/tracking/page.tsx` | `/tracking` | Search + timeline | OK - đầy đủ |
| `app/quality/page.tsx` | `/quality` | ? | Cần kiểm tra |

### Placeholder pages (chưa triển khai)
| Page | Route | Mô tả |
|------|-------|-------|
| `app/warehouse-services/page.tsx` | `/warehouse-services` | Dịch vụ kho TQ |
| `app/package-issues/page.tsx` | `/package-issues` | Vấn đề kiện hàng |
| `app/vehicles/page.tsx` | `/vehicles` | Quản lý phương tiện |
| `app/drivers/page.tsx` | `/drivers` | Quản lý tài xế |
| `app/inventory/page.tsx` | `/inventory` | Kho vật tư & tồn kho |

---

## 1. Entities cần bổ sung

### 1.1 `lib/vehicles.ts` (MỚI)
```
Vehicles:
- VehicleCode: TEXT (PT-001)
- LicensePlate: TEXT
- VehicleType: SINGLE_OPTION [Xe tải 1T, Xe tải 2.5T, Xe tải 5T, Xe con]
- Brand: TEXT
- MaxWeight: NUMBER (tấn)
- MaxCBM: NUMBER
- Status: SINGLE_OPTION [Sẵn sàng, Đang sử dụng, Bảo trì, Ngưng hoạt động]
- CurrentDriver: TEXT
- InsuranceExpiry: DATE
- MaintenanceDate: DATE
- Notes: TEXT
```

### 1.2 `lib/drivers.ts` (MỚI)
```
Drivers:
- DriverCode: TEXT (TX-001)
- FullName: TEXT
- Phone: TEXT
- LicenseNumber: TEXT
- LicenseExpiry: DATE
- AssignedVehicle: TEXT
- Status: SINGLE_OPTION [Đang hoạt động, Nghỉ phép, Nghỉ việc]
- TodayDeliveries: NUMBER
- TotalDeliveries: NUMBER
- Notes: TEXT
```

### 1.3 `lib/warehouse-services.ts` (MỚI)
```
WarehouseServices:
- ServiceCode: TEXT
- ReceiptId: TEXT (link to WarehouseCnReceipts)
- OrderId: TEXT
- OrderCode: TEXT
- ServiceType: SINGLE_OPTION [Kiểm đếm, Đóng gói lại, Kiện gỗ, Ảnh chi tiết, Video mở kiện]
- Quantity: NUMBER
- UnitPrice: NUMBER (CNY)
- TotalFee: NUMBER (CNY)
- Status: SINGLE_OPTION [Chờ xử lý, Đang xử lý, Hoàn thành, Đã tính phí]
- CompletedBy: TEXT
- CompletedAt: DATE
- Notes: TEXT
```

### 1.4 `lib/package-issues.ts` (MỚI)
```
PackageIssues:
- IssueCode: TEXT
- ReceiptId: TEXT
- OrderId: TEXT
- OrderCode: TEXT
- IssueType: SINGLE_OPTION [Thiếu kiện, Sai hàng, Hàng hư hỏng, Kiện không xác định, Sai kích thước, Nhãn sai]
- Description: TEXT
- Severity: SINGLE_OPTION [Nhẹ, Trung bình, Nặng, Nghiêm trọng]
- Status: SINGLE_OPTION [Mở, Đang xử lý, Chờ KH, Đã giải quyết, Đã đóng]
- Resolution: TEXT
- ReportedBy: TEXT
- AssignedTo: TEXT
```

> **Lưu ý**: `lib/quality-issues.ts` đã có rồi nhưng phục vụ level đơn hàng. `package-issues` phục vụ level kiện hàng trong kho.

---

## 2. Pages cần triển khai / nâng cấp

### Phase 1 — Kho TQ (ưu tiên cao nhất)

| # | Page | Route | Mô tả | Độ phức tạp |
|---|------|-------|-------|-------------|
| 1.1 | **Warehouse CN Detail** | `/warehouse-cn/[id]` | Chi tiết phiếu nhận hàng + timeline + ảnh + QC | Trung bình |
| 1.2 | **Warehouse CN Create** | `/warehouse-cn/new` | Form tạo phiếu nhận hàng (scan-first, 7-step flow) | Cao |
| 1.3 | **Upgrade Warehouse CN List** | `/warehouse-cn` | Thêm: bulk actions, export, thống kê nhanh (cards KPI trên đầu) | Nhẹ |
| 1.4 | **Warehouse Services** | `/warehouse-services` | CRUD dịch vụ kho, link tới phiếu nhận | Trung bình |
| 1.5 | **Package Issues** | `/package-issues` | Report & track vấn đề kiện hàng | Trung bình |

### Phase 2 — Container & Vận chuyển

| # | Page | Route | Mô tả | Độ phức tạp |
|---|------|-------|-------|-------------|
| 2.1 | **Container Detail** | `/containers/[id]` | Chi tiết cont, packing list, fill rate gauge, timeline trạng thái | Cao |
| 2.2 | **Add Items to Container** | Modal trong `/containers/[id]` | Chọn kiện eligible → thêm vào cont → auto-calc CBM + fill rate | Cao |
| 2.3 | **Upgrade Container List** | `/containers` | Thêm: KPI cards (tổng cont đang VC, fill rate TB), filter by route/warehouse | Nhẹ |

### Phase 3 — Kho VN & Giao hàng

| # | Page | Route | Mô tả | Độ phức tạp |
|---|------|-------|-------|-------------|
| 3.1 | **Warehouse VN Detail** | `/warehouse-vn/[id]` | Chi tiết phiếu nhận VN + đối soát container | Trung bình |
| 3.2 | **Warehouse VN Create** | `/warehouse-vn/new` | Dỡ container → tạo phiếu nhận VN (per order, so sánh kiện) | Cao |
| 3.3 | **Delivery Create** | `/delivery-orders/new` | Tạo lệnh giao hàng: chọn đơn/kiện → assign tài xế/xe | Trung bình |
| 3.4 | **Delivery Detail** | `/delivery-orders/[id]` | Chi tiết lệnh giao + POD (proof of delivery) | Trung bình |
| 3.5 | **Vehicles** | `/vehicles` | CRUD phương tiện, trạng thái sẵn sàng | Nhẹ |
| 3.6 | **Drivers** | `/drivers` | CRUD tài xế, thống kê giao hàng | Nhẹ |

### Phase 4 — Dashboard & Nâng cao

| # | Page | Route | Mô tả | Độ phức tạp |
|---|------|-------|-------|-------------|
| 4.1 | **Warehouse Dashboard** | `/warehouse-dashboard` | Dashboard tổng hợp kho vận (cho Trưởng kho / BGĐ) | Cao |
| 4.2 | **Upgrade Tracking** | `/tracking` | Thêm: batch tracking, push notification status | Nhẹ |
| 4.3 | **Inventory** | `/inventory` | Tồn kho realtime: kho TQ + kho VN, lâu ngày chưa nhận | Trung bình |

---

## 3. Components tái sử dụng cần tạo

| Component | File | Dùng ở |
|-----------|------|--------|
| `ReceiptForm` | `components/warehouse/receipt-form.tsx` | warehouse-cn/new, warehouse-cn/[id] |
| `PackageCounter` | `components/warehouse/package-counter.tsx` | receipt form, container detail |
| `CBMCalculator` | `components/warehouse/cbm-calculator.tsx` | receipt form (tự tính CBM từ L×W×H) |
| `FillRateGauge` | `components/warehouse/fill-rate-gauge.tsx` | container detail, container list |
| `ContainerTimeline` | `components/warehouse/container-timeline.tsx` | container detail, tracking |
| `PackingList` | `components/warehouse/packing-list.tsx` | container detail (danh sách kiện trong cont) |
| `DriverAssignModal` | `components/delivery/driver-assign-modal.tsx` | delivery-orders/new, delivery list |
| `DeliveryStatusFlow` | `components/delivery/delivery-status-flow.tsx` | delivery detail, delivery list |
| `BilingualToggle` | `components/warehouse/bilingual-toggle.tsx` | warehouse-cn (vi/zh) |
| `WarehouseKPICards` | `components/warehouse/warehouse-kpi-cards.tsx` | warehouse-cn, warehouse-vn, dashboard |

---

## 4. Business Rules & Validation

### 4.1 Kho TQ — Nhận hàng
- **CBM = (L × W × H) / 1,000,000** (đơn vị cm)
- **Chargeable Weight = max(WeightKg, CBM × 167)** (hệ số hàng không)
- Kiện không xác định (`IsUnidentified = true`): phải chờ Sale verify trước khi lên kệ
- QC Status = "Lỗi" → tự động tạo PackageIssue
- Sau nhận kiện cuối cùng (TotalReceived >= PackagesExpected) → hiện badge "Đủ kiện"
- Auto-gen `ReceiptCode`: `NK-TQ-[YYMMDD]-[SEQ]`

### 4.2 Container
- **Fill Rate = (TotalCBM / MaxCBM) × 100**
- Chỉ add kiện có Status = "Trên kệ" + QCStatus = "Đạt" + không phải kiện chưa xác định
- Chỉ đơn UTXNK / LCLCN mới cần ghép container (VCT/MHH skip)
- Khi đóng cont (`Đã đóng`): cần SealNumber, không cho add thêm kiện
- Cần duyệt kế hoạch container (Trưởng kho TQ → TP XNK nếu chính ngạch)
- Auto-gen `ContainerCode`: `CNT-[YYMMDD]-[SEQ]`

### 4.3 Kho VN — Nhận hàng
- Nhận theo container: dỡ container → tạo phiếu nhận per order
- **Discrepancy = PackagesReceived - PackagesExpected** (nếu ≠ 0 → flag đỏ)
- Đối soát: so sánh kiện nhận VN với kiện đã load từ kho TQ
- Vị trí kệ: format `[Khu]-[Dãy]-[Tầng]` (ví dụ: `A-03-02`)
- Auto-gen `ReceiptCode`: `NK-VN-[YYMMDD]-[SEQ]`

### 4.4 Giao hàng
- COD: nếu `CODAmount > 0`, tài xế phải xác nhận `CODCollected` khi giao xong
- `CODSubmitted = true` khi tài xế nộp tiền về cho KT
- Giao lỗi: bắt buộc nhập `FailureReason`
- Status flow: `Chờ xếp lịch → Đã xếp lịch → Đang giao → Đã giao / Giao lỗi / Trả lại`
- Khi "Đã giao" → cập nhật Order Status = "Đã giao"
- Auto-gen `DeliveryCode`: `GH-[YYMMDD]-[SEQ]`

### 4.5 Tracking
- 8 bước timeline: Tạo đơn → Kho TQ → Container → Vận chuyển → Thông quan → Kho VN → Giao hàng → Đã giao
- Join 6 bảng client-side: Orders + CN Receipts + Containers + ContainerItems + VN Receipts + DeliveryOrders

---

## 5. Approval Flows

### 5.1 Container Plan Approval
```
Kho TQ tạo kế hoạch container
  → Trưởng kho TQ duyệt (SLA: 4h)
  → [Nếu UTXNK/LCLCN] TP XNK duyệt (SLA: 4h)
  → Approved → Status = "Đặt chỗ"
```

### 5.2 Xuất kho TQ
```
Kho TQ xuất hàng (Status → "Đã xuất")
  → Sale verify receipt code → VerifiedBySale = true
```

### 5.3 Giao hàng COD
```
Tài xế giao xong → Nhập CODCollected
  → [Nếu CODCollected ≠ CODAmount] → Flag chênh lệch → Trưởng kho xem xét
  → Tài xế nộp COD → CODSubmitted = true → KT xác nhận
```

---

## 6. Cross-Module Dependencies

| Module | Import từ | Mục đích |
|--------|-----------|----------|
| Kho TQ | `lib/orders.ts` | Link phiếu nhận → đơn hàng, lấy ServiceTypes |
| Kho TQ | `lib/customers.ts` | Hiện tên KH trên phiếu nhận |
| Container | `lib/warehouse-cn-receipts.ts` | Lấy kiện eligible để ghép cont |
| Container | `lib/orders.ts` | Check ServiceTypes (chỉ UTXNK/LCLCN) |
| Kho VN | `lib/containers.ts` | Dỡ container → tạo phiếu nhận |
| Kho VN | `lib/container-items.ts` | Đối soát kiện theo container |
| Giao hàng | `lib/orders.ts` | Cập nhật status đơn khi giao xong |
| Giao hàng | `lib/customers.ts` | Lấy địa chỉ giao hàng |
| Giao hàng | `lib/warehouse-vn-receipts.ts` | Chỉ giao kiện đã "Trên kệ" ở kho VN |
| Tracking | ALL warehouse libs | Join 6 bảng cho timeline |
| Dashboard | ALL warehouse libs | Thống kê tổng hợp |

---

## 7. SDK Workarounds

### 7.1 Complex filtering (ngày, range)
```typescript
// Lấy kiện eligible cho container (trước ngày booking)
const { data: receipts } = await getWarehouseCnReceipts({ take: 200 });
const eligible = receipts.filter(r =>
  r.Status === 'Trên kệ' &&
  r.QCStatus === 'Đạt' &&
  !r.IsUnidentified &&
  r.createdAt && new Date(r.createdAt) <= new Date(bookingDate)
);
```

### 7.2 Cross-table joins (container → orders)
```typescript
const [containers, items, orders] = await Promise.all([
  getContainers({ take: 200 }),
  getContainerItems({ take: 200 }),
  getOrders({ take: 200 }),
]);
const enriched = containers.data.map(c => ({
  ...c,
  items: items.data.filter(i => i.ContainerId === c.id).map(i => ({
    ...i,
    order: orders.data.find(o => o.id === i.OrderId),
  })),
}));
```

### 7.3 Aggregations (fill rate, KPI)
```typescript
// Client-side aggregation cho dashboard
const totalCBM = items.reduce((sum, i) => sum + (i.CBM ?? 0), 0);
const fillRate = maxCBM > 0 ? Math.round((totalCBM / maxCBM) * 100) : 0;
```

### 7.4 Pagination (>200 records)
```typescript
// Nếu kho lớn, fetch nhiều page
async function fetchAll<T>(fetcher: (opts: any) => Promise<{ data: T[]; total: number }>) {
  const first = await fetcher({ take: 200, skip: 0 });
  if (first.total <= 200) return first.data;
  const pages = Math.ceil(first.total / 200);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetcher({ take: 200, skip: (i + 1) * 200 }))
  );
  return [...first.data, ...rest.flatMap(r => r.data)];
}
```

---

## 8. Base Queries cần kết nối

| Query | Mục đích | Dùng ở |
|-------|----------|--------|
| `warehouse-cn-summary` | Tổng kiện chờ nhận, đã nhận, trên kệ (theo ngày) | Dashboard, KPI cards |
| `container-fill-rates` | Fill rate trung bình, cont đang VC | Dashboard |
| `warehouse-vn-summary` | Tổng kiện tại kho VN, chờ giao | Dashboard, KPI cards |
| `delivery-daily-stats` | Số đơn giao hôm nay, hoàn thành, lỗi | Dashboard, delivery page |
| `aging-inventory` | Kiện tồn kho > 7/14/30 ngày | Inventory page |

---

## 9. Estimated Complexity

### Lib files
| File | Trạng thái | LOC ước tính |
|------|------------|-------------|
| `lib/warehouse-cn-receipts.ts` | Done | ~115 |
| `lib/containers.ts` | Done | ~105 |
| `lib/container-items.ts` | Done | ~75 |
| `lib/warehouse-vn-receipts.ts` | Done | ~90 |
| `lib/delivery-orders.ts` | Done | ~100 |
| `lib/quality-issues.ts` | Done | ~90 |
| `lib/vehicles.ts` | **MỚI** | ~90 |
| `lib/drivers.ts` | **MỚI** | ~85 |
| `lib/warehouse-services.ts` | **MỚI** | ~90 |
| `lib/package-issues.ts` | **MỚI** | ~90 |

### Pages
| Page | LOC ước tính |
|------|-------------|
| `app/warehouse-cn/new/page.tsx` | ~400 (7-step form) |
| `app/warehouse-cn/[id]/page.tsx` | ~350 |
| `app/containers/[id]/page.tsx` | ~450 (packing list + actions) |
| `app/warehouse-vn/new/page.tsx` | ~350 |
| `app/warehouse-vn/[id]/page.tsx` | ~250 |
| `app/delivery-orders/new/page.tsx` | ~300 |
| `app/delivery-orders/[id]/page.tsx` | ~300 |
| `app/vehicles/page.tsx` | ~250 (replace placeholder) |
| `app/drivers/page.tsx` | ~250 (replace placeholder) |
| `app/warehouse-services/page.tsx` | ~300 (replace placeholder) |
| `app/package-issues/page.tsx` | ~300 (replace placeholder) |
| `app/warehouse-dashboard/page.tsx` | ~500 |
| `app/inventory/page.tsx` | ~350 (replace placeholder) |
| Nâng cấp pages hiện có (3 pages) | ~150 mỗi |

### Components
| Component | LOC ước tính |
|-----------|-------------|
| 10 reusable components | ~100 mỗi |

### Tổng cộng
- **Lib files mới**: 4 files × ~90 LOC = ~360 LOC
- **Pages mới**: 13 pages × ~330 LOC TB = ~4,300 LOC
- **Nâng cấp pages**: 3 pages × ~150 LOC = ~450 LOC
- **Components**: 10 files × ~100 LOC = ~1,000 LOC
- **TỔNG**: ~27 files, ~6,100 LOC

---

## 10. Build Order (thứ tự triển khai)

### Sprint 1 (Phase 1 — Kho TQ) — Ưu tiên cao nhất
```
1. lib/warehouse-services.ts        ← entity mới
2. lib/package-issues.ts             ← entity mới
3. components/warehouse/cbm-calculator.tsx
4. components/warehouse/package-counter.tsx
5. components/warehouse/bilingual-toggle.tsx
6. components/warehouse/receipt-form.tsx
7. app/warehouse-cn/new/page.tsx     ← form tạo phiếu nhận (scan flow)
8. app/warehouse-cn/[id]/page.tsx    ← chi tiết phiếu nhận
9. app/warehouse-cn/page.tsx         ← nâng cấp (KPI cards, bulk actions)
10. app/warehouse-services/page.tsx  ← CRUD dịch vụ kho
11. app/package-issues/page.tsx      ← report vấn đề kiện
```

### Sprint 2 (Phase 2 — Container)
```
12. components/warehouse/fill-rate-gauge.tsx
13. components/warehouse/packing-list.tsx
14. components/warehouse/container-timeline.tsx
15. app/containers/[id]/page.tsx     ← detail + packing list + add items
16. app/containers/page.tsx          ← nâng cấp (KPI, filter)
```

### Sprint 3 (Phase 3 — Kho VN & Giao hàng)
```
17. lib/vehicles.ts                  ← entity mới
18. lib/drivers.ts                   ← entity mới
19. components/delivery/driver-assign-modal.tsx
20. components/delivery/delivery-status-flow.tsx
21. app/warehouse-vn/new/page.tsx    ← dỡ container
22. app/warehouse-vn/[id]/page.tsx   ← chi tiết nhận VN
23. app/delivery-orders/new/page.tsx ← tạo lệnh giao
24. app/delivery-orders/[id]/page.tsx ← chi tiết + POD
25. app/vehicles/page.tsx            ← CRUD xe
26. app/drivers/page.tsx             ← CRUD tài xế
```

### Sprint 4 (Phase 4 — Dashboard & Nâng cao)
```
27. components/warehouse/warehouse-kpi-cards.tsx
28. app/warehouse-dashboard/page.tsx ← dashboard tổng hợp
29. app/inventory/page.tsx           ← tồn kho realtime
30. app/tracking/page.tsx            ← nâng cấp (batch tracking)
```

---

## Ghi chú kỹ thuật

### Bilingual UI (Kho TQ)
Agent TQ là người Trung Quốc, cần toggle vi/zh:
```tsx
const [lang, setLang] = useState<'vi' | 'zh'>('vi');
const t = (vi: string, zh: string) => lang === 'vi' ? vi : zh;
```

### Mobile-first cho Warehouse CN & Driver
- Touch target ≥ 44px
- Scan input luôn focus khi mở page
- Camera API cho chụp ảnh QC (HTML5 `<input type="file" capture="environment">`)

### Status Machines
```
Kho TQ:   Chờ nhận → Đã nhận → Đã kiểm → Trên kệ → Đang pick → Đã đóng gói → Đã load → Đã xuất
Container: Lập KH → Đặt chỗ → Đang xếp → Đã đóng → Đang VC → Tại biên giới → Hải quan → Đã thông quan → Đã về kho → Đang dỡ → Hoàn tất
Kho VN:   Chờ dỡ → Đã dỡ → Đã kiểm → Trên kệ → Đang pick → Đã đóng gói → Chờ giao → Đã giao
Giao hàng: Chờ xếp lịch → Đã xếp lịch → Đang giao → Đã giao / Giao lỗi / Trả lại
```

### Interlocking Status Updates
Khi cập nhật status ở 1 entity, cần cascade:
- Container = "Đã về kho" → Auto-create VN Receipts cho từng order trong cont
- Delivery = "Đã giao" → Order Status = "Đã giao"
- All VN Receipts của order = "Đã giao" → Order Status ready for settlement
