Create a dashboard for TBS ERP on Inforact App Builder.

Read tbs-erp-domain/SKILL.md for business context and KPIs.

Dashboard for: $ARGUMENTS

Implementation:
1. Fetch data from multiple lib files using Promise.all
2. Calculate aggregations client-side (SDK only supports equality filters)
3. Use recharts for charts (BarChart, LineChart, PieChart)
4. Use shadcn/ui Card components for KPI cards
5. Color code alerts (green=good, yellow=warning, red=critical)
6. Show loading skeleton while data loads

Key dashboard types:
- **Sale**: Revenue progress, order pipeline, AR alerts, today's tasks
- **Leader**: Team performance comparison, pending approvals count, SLA violations
- **GĐ KD**: Revenue by branch, pipeline forecast, top customers, AR > 15 days
- **KT TT**: Pending vouchers queue, AR aging chart, cash flow summary
- **Trưởng kho**: Today's deliveries, inventory by status, COD pending
- **BGĐ**: Executive KPIs, revenue/profit trends, critical alerts

Remember: Pagination is max 200 records. For large datasets, use Base Queries (read-only) connected via App Builder settings.