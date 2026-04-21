---
name: tbs-erp-domain
description: "TBS Group ERP domain knowledge for logistics & cross-border trade (China-Vietnam). ALWAYS read this skill first when working on ANY TBS ERP module. Use when creating Base tables, building App Builder apps, implementing business logic for: orders, quotations, leads/CRM, containers, warehouses (CN/VN), customs, delivery, payments, approval workflows, or any of the 35 TBS modules. Also trigger for Vietnamese logistics terminology, TBS-specific codes (DH-, BG-, KH-, CNT-), service types VCT/MHH/UTXNK/LCLCN, and any Inforact SDK data modeling for TBS."
---

# TBS ERP Domain Knowledge

> This skill provides business context. For code patterns, see the module-specific skills.
> All generated apps MUST follow Inforact App Builder conventions (see Section G).

## A. Company Overview

TBS Group — Logistics & Cross-border Trade, China → Vietnam.
~50 staff (target 70-100), revenue 288B VND (target 432B VND in 2026).
7 departments, 35 modules. ERP go-live: July-August 2026.

## B. Four Service Types (affects entire order flow)

| Code | Name | Description | Skips |
|------|------|-------------|-------|
| VCT | Vận chuyển thuần | Tiểu ngạch — customer buys, TBS ships only | Skip sourcing, container, customs |
| MHH | Mua hàng hộ | TBS sources, buys, and ships | Add sourcing + NCC payment stages |
| UTXNK | Ủy thác XNK | Chính ngạch — TBS files customs declaration | Needs labels, container, customs |
| LCLCN | LCL chính ngạch | Chính ngạch — customer's name on declaration | Needs full document set |

**Multi-select**: An order can combine types (e.g., MHH + LCLCN).

## C. 13-Stage Order Lifecycle

```
① Tiếp nhận → ② Báo giá → ③ Cọc → ④ Mua hàng*
→ ⑤ Nhập kho TQ → ⑥ Đóng gói → ⑦ Ghép container*
→ ⑧ Vận chuyển → ⑨ Thông quan* → ⑩ Nhập kho VN
→ ⑪ Giao hàng → ⑫ Quyết toán → ⑬ Hoàn thành
```

*Conditional: Stage 4 = MHH/UTXNK only; Stages 7,9 = UTXNK/LCLCN only; VCT skips 4,7,9.

**Status codes**: CONSULTING → QUOTATION → PENDING_DEPOSIT → SOURCING → ORDERED → PICKUP_SCHEDULED → WAREHOUSE_CN → IN_CONTAINER → IN_TRANSIT → AT_BORDER → CUSTOMS → WAREHOUSE_VN → DELIVERING → DELIVERED → SETTLEMENT → COMPLETED

**Special**: ON_HOLD, CANCELLED (from any state)

## D. Organization — 7 Departments

| Dept | Code | Key Roles | Headcount |
|------|------|-----------|-----------|
| Ban Giám đốc | BGĐ | CEO, COO, CFO | 2-3 |
| Kinh doanh | KD | GĐ KD (1) → Leader (many) → Sale (25→50) | 25-50 |
| Tiếp thị | MKT | NV MKT (3) + CSKH (1-2) | 4-5 |
| Kế toán | KT | KT TH + KT TT + KT CP | 3 |
| Xuất Nhập Khẩu | XNK | TP XNK + 2 NV | 3 |
| Kho Trung Quốc | KTQ | Agent (outsourced, Chinese) | External |
| Kho Việt Nam | KVN | Trưởng kho (HN+HCM) + NV kho + Drivers | 6-8 |

### Data Visibility Rules
- **Sale**: Only own orders/customers
- **Leader**: Team orders (3-5 Sales)
- **GĐ KD**: All orders, both branches
- **BGĐ**: Everything

> ⚠️ **App Builder limitation**: Generated apps use token-based auth without user identity.
> Data isolation must be implemented via: (1) filter params passed from Base UI,
> (2) separate apps per role, or (3) query-based views with pre-filtered data.

## E. Approval Matrix

### Discount Approval
| Discount | Flow | SLA |
|----------|------|-----|
| 0% (standard) | No approval | — |
| ≤3% | Leader + KT TT co-approve | 2h each |
| 3-5% | Leader + KT TT → GĐ KD | 4h |
| >5% or order >100M | Leader + KT TT → GĐ KD → BGĐ | 4-8h |

### Order Cancellation
| Stage | Flow |
|-------|------|
| No deposit | Leader approves |
| Has deposit, no purchase | Leader → GĐ KD |
| Purchased | GĐ KD → BGĐ |
| Shipped (stage 7+) | BGĐ case-by-case |

### Payment Voucher
| Amount | Flow |
|--------|------|
| ≤50M | KT TT → BGĐ |
| >50M | KT TT → KT TH → BGĐ |

## F. Anti-Fraud Rules (Payment Vouchers)

**BLOCK** (cannot submit):
- Missing order link
- Order already closed
- Missing attachments
- Reason < 20 characters
- Creator ≠ order's sale owner

**FLAG** (submit but alert Leader + KT TT):
- Total expenses > 90% of order revenue
- "Phát sinh" type > 5M VND
- Pattern of rapid small vouchers
- Supplier not in approved list
- Created outside business hours (before 8:00 / after 17:30)

## G. App Builder Conventions (CRITICAL)

All TBS ERP apps MUST follow these Inforact App Builder patterns:

### Entity-per-file Pattern
```
lib/orders.ts          → getOrders, getOrder, createOrder, updateOrder, deleteOrder
lib/customers.ts       → getCustomers, getCustomer, createCustomer, ...
lib/payment-vouchers.ts → getPaymentVouchers, getPaymentVoucher, createPaymentVoucher, ...
```

### SDK Constraints
- **Filtering**: Equality only (`filters: { Status: 'PENDING' }`). No range/contains/GT/LT.
- **Pagination**: Max 200 records per request. Must implement client-side pagination.
- **Field types**: Use TEXT for email/phone/URL/currency. Use SINGLE_OPTION for status fields.
  Valid types: TEXT, NUMBER, DATE, SINGLE_OPTION, MULTIPLE_OPTIONS, CHECKBOX, LINK, ATTACHMENT, IMAGE.
- **Read-only fields**: FORMULA, LOOKUP, CREATED_AT, UPDATED_AT, AUTO_NUMBER — auto-skipped on writes.
- **"use server"**: All lib files must have `"use server"` directive.

### Table Naming for TBS
```
Leads, Customers, Quotations, QuotationItems, Orders, OrderItems,
OrderHistory, Contracts, WarehouseCnReceipts, Containers, ContainerItems,
WarehouseVnReceipts, DeliveryOrders, WalletTransactions, PaymentVouchers,
AccountsReceivable, AccountsPayable, Suppliers, Approvals, QualityIssues,
ExchangeRates, Users
```

### Available Libraries (pre-installed)
shadcn/ui, lucide-react, recharts, date-fns, @tanstack/react-table,
react-hook-form + zod, zustand, sonner, framer-motion, lodash

### Workarounds for SDK Limitations

**Complex filtering** (e.g., AR aging, date ranges):
```typescript
// Fetch all, filter client-side
const { data } = await getAccountsReceivable();
const overdue = data.filter(ar => 
  ar.DueDate && new Date(ar.DueDate) < new Date()
);
```

**Aggregations** (totals, counts by status):
```typescript
// Use Base Queries (read-only) for pre-aggregated data
// Connect a query in App Builder settings, import from lib/
import { getSalesSummary } from "@/lib/sales-summary";
```

**Cross-table joins**:
```typescript
// Fetch both, join client-side
const [orders, customers] = await Promise.all([
  getOrders(), getCustomers()
]);
const enriched = orders.data.map(o => ({
  ...o,
  customer: customers.data.find(c => c.id === o.CustomerId)
}));
```

## H. Multi-Currency

- Currencies: CNY, USD, VND
- KT TH sets daily exchange rate
- Rate is locked per order at creation time
- Sale can see rate but CANNOT modify

## I. Wallet System

Each customer has: VND wallet + CNY wallet + unique QR code.
- **Top-up**: ONLY KT (accountant) can confirm deposits
- **Allocation**: Sale configures (deposit for order A, pay debt for order B, convert to CNY) → KT approves each
- **Separation**: Sale sells, KT manages money — never mixed

## J. Lead → Customer Conversion

Lead ≠ Customer. Only after quotation is finalized:
1. Sale clicks [Convert to Customer]
2. System creates: customer_code + QR + VND wallet + CNY wallet
3. Lead status → "Converted"
4. Quotation links to new customer record

## K. SLA Targets

| Action | SLA | Escalate to |
|--------|-----|-------------|
| CSKH responds to data | 15 min | GĐ KD |
| Sale contacts lead | 2 hours | Leader |
| Send quotation | 4 hours | Leader |
| Approval response | 2 hours | Auto-escalate 24h |
| Warehouse CN receives | 24 hours | Sale |
| Delivery | 3 days | Trưởng kho + Sale |

## L. Code Conventions

### Entity Codes
- Order: `DH-[YYMMDD]-[SEQ]`
- Quotation: `BG-[YYMMDD]-[SEQ]`
- Customer: `KH-[SEQ]`
- Container: `CNT-[YYMMDD]-[SEQ]`
- Payment voucher: `PT/PC-[YYMMDD]-[SEQ]`
- Contract: `HD-[YYMMDD]-[SEQ]`

### Status Field Convention
Always use SINGLE_OPTION type with Vietnamese option names matching the domain.
Example for Orders:
```
options: [
  { name: 'Nháp' }, { name: 'Chờ duyệt' }, { name: 'Đã xác nhận' },
  { name: 'Đang tìm hàng' }, { name: 'Đã đặt hàng' },
  { name: 'Tại kho TQ' }, { name: 'Trong container' },
  { name: 'Đang vận chuyển' }, { name: 'Tại cửa khẩu' },
  { name: 'Đang thông quan' }, { name: 'Tại kho VN' },
  { name: 'Đang giao' }, { name: 'Đã giao' }, { name: 'Hoàn thành' },
  { name: 'Đã hủy' }, { name: 'Tạm giữ' }
]
```
