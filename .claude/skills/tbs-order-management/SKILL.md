---
name: tbs-order-management
description: "Build guide for TBS Order Management module on Inforact App Builder. Use when creating order forms, order list/detail pages, order status workflows, order timeline, kanban views, or any UI related to TBS orders. Also trigger for: order lifecycle stages, status transitions, conditional flows by service type (VCT/MHH/UTXNK/LCLCN), next-step suggestions, quick actions, clone order, and order dashboards. Covers lib/orders.ts, lib/order-items.ts, lib/order-history.ts patterns."
---

# TBS Order Management — App Builder Guide

## Table Definitions

### `lib/orders.ts`

```typescript
"use server";
import { createTable, getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions } from "@/lib/inforact-sdk";

const TABLE_ID_PROMISE = createTable('Orders', [
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'ServiceTypes', type: 'MULTIPLE_OPTIONS', options: [
    { name: 'VCT' }, { name: 'MHH' }, { name: 'UTXNK' }, { name: 'LCLCN' }
  ]},
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Chờ duyệt' }, { name: 'Đã xác nhận' },
    { name: 'Đang tìm hàng' }, { name: 'Đã đặt hàng' },
    { name: 'Tại kho TQ' }, { name: 'Trong container' },
    { name: 'Đang vận chuyển' }, { name: 'Tại cửa khẩu' },
    { name: 'Đang thông quan' }, { name: 'Tại kho VN' },
    { name: 'Đang giao' }, { name: 'Đã giao' }, { name: 'Hoàn thành' },
    { name: 'Đã hủy' }, { name: 'Tạm giữ' }
  ]},
  { name: 'StageNumber', type: 'NUMBER' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'ItemsTotalCNY', type: 'NUMBER' },
  { name: 'ServiceFeeVND', type: 'NUMBER' },
  { name: 'ShippingFeeVND', type: 'NUMBER' },
  { name: 'TaxVND', type: 'NUMBER' },
  { name: 'TotalVND', type: 'NUMBER' },
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'DepositRequired', type: 'NUMBER' },
  { name: 'DepositPaid', type: 'NUMBER' },
  { name: 'DepositStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa cọc' }, { name: 'Đang chờ' }, { name: 'Đủ cọc' }, { name: 'Miễn cọc' }
  ]},
  { name: 'TotalPaid', type: 'NUMBER' },
  { name: 'PaymentStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa TT' }, { name: 'Cọc' }, { name: 'TT một phần' }, { name: 'TT đủ' }, { name: 'Quá hạn' }
  ]},
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'EstimatedDelivery', type: 'DATE' },
  { name: 'ActualDelivery', type: 'DATE' },
  { name: 'ProfitVND', type: 'NUMBER' },
  { name: 'ProfitMargin', type: 'NUMBER' },
  { name: 'CommissionVND', type: 'NUMBER' },
  { name: 'Priority', type: 'SINGLE_OPTION', options: [
    { name: 'Thường' }, { name: 'Gấp' }, { name: 'VIP' }
  ]},
  { name: 'Notes', type: 'TEXT' },
  { name: 'CancelReason', type: 'TEXT' },
]);

async function getTableId() { return (await TABLE_ID_PROMISE).id; }

export interface Order {
  id: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  ServiceTypes?: string[];
  Status?: string;
  StageNumber?: number;
  Branch?: string;
  SaleOwner?: string;
  TotalVND?: number;
  DepositStatus?: string;
  PaymentStatus?: string;
  Priority?: string;
  createdAt?: string;
  // ... all other fields
}

export type CreateOrderInput = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrderInput = Partial<CreateOrderInput>;

// ... standard CRUD functions (getOrders, getOrder, createOrder, updateOrder, deleteOrder, deleteOrders)
```

### `lib/order-items.ts`
```typescript
const TABLE_ID_PROMISE = createTable('OrderItems', [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'ProductName', type: 'TEXT' },
  { name: 'ProductLink', type: 'TEXT' },
  { name: 'SKU', type: 'TEXT' },
  { name: 'Attributes', type: 'TEXT' },
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'QuantityReceivedCN', type: 'NUMBER' },
  { name: 'QuantityReceivedVN', type: 'NUMBER' },
  { name: 'QuantityDelivered', type: 'NUMBER' },
  { name: 'UnitPriceCNY', type: 'NUMBER' },
  { name: 'TotalCNY', type: 'NUMBER' },
  { name: 'HSCode', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'TrackingCN', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ mua' }, { name: 'Đã đặt' }, { name: 'Đang SX' },
    { name: 'Đã về kho TQ' }, { name: 'Đã giao' }
  ]},
]);
```

### `lib/order-history.ts`
```typescript
const TABLE_ID_PROMISE = createTable('OrderHistory', [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'FromStatus', type: 'TEXT' },
  { name: 'ToStatus', type: 'TEXT' },
  { name: 'Action', type: 'TEXT' },
  { name: 'Note', type: 'TEXT' },
  { name: 'PerformedBy', type: 'TEXT' },
]);
```

## Conditional Stage Logic

```typescript
// Helper: determine required stages based on service types
export function getRequiredStages(serviceTypes: string[]): number[] {
  const base = [1, 2, 3, 5, 6, 8, 10, 11, 12, 13];
  if (serviceTypes.includes('MHH') || serviceTypes.includes('UTXNK')) {
    base.push(4); // Sourcing
  }
  if (serviceTypes.includes('UTXNK') || serviceTypes.includes('LCLCN')) {
    base.push(7, 9); // Container + Customs
  }
  return base.sort((a, b) => a - b);
}

// Helper: get next status based on current + service types
export function getNextStatus(current: string, serviceTypes: string[]): string | null {
  const flow: Record<string, string> = {
    'Nháp': 'Chờ duyệt',
    'Chờ duyệt': 'Đã xác nhận',
    'Đã xác nhận': (serviceTypes.includes('MHH') || serviceTypes.includes('UTXNK'))
      ? 'Đang tìm hàng' : 'Tại kho TQ',
    'Đang tìm hàng': 'Đã đặt hàng',
    'Đã đặt hàng': 'Tại kho TQ',
    'Tại kho TQ': (serviceTypes.includes('UTXNK') || serviceTypes.includes('LCLCN'))
      ? 'Trong container' : 'Đang vận chuyển',
    'Trong container': 'Đang vận chuyển',
    'Đang vận chuyển': (serviceTypes.includes('UTXNK') || serviceTypes.includes('LCLCN'))
      ? 'Tại cửa khẩu' : 'Tại kho VN',
    'Tại cửa khẩu': 'Đang thông quan',
    'Đang thông quan': 'Tại kho VN',
    'Tại kho VN': 'Đang giao',
    'Đang giao': 'Đã giao',
    'Đã giao': 'Hoàn thành',
  };
  return flow[current] || null;
}
```

## Page Components

### Order List Page (`app/page.tsx` or `app/orders/page.tsx`)

```typescript
// Key features:
// 1. Status filter tabs (group by stage)
// 2. Search by OrderCode, CustomerName
// 3. Sort by createdAt DESC (default)
// 4. Pagination (200 records max per request)
// 5. Status badge with color coding
// 6. Quick action buttons in each row

import { getOrders } from "@/lib/orders";

// Fetch with status filter
const { data, total } = await getOrders({
  filters: statusFilter ? { Status: statusFilter } : undefined,
  take: 50,
  skip: page * 50,
  sortField: 'createdAt',
  sortDirection: 'desc',
});
```

**Columns**: OrderCode | CustomerName | ServiceTypes (badges) | Status (badge) | TotalVND | DepositStatus | SaleOwner | createdAt

**Color coding for Status badges**:
```typescript
const statusColors: Record<string, string> = {
  'Nháp': 'bg-gray-100 text-gray-700',
  'Chờ duyệt': 'bg-yellow-100 text-yellow-700',
  'Đã xác nhận': 'bg-blue-100 text-blue-700',
  'Đang vận chuyển': 'bg-purple-100 text-purple-700',
  'Tại kho VN': 'bg-indigo-100 text-indigo-700',
  'Đang giao': 'bg-orange-100 text-orange-700',
  'Đã giao': 'bg-green-100 text-green-700',
  'Hoàn thành': 'bg-green-200 text-green-800',
  'Đã hủy': 'bg-red-100 text-red-700',
  'Tạm giữ': 'bg-red-50 text-red-600',
};
```

### Order Detail Page (`app/orders/[id]/page.tsx`)

**Layout**: Header + Tabs

**Header**: OrderCode | Status badge | ServiceType badges | Priority | [Next Step] button

**Tabs**:
1. **Tổng quan**: Customer card + Financial summary + Visual timeline (stages 1→13)
2. **Hàng hóa**: OrderItems table with per-item status
3. **Tài chính**: PaymentVouchers + AR records + WalletTransactions
4. **Logistics**: WarehouseCN receipts → Container → WarehouseVN → Deliveries
5. **Lịch sử**: OrderHistory audit trail (chronological)

### Order Create Form

```typescript
// Required fields
const schema = z.object({
  CustomerId: z.string().min(1, "Chọn khách hàng"),
  ServiceTypes: z.array(z.string()).min(1, "Chọn ít nhất 1 loại dịch vụ"),
  Branch: z.string().min(1, "Chọn chi nhánh"),
  DeliveryAddress: z.string().min(1, "Nhập địa chỉ giao hàng"),
  ReceiverName: z.string().min(1),
  ReceiverPhone: z.string().min(1),
});

// Auto-generate OrderCode
function generateOrderCode(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  return `DH-${yy}${mm}${dd}-${seq}`;
}

// Auto-fill from customer
async function onCustomerSelect(customerId: string) {
  const customer = await getCustomer(customerId);
  form.setValue('DeliveryAddress', customer.DeliveryAddress || '');
  form.setValue('ReceiverName', customer.ReceiverName || customer.ContactName || '');
  form.setValue('ReceiverPhone', customer.ReceiverPhone || customer.Phone || '');
  // Calculate deposit based on tier
  const rate = customer.Tier === 'VIP' ? 0.3 : customer.Tier === 'Active' ? 0.3 : 0.5;
  form.setValue('DepositRequired', totalVND * rate);
}
```

### Quick Actions (contextual by status)

```typescript
function getQuickActions(order: Order): QuickAction[] {
  const actions: QuickAction[] = [];
  switch (order.Status) {
    case 'Đã xác nhận':
      if (order.ServiceTypes?.includes('MHH') || order.ServiceTypes?.includes('UTXNK')) {
        actions.push({ label: 'Đặt hàng NCC', icon: ShoppingCart, action: 'create-purchase' });
      }
      actions.push({ label: 'Tạo phiếu thu cọc', icon: Receipt, action: 'create-receipt' });
      break;
    case 'Tại kho TQ':
      if (order.ServiceTypes?.includes('UTXNK') || order.ServiceTypes?.includes('LCLCN')) {
        actions.push({ label: 'Ghép container', icon: Container, action: 'assign-container' });
      }
      break;
    case 'Tại kho VN':
      actions.push({ label: 'Tạo lệnh giao hàng', icon: Truck, action: 'create-delivery' });
      break;
    case 'Đã giao':
      actions.push({ label: 'Gửi đối soát', icon: FileCheck, action: 'create-settlement' });
      actions.push({ label: 'Tạo hóa đơn', icon: FileText, action: 'create-invoice' });
      break;
  }
  return actions;
}
```

### Order Timeline Component

```tsx
// Visual stage indicator — highlight current, dim future, check past
function OrderTimeline({ order }: { order: Order }) {
  const stages = getRequiredStages(order.ServiceTypes || []);
  const currentStage = order.StageNumber || 1;
  
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-4">
      {stages.map((stage) => (
        <div key={stage} className="flex items-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
            stage < currentStage && "bg-green-500 text-white",
            stage === currentStage && "bg-blue-500 text-white ring-2 ring-blue-200",
            stage > currentStage && "bg-gray-200 text-gray-500"
          )}>
            {stage < currentStage ? <Check className="w-4 h-4" /> : stage}
          </div>
          {stage !== stages[stages.length - 1] && (
            <div className={cn("w-8 h-0.5", stage < currentStage ? "bg-green-500" : "bg-gray-200")} />
          )}
        </div>
      ))}
    </div>
  );
}
```

## Dashboard Widgets

### Sale Dashboard
- Revenue this month (progress bar vs target)
- Orders by status (mini kanban cards)
- AR alerts: overdue items count + total amount
- Today's tasks (SLA-sorted)
- Leaderboard position

### Key Metrics (use recharts)
```typescript
// Revenue chart: monthly bars
<BarChart data={monthlyRevenue}>
  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
  <Bar dataKey="target" fill="hsl(var(--muted))" />
</BarChart>

// Order pipeline: horizontal funnel
<BarChart layout="vertical" data={statusCounts}>
  <Bar dataKey="count" />
</BarChart>
```
