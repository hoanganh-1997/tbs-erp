---
name: tbs-warehouse-logistics
description: "Build guide for TBS warehouse and logistics modules on Inforact App Builder. Use when creating: warehouse CN receipt forms (scan/photo UI), warehouse VN receiving, container planning/packing list, delivery dispatch, driver POD capture, tracking timeline, or any warehouse/logistics UI. Also trigger for: bilingual Chinese-Vietnamese interface, CBM calculation, fill rate, COD collection, barcode scanning, route optimization. Covers lib/warehouse-cn-receipts.ts, lib/containers.ts, lib/warehouse-vn-receipts.ts, lib/delivery-orders.ts."
---

# TBS Warehouse & Logistics — App Builder Guide

## Table Definitions

### `lib/warehouse-cn-receipts.ts`
```typescript
const TABLE_ID_PROMISE = createTable('WarehouseCnReceipts', [
  { name: 'ReceiptCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'TrackingCN', type: 'TEXT' },
  { name: 'PackagesExpected', type: 'NUMBER' },
  { name: 'PackagesReceived', type: 'NUMBER' },
  { name: 'TotalReceived', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'LengthCm', type: 'NUMBER' },
  { name: 'WidthCm', type: 'NUMBER' },
  { name: 'HeightCm', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'ChargeableWeight', type: 'NUMBER' },
  { name: 'QCStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Đạt' }, { name: 'Lỗi' }, { name: 'Chờ KH duyệt' }
  ]},
  { name: 'QCNotes', type: 'TEXT' },
  { name: 'LabelStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Tem HQ OK' }, { name: 'Cần in bù' }, { name: 'Chỉ mã nội bộ' }
  ]},
  { name: 'InternalBarcode', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ nhận' }, { name: 'Đã nhận' }, { name: 'Đã kiểm' },
    { name: 'Trên kệ' }, { name: 'Đang pick' }, { name: 'Đã đóng gói' },
    { name: 'Đã load' }, { name: 'Đã xuất' }
  ]},
  { name: 'ExtraServices', type: 'MULTIPLE_OPTIONS', options: [
    { name: 'Kiểm đếm' }, { name: 'Đóng gói lại' }, { name: 'Kiện gỗ' },
    { name: 'Ảnh chi tiết' }, { name: 'Video mở kiện' }
  ]},
  { name: 'ExtraServiceFee', type: 'NUMBER' },
  { name: 'IsUnidentified', type: 'CHECKBOX' },
  { name: 'Agent', type: 'TEXT' },
  { name: 'VerifiedBySale', type: 'CHECKBOX' },
  { name: 'VerifiedAt', type: 'DATE' },
]);
```

### `lib/containers.ts`
```typescript
const TABLE_ID_PROMISE = createTable('Containers', [
  { name: 'ContainerCode', type: 'TEXT' },
  { name: 'ContainerType', type: 'SINGLE_OPTION', options: [
    { name: '20ft' }, { name: '40ft' }, { name: '40ft HC' }, { name: 'Xe tải' }
  ]},
  { name: 'Route', type: 'SINGLE_OPTION', options: [
    { name: 'Đường biển' }, { name: 'Đường bộ' }
  ]},
  { name: 'CarrierId', type: 'TEXT' },
  { name: 'CarrierName', type: 'TEXT' },
  { name: 'VesselCode', type: 'TEXT' },
  { name: 'SealNumber', type: 'TEXT' },
  { name: 'BookingDate', type: 'DATE' },
  { name: 'ETD', type: 'DATE' },
  { name: 'ETA', type: 'DATE' },
  { name: 'ActualDeparture', type: 'DATE' },
  { name: 'ActualArrival', type: 'DATE' },
  { name: 'DestinationWarehouse', type: 'SINGLE_OPTION', options: [
    { name: 'Đông Anh (HN)' }, { name: 'Hóc Môn (HCM)' }
  ]},
  { name: 'TotalCBM', type: 'NUMBER' },
  { name: 'MaxCBM', type: 'NUMBER' },
  { name: 'FillRate', type: 'NUMBER' },
  { name: 'TotalPackages', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Lập kế hoạch' }, { name: 'Đặt chỗ' }, { name: 'Đang xếp' },
    { name: 'Đã đóng' }, { name: 'Đang vận chuyển' }, { name: 'Tại biên giới' },
    { name: 'Hải quan' }, { name: 'Đã thông quan' }, { name: 'Đã về kho' },
    { name: 'Đang dỡ' }, { name: 'Hoàn tất' }
  ]},
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedBy', type: 'TEXT' },
]);
```

### `lib/container-items.ts`
```typescript
const TABLE_ID_PROMISE = createTable('ContainerItems', [
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'ReceiptId', type: 'TEXT' },
  { name: 'Packages', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'LoadedAt', type: 'DATE' },
  { name: 'ScanVerified', type: 'CHECKBOX' },
]);
```

### `lib/warehouse-vn-receipts.ts`
```typescript
const TABLE_ID_PROMISE = createTable('WarehouseVnReceipts', [
  { name: 'ReceiptCode', type: 'TEXT' },
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'Warehouse', type: 'SINGLE_OPTION', options: [
    { name: 'Đông Anh (HN)' }, { name: 'Hóc Môn (HCM)' }
  ]},
  { name: 'PackagesExpected', type: 'NUMBER' },
  { name: 'PackagesReceived', type: 'NUMBER' },
  { name: 'Discrepancy', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ dỡ' }, { name: 'Đã dỡ' }, { name: 'Đã kiểm' },
    { name: 'Trên kệ' }, { name: 'Đang pick' }, { name: 'Đã đóng gói' },
    { name: 'Chờ giao' }, { name: 'Đã giao' }
  ]},
  { name: 'Location', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
  { name: 'ReceivedBy', type: 'TEXT' },
]);
```

### `lib/delivery-orders.ts`
```typescript
const TABLE_ID_PROMISE = createTable('DeliveryOrders', [
  { name: 'DeliveryCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'ScheduledDate', type: 'DATE' },
  { name: 'TimeSlot', type: 'SINGLE_OPTION', options: [
    { name: 'Sáng (8-12h)' }, { name: 'Chiều (13-17h)' }, { name: 'Cả ngày' }
  ]},
  { name: 'Driver', type: 'TEXT' },
  { name: 'Vehicle', type: 'TEXT' },
  { name: 'Packages', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ xếp lịch' }, { name: 'Đã xếp lịch' }, { name: 'Đang giao' },
    { name: 'Đã giao' }, { name: 'Giao lỗi' }, { name: 'Trả lại' }
  ]},
  { name: 'CODAmount', type: 'NUMBER' },
  { name: 'CODCollected', type: 'NUMBER' },
  { name: 'CODSubmitted', type: 'CHECKBOX' },
  { name: 'FailureReason', type: 'TEXT' },
  { name: 'AssignedBy', type: 'TEXT' },
  { name: 'HasDocuments', type: 'CHECKBOX' },
]);
```

## Page Components

### Warehouse CN — Receipt Form (Mobile-first)

Key design: Agent TQ uses phone/tablet in warehouse. Large buttons, scan-first flow.

```tsx
// Bilingual toggle
const [lang, setLang] = useState<'vi' | 'zh'>('vi');
const t = (vi: string, zh: string) => lang === 'vi' ? vi : zh;

// Receipt flow
// Step 1: Scan tracking number
// Step 2: Auto-match order (or mark unidentified)
// Step 3: Enter weight + dimensions → auto-calc CBM
// Step 4: Take photos (minimum 2)
// Step 5: QC check
// Step 6: Label check
// Step 7: Save

// CBM calculation
const cbm = (length * width * height) / 1_000_000;
const volumetricWeight = cbm * 167; // air freight factor
const chargeableWeight = Math.max(weightKg, volumetricWeight);

// Cumulative receiving display
<div className="text-center py-4">
  <span className="text-2xl font-bold">{totalReceived}/{packagesExpected}</span>
  <span className="text-sm text-muted-foreground ml-2">
    {t('kiện', '件')}
  </span>
  <Progress value={(totalReceived / packagesExpected) * 100} className="mt-2" />
  {totalReceived >= packagesExpected && (
    <Badge className="mt-2 bg-green-500">✅ {t('Đủ kiện', '已收齐')}</Badge>
  )}
</div>
```

### Container Planning View

```tsx
// Container overview with fill rate gauge
function ContainerCard({ container }: { container: Container }) {
  const fillPercent = container.FillRate || 0;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{container.ContainerCode}</CardTitle>
          <Badge>{container.ContainerType}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fill rate</span>
            <span className={cn(
              fillPercent >= 85 ? "text-green-600" : 
              fillPercent >= 70 ? "text-yellow-600" : "text-red-600"
            )}>{fillPercent}%</span>
          </div>
          <Progress value={fillPercent} />
          <div className="text-xs text-muted-foreground">
            {container.TotalCBM}/{container.MaxCBM} CBM — {container.TotalPackages} packages
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Filter eligible packages for container assignment
// Only UTXNK/LCLCN orders, at warehouse CN, no issues
async function getEligiblePackages(bookingDate: string) {
  const { data: receipts } = await getWarehouseCnReceipts({
    filters: { Status: 'Trên kệ' }
  });
  // Client-side filter: only chính ngạch, arrived before booking date
  return receipts.filter(r => {
    return r.createdAt && new Date(r.createdAt) <= new Date(bookingDate)
      && !r.IsUnidentified
      && r.QCStatus === 'Đạt';
  });
}
```

### Delivery Dispatch (Trưởng kho view)

```tsx
// Daily dispatch board — group by driver
async function getDispatchBoard(date: string) {
  const { data: deliveries } = await getDeliveryOrders({
    filters: { ScheduledDate: date }
  });
  
  // Group by driver
  const byDriver = _.groupBy(deliveries, 'Driver');
  return Object.entries(byDriver).map(([driver, orders]) => ({
    driver,
    orders,
    totalPackages: _.sumBy(orders, 'Packages'),
    totalCOD: _.sumBy(orders, 'CODAmount'),
    completedCount: orders.filter(o => o.Status === 'Đã giao').length,
  }));
}
```

### Delivery POD Capture (Driver view)

```tsx
// Simple flow for driver:
// [Bắt đầu giao] → [Đã đến nơi] → [Chụp ảnh giao hàng] → [Thu COD] → [Hoàn tất]

// Status transitions
async function advanceDelivery(id: string, nextStatus: string, extra?: Partial<UpdateDeliveryOrderInput>) {
  await updateDeliveryOrder(id, { Status: nextStatus, ...extra });
  // Also update parent order status if needed
  const delivery = await getDeliveryOrder(id);
  if (nextStatus === 'Đã giao' && delivery.OrderId) {
    await updateOrder(delivery.OrderId, { Status: 'Đã giao' });
  }
}
```

### Tracking Timeline (Customer-facing, read-only)

```tsx
// Public tracking page — no auth needed
const trackingSteps = [
  { label: 'Đã tạo đơn', icon: FileText, date: order.createdAt },
  { label: 'Hàng về kho TQ', icon: Warehouse, date: cnReceipt?.createdAt },
  { label: 'Đóng container', icon: Container, date: containerItem?.LoadedAt },
  { label: 'Đang vận chuyển', icon: Ship, date: container?.ActualDeparture },
  { label: 'Thông quan', icon: Shield, date: null }, // from order history
  { label: 'Về kho VN', icon: MapPin, date: vnReceipt?.createdAt },
  { label: 'Đang giao hàng', icon: Truck, date: delivery?.createdAt },
  { label: 'Đã giao', icon: CheckCircle, date: delivery?.Status === 'Đã giao' ? delivery?.updatedAt : null },
];
```
