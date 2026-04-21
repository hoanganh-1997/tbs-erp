---
name: tbs-ui-patterns
description: "UI design patterns and component conventions for TBS ERP, extracted from actual ERP screenshots. ALWAYS read this skill when building any TBS ERP page or component on App Builder. Use for: page layouts, list views, detail views, form patterns, status badges, color scheme, sidebar navigation, filter bars, empty states, action buttons, dashboard cards, and data table styling. This ensures all generated apps visually match the existing TBS ERP design language."
---

# TBS ERP — UI Design Patterns

> Extracted from 20 production ERP screenshots. All App Builder apps MUST match these patterns.

## A. Color System

### Primary Palette
```css
--tbs-primary: #2D3A8C;        /* Deep blue — headings, sidebar active, primary buttons */
--tbs-primary-light: #4F5FD9;  /* Blue — links, clickable codes */
--tbs-primary-bg: #EEF0FF;     /* Light blue — active sidebar item bg, tab active bg */
--tbs-bg: #FFFFFF;              /* White — content background */
--tbs-sidebar-bg: #F8F9FC;     /* Very light gray — sidebar background */
--tbs-border: #E5E7EB;         /* Gray — table borders, card borders */
--tbs-text: #1F2937;           /* Dark gray — body text */
--tbs-text-muted: #6B7280;     /* Medium gray — descriptions, labels */
```

### Status Badge Colors
```typescript
const statusStyles = {
  // Green family — positive/completed
  'Hoàn thành': 'bg-green-100 text-green-700 border-green-200',
  'Đã duyệt': 'bg-green-100 text-green-700',
  'Đã thu': 'bg-green-100 text-green-700',
  'Đã trả': 'bg-green-100 text-green-700',
  'Đã giao': 'bg-green-100 text-green-700',
  'Đã ký': 'bg-green-100 text-green-700',
  'Hoạt động': 'bg-green-100 text-green-700',
  'Đang làm': 'bg-green-100 text-green-700',

  // Blue family — in progress
  'Đang xử lý': 'bg-blue-100 text-blue-700',
  'Đang giao': 'bg-blue-100 text-blue-700',
  'Đang vận chuyển': 'bg-blue-100 text-blue-700',
  'Đang xếp': 'bg-blue-100 text-blue-700',

  // Yellow/Orange family — warning/pending
  'Chờ duyệt': 'bg-yellow-100 text-yellow-700',
  'Chưa thu': 'bg-yellow-100 text-yellow-700',
  'Chưa trả': 'bg-yellow-100 text-yellow-700',
  'Kế hoạch': 'bg-yellow-100 text-yellow-700',
  'Nháp': 'bg-gray-100 text-gray-600',

  // Orange family — partial
  'Thu một phần': 'bg-orange-100 text-orange-700',
  'Trả một phần': 'bg-orange-100 text-orange-700',

  // Red family — cancelled/negative
  'Đã hủy': 'bg-red-100 text-red-700',
  'Quá hạn': 'bg-red-100 text-red-700',
  'Từ chối': 'bg-red-100 text-red-700',
  'Tạm giữ': 'bg-red-50 text-red-600',
};

// Badge component
function StatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", style)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
```

### Customer Tier Badge Colors
```typescript
const tierStyles = {
  'VIP': 'bg-orange-100 text-orange-700 border-orange-200',
  'Khách thường': 'bg-blue-100 text-blue-700',
  'Khách mới': 'bg-gray-100 text-gray-600',
  'Active': 'bg-green-100 text-green-700',
  'Inactive': 'bg-gray-100 text-gray-500',
  'Blacklist': 'bg-red-100 text-red-700',
};
```

## B. Page Layout Pattern

Every TBS ERP page follows this exact structure:

```tsx
export default function ModulePage() {
  return (
    <div className="space-y-6">
      {/* Header: Title + Description + Action Button */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#2D3A8C]">Module Name</h1>
          <p className="text-muted-foreground mt-1">Mô tả ngắn module</p>
        </div>
        <Button className="bg-[#4F5FD9] hover:bg-[#3B4CC0] text-white rounded-full px-6">
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        <Button variant={active === 'all' ? 'default' : 'ghost'} size="sm"
          className={active === 'all' ? 'bg-[#4F5FD9] text-white rounded-full' : 'rounded-full'}>
          Tất cả
        </Button>
        <Button variant="ghost" size="sm" className="rounded-full">Nháp</Button>
        <Button variant="ghost" size="sm" className="rounded-full">Đang xử lý</Button>
        <Button variant="ghost" size="sm" className="rounded-full">Hoàn thành</Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm theo mã, tên..." className="pl-10" />
        </div>
        <Select><SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter 1" /></SelectTrigger>...</Select>
        <Select><SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter 2" /></SelectTrigger>...</Select>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Column</TableHead>
              ...
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns} className="text-center py-12 text-muted-foreground">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map(row => <TableRow key={row.id}>...</TableRow>)
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Count */}
      <div className="text-sm text-[#4F5FD9] font-medium">{total}</div>
    </div>
  );
}
```

## C. Dashboard Pattern (Screenshot 1)

```tsx
// Dashboard layout: Greeting + Time filter tabs + KPI Cards + Charts + Recent list

// Time filter tabs
<div className="flex gap-2">
  {['Hôm nay', 'Tuần', 'Tháng', 'Quý', 'Năm'].map(period => (
    <Button key={period} variant={active === period ? 'default' : 'outline'} size="sm">
      {period}
    </Button>
  ))}
</div>

// KPI Cards row (4 cards)
<div className="grid grid-cols-4 gap-4">
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground uppercase tracking-wide">Tổng đơn hàng</span>
        <ShoppingCart className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="mt-3">
        <span className="text-3xl font-bold">5</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">0 đơn mới hôm nay</p>
    </CardContent>
  </Card>
  ...
</div>

// Charts row (2 columns)
<div className="grid grid-cols-2 gap-4">
  <Card><CardHeader><CardTitle>Biểu đồ doanh thu</CardTitle></CardHeader>...</Card>
  <Card><CardHeader><CardTitle>Đơn hàng theo trạng thái</CardTitle></CardHeader>
    {/* Donut/Pie chart using recharts PieChart */}
  </Card>
</div>

// Recent orders table
<Card>
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Đơn hàng gần đây</CardTitle>
    <Button variant="link" className="text-[#4F5FD9]">Xem tất cả</Button>
  </CardHeader>
  <CardContent>
    <Table>...</Table>
  </CardContent>
</Card>
```

## D. Order List Pattern (Screenshot 3)

Key differences from basic list:
- **Expandable rows**: Chevron icon to expand "Đơn con" (sub-orders)
- **Customer column**: Name + Company on two lines
- **Status column**: Colored badge with dot
- **Action icons**: Eye (view), Tag, Print per row (right side)
- **Filters**: Chi nhánh dropdown + NV Sale dropdown + Date range (dd/mm/yyyy)

```tsx
// Order row with expand
<TableRow className="hover:bg-gray-50 cursor-pointer">
  <TableCell>
    <Button variant="ghost" size="icon" onClick={() => toggleExpand(order.id)}>
      <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
    </Button>
  </TableCell>
  <TableCell>
    <span className="text-[#4F5FD9] font-medium">{order.OrderCode}</span>
  </TableCell>
  <TableCell>
    <div>
      <span className="font-medium">{order.CustomerName}</span>
      <span className="block text-xs text-muted-foreground">{order.CompanyName}</span>
    </div>
  </TableCell>
  <TableCell>{order.Branch}</TableCell>
  <TableCell><StatusBadge status={order.Status} /></TableCell>
  <TableCell className="text-center">{order.SubOrderCount}</TableCell>
  <TableCell className="text-xs text-muted-foreground">{order.SaleOwner}</TableCell>
  <TableCell className="text-xs">{formatDate(order.createdAt)}</TableCell>
  <TableCell>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon"><Tag className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon"><Printer className="w-4 h-4" /></Button>
    </div>
  </TableCell>
</TableRow>
```

## E. Warehouse Pattern (Screenshots 7, 11)

Key: Scan-first UI with prominent search bar at top.

```tsx
// Warehouse scan input (prominent, full-width)
<Card className="p-6">
  <div className="flex gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        placeholder="Quét mã vận đơn (Enter để tra cứu)"
        className="pl-12 h-12 text-lg"
        onKeyDown={(e) => e.key === 'Enter' && handleScan()}
      />
    </div>
    <Button size="lg" className="bg-[#4F5FD9] px-6">Tra cứu</Button>
  </div>
</Card>
```

## F. Container Quick Actions (Screenshot 8)

Inline action buttons per row — contextual by status:

```tsx
// Container row actions
<TableCell>
  <div className="flex gap-2">
    {container.Status === 'Kế hoạch' && (
      <Button variant="outline" size="sm" className="text-xs">
        <ArrowRight className="w-3 h-3 mr-1" /> Đang xếp
      </Button>
    )}
    {container.Status === 'Đang xếp' && (
      <Button variant="outline" size="sm" className="text-xs">
        <ArrowRight className="w-3 h-3 mr-1" /> Vận chuyển
      </Button>
    )}
    <Button variant="outline" size="sm" className="text-xs">
      <Package className="w-3 h-3 mr-1" /> Thêm kiện
    </Button>
  </div>
</TableCell>
```

## G. Commission/Hoa hồng Pattern (Screenshot 16)

Summary cards at top + detailed table below:

```tsx
// Summary cards row
<div className="grid grid-cols-3 gap-4">
  <Card className="border-l-4 border-l-orange-400">
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">Tổng chờ duyệt</p>
      <p className="text-2xl font-bold mt-1">{formatCurrency(pendingTotal)}</p>
    </CardContent>
  </Card>
  <Card className="border-l-4 border-l-green-500">
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">Tổng đã duyệt</p>
      <p className="text-2xl font-bold mt-1">{formatCurrency(approvedTotal)}</p>
    </CardContent>
  </Card>
  <Card className="border-l-4 border-l-blue-500">
    <CardContent className="p-4">
      <p className="text-sm text-muted-foreground">Tổng đã trả</p>
      <p className="text-2xl font-bold mt-1">{formatCurrency(paidTotal)}</p>
    </CardContent>
  </Card>
</div>

// Commission table columns:
// Đơn hàng | NV Sale | Loại HH | Doanh thu | Chi phí | Lợi nhuận | Tỷ lệ | Số tiền HH | Trạng thái | Ngày tạo | Thao tác
```

## H. Task/Công việc Pattern (Screenshot 17)

Quick filter tags + tabs:

```tsx
// Tabs: Tất cả | Của tôi | Quá hạn
// Quick department filter chips
<div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
  <span className="text-sm font-medium text-muted-foreground">Lọc nhanh theo phòng ban</span>
  {['Sale', 'Kho', 'KT', 'XNK'].map(dept => (
    <Button key={dept} variant="outline" size="sm" className="rounded-full h-7 text-xs">
      {dept}
    </Button>
  ))}
</div>
```

## I. Settings/Detail Pattern (Screenshot 20)

Card sections with label-value pairs:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-lg text-[#2D3A8C]">Thông tin cá nhân</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground text-sm">Họ tên</span>
      <span className="font-medium">Tổng Giám đốc</span>
    </div>
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground text-sm">Email</span>
      <span className="font-medium">ceo@nhaphangchinhngach.vn</span>
    </div>
    ...
  </CardContent>
</Card>
```

## J. Common Utilities

```typescript
// Currency formatter
function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'CNY') return `¥ ${new Intl.NumberFormat('zh-CN').format(amount)}`;
  if (currency === 'USD') return `$ ${new Intl.NumberFormat('en-US').format(amount)}`;
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

// Date formatter
function formatDate(dateStr: string): string {
  if (!dateStr) return '---';
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm');
}

// Code link (clickable, blue)
function CodeLink({ code, href }: { code: string; href: string }) {
  return <a href={href} className="text-[#4F5FD9] font-medium hover:underline">{code}</a>;
}
```

## K. Responsive Notes

- Tables should use `overflow-x-auto` wrapper on mobile
- Sidebar is collapsible (chevron at bottom)
- Action buttons stack vertically on small screens
- Dashboard cards: 4 cols → 2 cols on tablet → 1 col on mobile
