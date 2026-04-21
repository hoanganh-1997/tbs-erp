---
name: tbs-finance
description: "Build guide for TBS finance modules on Inforact App Builder — payment vouchers (phiếu thu/chi) with anti-fraud validation, accounts receivable (AR/công nợ), accounts payable (AP), wallet management (ví KH + QR), exchange rates, and commission calculation. Use when creating finance forms, AR aging dashboards, voucher approval UI, COD reconciliation, or any accounting view. Covers lib/payment-vouchers.ts, lib/accounts-receivable.ts, lib/accounts-payable.ts, lib/wallet-transactions.ts, lib/exchange-rates.ts."
---

# TBS Finance — App Builder Guide

## Table Definitions

### `lib/payment-vouchers.ts`
```typescript
const TABLE_ID_PROMISE = createTable('PaymentVouchers', [
  { name: 'VoucherCode', type: 'TEXT' },
  { name: 'Type', type: 'SINGLE_OPTION', options: [
    { name: 'Phiếu thu' }, { name: 'Phiếu chi' }
  ]},
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'SupplierName', type: 'TEXT' },
  { name: 'ExpenseType', type: 'SINGLE_OPTION', options: [
    { name: 'Cọc' }, { name: 'Thanh toán NCC' }, { name: 'Thuế NK' },
    { name: 'VAT' }, { name: 'Cước VC' }, { name: 'Phí cảng' },
    { name: 'Phí giao hàng' }, { name: 'Phát sinh' }, { name: 'Hoàn tiền' }, { name: 'COD' }
  ]},
  { name: 'Amount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'Beneficiary', type: 'TEXT' },
  { name: 'Reason', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Chờ KT duyệt' }, { name: 'KT đã duyệt' },
    { name: 'Chờ BGĐ chi' }, { name: 'Đã chi' }, { name: 'Từ chối' }
  ]},
  { name: 'IsFlagged', type: 'CHECKBOX' },
  { name: 'FlagReason', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedByKT', type: 'TEXT' },
  { name: 'ApprovedByMgmt', type: 'TEXT' },
]);
```

### `lib/wallet-transactions.ts`
```typescript
const TABLE_ID_PROMISE = createTable('WalletTransactions', [
  { name: 'TxCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'Type', type: 'SINGLE_OPTION', options: [
    { name: 'Nạp VND' }, { name: 'Nạp CNY' }, { name: 'Phân bổ cọc' },
    { name: 'Phân bổ trả nợ' }, { name: 'Đổi tệ' }, { name: 'Hoàn tiền' }
  ]},
  { name: 'Amount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'BalanceAfter', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ KT duyệt' }, { name: 'Đã duyệt' }, { name: 'Từ chối' }
  ]},
  { name: 'RejectReason', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedBy', type: 'TEXT' },
]);
```

### `lib/accounts-receivable.ts`
```typescript
const TABLE_ID_PROMISE = createTable('AccountsReceivable', [
  { name: 'ARCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'InvoiceAmount', type: 'NUMBER' },
  { name: 'PaidAmount', type: 'NUMBER' },
  { name: 'Remaining', type: 'NUMBER' },
  { name: 'DueDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mở' }, { name: 'TT một phần' }, { name: 'Quá hạn' },
    { name: 'Đã thu' }, { name: 'Xóa nợ' }
  ]},
  { name: 'CollectionNotes', type: 'TEXT' },
  { name: 'SaleOwner', type: 'TEXT' },
]);
```

### `lib/accounts-payable.ts`
```typescript
const TABLE_ID_PROMISE = createTable('AccountsPayable', [
  { name: 'APCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'SupplierName', type: 'TEXT' },
  { name: 'InvoiceAmount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'PaidAmount', type: 'NUMBER' },
  { name: 'Remaining', type: 'NUMBER' },
  { name: 'DueDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mở' }, { name: 'Đã duyệt' }, { name: 'Đã lên lịch' },
    { name: 'TT một phần' }, { name: 'Đã TT' }
  ]},
  { name: 'VoucherId', type: 'TEXT' },
]);
```

### `lib/exchange-rates.ts`
```typescript
const TABLE_ID_PROMISE = createTable('ExchangeRates', [
  { name: 'Date', type: 'DATE' },
  { name: 'FromCurrency', type: 'SINGLE_OPTION', options: [
    { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'ToCurrency', type: 'SINGLE_OPTION', options: [{ name: 'VND' }] },
  { name: 'Rate', type: 'NUMBER' },
  { name: 'SetBy', type: 'TEXT' },
]);
```

## Anti-Fraud Validation (Client-Side)

```typescript
import { z } from "zod";

// Payment voucher creation schema
const paymentVoucherSchema = z.object({
  Type: z.string(),
  OrderId: z.string().min(1, "Bắt buộc gắn mã đơn hàng"),
  ExpenseType: z.string().min(1, "Chọn loại chi phí"),
  Amount: z.number().positive("Số tiền phải > 0"),
  Currency: z.string(),
  Beneficiary: z.string().min(1, "Nhập người thụ hưởng"),
  Reason: z.string().min(20, "Lý do phải ≥ 20 ký tự"),
  // Note: Attachment validation done separately (file upload)
});

// Flag detection (run after validation, before submit)
interface FlagResult {
  isFlagged: boolean;
  reasons: string[];
}

async function detectFlags(voucher: CreatePaymentVoucherInput, orderId: string): Promise<FlagResult> {
  const reasons: string[] = [];
  
  // Get order to compare
  const order = await getOrder(orderId);
  
  // Get all vouchers for this order
  const { data: existingVouchers } = await getPaymentVouchers({
    filters: { OrderId: orderId }
  });
  
  const totalExpenses = existingVouchers
    .filter(v => v.Type === 'Phiếu chi' && v.Status !== 'Từ chối')
    .reduce((sum, v) => sum + (v.Amount || 0), 0);
  
  // Rule 1: Total chi > 90% revenue
  if (order.TotalVND && (totalExpenses + voucher.Amount) > order.TotalVND * 0.9) {
    reasons.push('Tổng chi phí vượt 90% doanh thu đơn hàng');
  }
  
  // Rule 2: "Phát sinh" > 5M
  if (voucher.ExpenseType === 'Phát sinh' && voucher.Amount > 5_000_000) {
    reasons.push('Chi phí phát sinh > 5 triệu');
  }
  
  // Rule 3: Rapid small vouchers (>3 in 24h)
  const recentVouchers = existingVouchers.filter(v => {
    const created = new Date(v.createdAt || '');
    return (Date.now() - created.getTime()) < 24 * 60 * 60 * 1000;
  });
  if (recentVouchers.length > 3) {
    reasons.push('Phát hiện pattern nhiều phiếu chi nhỏ liên tiếp');
  }
  
  // Rule 4: Outside business hours
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 18) {
    reasons.push('Tạo ngoài giờ hành chính');
  }
  
  return { isFlagged: reasons.length > 0, reasons };
}
```

## AR Aging Dashboard

```typescript
// Aging bucket calculation (client-side since SDK only has equality filters)
function calculateAging(arRecords: AccountsReceivable[]) {
  const now = new Date();
  const buckets = {
    current: { count: 0, amount: 0 },    // Not due yet
    '1-15': { count: 0, amount: 0 },
    '16-30': { count: 0, amount: 0 },
    '31-60': { count: 0, amount: 0 },
    '60+': { count: 0, amount: 0 },
  };
  
  for (const ar of arRecords) {
    if (ar.Status === 'Đã thu' || ar.Status === 'Xóa nợ') continue;
    const due = new Date(ar.DueDate || '');
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const remaining = ar.Remaining || 0;
    
    if (daysOverdue <= 0) buckets.current.count++, buckets.current.amount += remaining;
    else if (daysOverdue <= 15) buckets['1-15'].count++, buckets['1-15'].amount += remaining;
    else if (daysOverdue <= 30) buckets['16-30'].count++, buckets['16-30'].amount += remaining;
    else if (daysOverdue <= 60) buckets['31-60'].count++, buckets['31-60'].amount += remaining;
    else buckets['60+'].count++, buckets['60+'].amount += remaining;
  }
  return buckets;
}

// Aging bar chart using recharts
<BarChart data={[
  { name: 'Trong hạn', amount: buckets.current.amount, fill: '#22c55e' },
  { name: '1-15 ngày', amount: buckets['1-15'].amount, fill: '#eab308' },
  { name: '16-30', amount: buckets['16-30'].amount, fill: '#f97316' },
  { name: '31-60', amount: buckets['31-60'].amount, fill: '#ef4444' },
  { name: '> 60', amount: buckets['60+'].amount, fill: '#991b1b' },
]}>
  <Bar dataKey="amount" />
</BarChart>
```

## Wallet Management UI

```tsx
// Customer wallet card
function WalletCard({ customer }: { customer: Customer }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Ví VND</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold">
            {new Intl.NumberFormat('vi-VN').format(customer.VNDBalance || 0)} ₫
          </span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Ví CNY</CardTitle>
        </CardHeader>
        <CardContent>
          <span className="text-2xl font-bold">
            ¥ {new Intl.NumberFormat('zh-CN').format(customer.CNYBalance || 0)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}

// Allocation form
// Sale allocates from wallet → KT approves each line
const allocationSchema = z.object({
  Type: z.string(),
  OrderId: z.string().optional(),
  Amount: z.number().positive(),
  Currency: z.string(),
}).refine((data) => {
  // Total allocation cannot exceed wallet balance
  return true; // Check against customer balance
}, { message: "Số tiền phân bổ vượt số dư ví" });
```

## Commission Calculation

```typescript
// After KT TH settles an order (COMPLETED status)
function calculateCommission(order: Order, vouchers: PaymentVoucher[]): {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  commission: number;
} {
  const revenue = order.TotalVND || 0;
  
  const costs = vouchers
    .filter(v => v.Type === 'Phiếu chi' && v.OrderId === order.id && v.Status === 'Đã chi')
    .reduce((sum, v) => {
      // Convert to VND if different currency
      const rate = v.ExchangeRate || order.ExchangeRate || 1;
      return sum + (v.Amount || 0) * (v.Currency === 'VND' ? 1 : rate);
    }, 0);
  
  const profit = revenue - costs;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const commissionRate = 0.15; // 10-20% configurable
  const commission = Math.max(0, profit * commissionRate);
  
  return { revenue, costs, profit, margin, commission };
}
```

## Exchange Rate Management (KT TH only)

```tsx
// Daily rate setting form
// Only KT TH can set rates, others can only view
async function setDailyRate(fromCurrency: string, rate: number) {
  const today = new Date().toISOString().split('T')[0];
  await createExchangeRate({
    Date: today,
    FromCurrency: fromCurrency,
    ToCurrency: 'VND',
    Rate: rate,
    SetBy: currentUser.name,
  });
}

// Get today's rate
async function getTodayRate(fromCurrency: string): Promise<number | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await getExchangeRates({ filters: { Date: today, FromCurrency: fromCurrency } });
  return data.length > 0 ? data[0].Rate || null : null;
}
```
