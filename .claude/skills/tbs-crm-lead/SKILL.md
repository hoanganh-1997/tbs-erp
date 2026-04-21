---
name: tbs-crm-lead
description: "Build guide for TBS CRM and Lead Management on Inforact App Builder. Use when creating lead intake forms, lead pipeline/kanban views, customer profiles, customer wallet/QR display, lead-to-customer conversion, lead assignment, CSKH workflow, or any CRM UI. Also trigger for: lead scoring (Nóng/Ấm/Lạnh/Xấu), customer tiers (Active/VIP/Inactive/Blacklist), credit limits, customer 360 views, and lead activity logs. Covers lib/leads.ts, lib/lead-activities.ts, lib/customers.ts."
---

# TBS CRM & Lead Management — App Builder Guide

## Table Definitions

### `lib/leads.ts`
```typescript
const TABLE_ID_PROMISE = createTable('Leads', [
  { name: 'LeadCode', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'FullName', type: 'TEXT' },
  { name: 'Source', type: 'SINGLE_OPTION', options: [
    { name: 'Facebook' }, { name: 'TikTok' }, { name: 'Website' },
    { name: 'Zalo' }, { name: 'Giới thiệu' }, { name: 'Khác' }
  ]},
  { name: 'Rating', type: 'SINGLE_OPTION', options: [
    { name: 'Nóng' }, { name: 'Ấm' }, { name: 'Lạnh' }, { name: 'Xấu' }
  ]},
  { name: 'Needs', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mới' }, { name: 'Đang khai thác' }, { name: 'Đã giao Sale' },
    { name: 'Đang tư vấn' }, { name: 'Đã báo giá' },
    { name: 'Thành KH' }, { name: 'Thất bại' }
  ]},
  { name: 'MarketingOwner', type: 'TEXT' },
  { name: 'CSKHOwner', type: 'TEXT' },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'FailureReason', type: 'TEXT' },
  { name: 'ConvertedCustomerId', type: 'TEXT' },
]);
```

### `lib/lead-activities.ts`
```typescript
const TABLE_ID_PROMISE = createTable('LeadActivities', [
  { name: 'LeadId', type: 'TEXT' },
  { name: 'ActivityType', type: 'SINGLE_OPTION', options: [
    { name: 'Gọi điện' }, { name: 'Zalo' }, { name: 'Email' },
    { name: 'Gặp mặt' }, { name: 'Ghi chú' }
  ]},
  { name: 'Content', type: 'TEXT' },
  { name: 'Result', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
]);
```

### `lib/customers.ts`
```typescript
const TABLE_ID_PROMISE = createTable('Customers', [
  { name: 'CustomerCode', type: 'TEXT' },
  { name: 'CompanyName', type: 'TEXT' },
  { name: 'ContactName', type: 'TEXT' },
  { name: 'Phone', type: 'TEXT' },
  { name: 'Email', type: 'TEXT' },
  { name: 'Address', type: 'TEXT' },
  { name: 'DeliveryAddress', type: 'TEXT' },
  { name: 'ReceiverName', type: 'TEXT' },
  { name: 'ReceiverPhone', type: 'TEXT' },
  { name: 'TaxCode', type: 'TEXT' },
  { name: 'Tier', type: 'SINGLE_OPTION', options: [
    { name: 'Prospect' }, { name: 'Active' }, { name: 'VIP' },
    { name: 'Inactive' }, { name: 'Blacklist' }
  ]},
  { name: 'DepositRate', type: 'NUMBER' },
  { name: 'CreditLimit', type: 'NUMBER' },
  { name: 'VNDBalance', type: 'NUMBER' },
  { name: 'CNYBalance', type: 'NUMBER' },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'LeaderName', type: 'TEXT' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'HasXNKLicense', type: 'CHECKBOX' },
  { name: 'SourceLeadId', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
]);
```

## Lead Pipeline (Kanban)

```tsx
// Kanban columns matching lead status flow
const pipelineColumns = [
  { id: 'Mới', label: 'Mới', color: 'bg-blue-50' },
  { id: 'Đang khai thác', label: 'Đang khai thác', color: 'bg-yellow-50' },
  { id: 'Đã giao Sale', label: 'Đã giao Sale', color: 'bg-orange-50' },
  { id: 'Đang tư vấn', label: 'Đang tư vấn', color: 'bg-purple-50' },
  { id: 'Đã báo giá', label: 'Đã báo giá', color: 'bg-indigo-50' },
];

// Fetch all leads, group client-side (SDK only has equality filters)
async function getPipelineData() {
  const { data: leads } = await getLeads({ take: 200, sortField: 'createdAt', sortDirection: 'desc' });
  return pipelineColumns.map(col => ({
    ...col,
    leads: leads.filter(l => l.Status === col.id),
    count: leads.filter(l => l.Status === col.id).length,
  }));
}
```

### Lead Card (in kanban)

```tsx
function LeadCard({ lead }: { lead: Lead }) {
  const ratingColors = {
    'Nóng': 'bg-red-500', 'Ấm': 'bg-orange-400',
    'Lạnh': 'bg-blue-400', 'Xấu': 'bg-gray-400',
  };
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <span className="font-medium text-sm">{lead.FullName}</span>
          {lead.Rating && (
            <span className={cn("w-2 h-2 rounded-full", ratingColors[lead.Rating])} />
          )}
        </div>
        <div className="text-xs text-muted-foreground">{lead.Phone}</div>
        <div className="flex gap-1">
          <Badge variant="outline" className="text-[10px]">{lead.Source}</Badge>
          {lead.SaleOwner && <Badge variant="secondary" className="text-[10px]">{lead.SaleOwner}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Lead Actions

```tsx
// Action buttons on lead detail page
function LeadActions({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => openActivityDialog(lead.id)}>
        <Phone className="w-4 h-4 mr-1" /> Thêm nhật ký
      </Button>
      
      {lead.Status === 'Đang khai thác' && (
        <Button size="sm" onClick={() => openAssignDialog(lead.id)}>
          <UserPlus className="w-4 h-4 mr-1" /> Chuyển cho Sale
        </Button>
      )}
      
      {['Đang tư vấn', 'Đã giao Sale'].includes(lead.Status || '') && (
        <Button size="sm" onClick={() => router.push(`/quotations/new?leadId=${lead.id}`)}>
          <FileText className="w-4 h-4 mr-1" /> Tạo báo giá
        </Button>
      )}
      
      {lead.Status === 'Đã báo giá' && (
        <Button size="sm" variant="default" onClick={() => convertToCustomer(lead)}>
          <UserCheck className="w-4 h-4 mr-1" /> Chuyển thành KH
        </Button>
      )}
      
      <Button size="sm" variant="destructive" onClick={() => markFailed(lead.id)}>
        <X className="w-4 h-4 mr-1" /> Thất bại
      </Button>
    </div>
  );
}
```

## Lead → Customer Conversion

```typescript
async function convertToCustomer(lead: Lead): Promise<Customer> {
  // 1. Check: has finalized quotation?
  const { data: quotes } = await getQuotations({ filters: { LeadId: lead.id } });
  const finalQuote = quotes.find(q => q.IsFinal);
  if (!finalQuote) {
    toast.error("Cần có báo giá đã chốt trước khi chuyển đổi");
    throw new Error("No finalized quotation");
  }
  
  // 2. Check: phone/email already exists in customers?
  const { data: existing } = await getCustomers({ filters: { Phone: lead.Phone || '' } });
  if (existing.length > 0) {
    // Show dialog: "KH đã tồn tại — chọn KH cũ hay tạo mới?"
    // If choose existing, just link
    return existing[0];
  }
  
  // 3. Create customer
  const customerCode = `KH-${String(Date.now()).slice(-6)}`;
  const customer = await createCustomer({
    CustomerCode: customerCode,
    ContactName: lead.FullName || '',
    Phone: lead.Phone || '',
    Tier: 'Active',
    DepositRate: 50, // New customer default 50%
    VNDBalance: 0,
    CNYBalance: 0,
    SaleOwner: lead.SaleOwner || '',
    LeaderName: lead.LeaderName || '',
    Branch: lead.Branch || '',
    SourceLeadId: lead.id,
  });
  
  // 4. Update lead status
  await updateLead(lead.id, {
    Status: 'Thành KH',
    ConvertedCustomerId: customer.id,
  });
  
  // 5. Link quotation to customer
  await updateQuotation(finalQuote.id, { CustomerId: customer.id });
  
  toast.success(`Đã tạo khách hàng ${customerCode}`);
  return customer;
}
```

## Customer 360 View

```tsx
// Customer detail page with tabs
// Tab 1: Overview — tier, wallet, key metrics
// Tab 2: Orders — linked orders list
// Tab 3: Finance — wallet transactions, AR
// Tab 4: Quotations & Contracts
// Tab 5: Issues — quality issues
// Tab 6: Activity log

async function getCustomer360(customerId: string) {
  const [customer, orders, ar, walletTx, quotes] = await Promise.all([
    getCustomer(customerId),
    getOrders({ filters: { CustomerId: customerId } }),
    getAccountsReceivable({ filters: { CustomerId: customerId } }),
    getWalletTransactions({ filters: { CustomerId: customerId } }),
    getQuotations({ filters: { CustomerId: customerId } }),
  ]);
  
  const totalRevenue = orders.data.reduce((sum, o) => sum + (o.TotalVND || 0), 0);
  const totalOrders = orders.total;
  const overdueAR = ar.data.filter(a => a.Status === 'Quá hạn');
  
  return { customer, orders, ar, walletTx, quotes, totalRevenue, totalOrders, overdueAR };
}
```

### Customer Tier Auto-calculation

```typescript
// Check and update tier based on rules
async function checkTierUpgrade(customerId: string) {
  const { data: orders } = await getOrders({ filters: { CustomerId: customerId } });
  const completedOrders = orders.filter(o => o.Status === 'Hoàn thành');
  const yearlyRevenue = completedOrders
    .filter(o => new Date(o.createdAt || '') > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
    .reduce((sum, o) => sum + (o.TotalVND || 0), 0);
  
  const customer = await getCustomer(customerId);
  let newTier = customer.Tier;
  
  if (yearlyRevenue >= 500_000_000) newTier = 'VIP';
  else if (completedOrders.length > 0) newTier = 'Active';
  
  // Check inactive: no order in 6 months
  const lastOrder = completedOrders.sort((a, b) =>
    new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
  )[0];
  if (lastOrder) {
    const monthsSinceLastOrder = (Date.now() - new Date(lastOrder.createdAt || '').getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSinceLastOrder > 6) newTier = 'Inactive';
  }
  
  if (newTier !== customer.Tier) {
    await updateCustomer(customerId, { Tier: newTier });
  }
}
```

### Credit Hold Logic

```typescript
// Check before allowing new order creation
async function checkCreditHold(customerId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { data: arRecords } = await getAccountsReceivable({
    filters: { CustomerId: customerId }
  });
  
  const overdueOver30 = arRecords.some(ar => {
    if (ar.Status === 'Đã thu' || ar.Status === 'Xóa nợ') return false;
    const dueDate = new Date(ar.DueDate || '');
    const daysOverdue = (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysOverdue > 30;
  });
  
  if (overdueOver30) {
    return { allowed: false, reason: 'Công nợ quá hạn > 30 ngày. Cần thanh toán trước khi tạo đơn mới.' };
  }
  
  return { allowed: true };
}
```
