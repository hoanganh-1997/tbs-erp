# Client-side Exploratory Test Round 2

2026-04-21T09:08:46.936Z

## I1 — "Failed to load orders" investigation
- Row count: 20, empty/retry text: ""
- Console msgs (2):
  [error] Failed to load resource: the server responded with a status of 404 (Not Found)
  [error] Warning: Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.%s 

Check the rende
- Reload 1: rows=20, hasFailToLoad=false
- Reload 2: rows=20, hasFailToLoad=false

## I2 — /orders/[id]/edit SSR time (BUG-EXP-004 followup)
- First order URL: null

## I3 — Delete / destructive actions

- /customers investigation:
- rows=17, action-buttons in rows=0

## I4 — /orders/new — field inventory
- Required markers: 0
- Text inputs: 6, textareas: 2, selects/combobox: 2, number: 0, date: 1, radio: 0, checkbox: 4
- Sample labels: ["Mã đơn hàng","Chi nhánh *","Loại dịch vụ *","VCT","MHH","UTXNK","LCLCN","Ưu tiên","Khách hàng *","Tên khách hàng"]
- Inline error elements after empty submit: 14, samples=["*","-- Chọn chi nhánh --HNHCM","Vui lòng chọn chi nhánh","*","Vui lòng chọn ít nhất 1 loại dịch vụ"]

## I5 — Coming-soon routes toast/link behavior
- Stub has "Về Tổng quan" link: true

## I6 — Accounts Receivable / Payable — check AutoInitProvider failure?
- AR rows=10, console (1):
  [error] Warning: Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.%s 

Check the rende

## I7 — /quotations/new — field inventory
- /quotations/new labels(23): ["Mã báo giá","Chi nhánh","Sale phụ trách","Loại dịch vụ","VCT (Vận chuyển thuần)","MHH (Mua hàng hộ)","UTXNK (Ủy thác XNK)","LCLCN (LCL chính ngạch)"], submitBtn=true

Done Round 2.
