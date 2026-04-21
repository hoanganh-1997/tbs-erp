# TBS ERP — Full Project Generation Prompt for Claude Code CLI

> Copy this entire file content and paste it into Claude Code CLI.
> Claude Code has persistent context (CLAUDE.md + skills) and can generate the full project iteratively.

---

## Instructions

I need you to generate a complete TBS ERP application that can be imported into Inforact App Builder.

### Project Context

Read these files first:
- `CLAUDE.md` — Project overview and rules
- `tbs-erp-domain/SKILL.md` — Business domain knowledge
- `tbs-ui-patterns/SKILL.md` — UI design patterns from ERP screenshots
- `tbs-order-management/SKILL.md` — Order module specifics
- `tbs-warehouse-logistics/SKILL.md` — Warehouse + logistics
- `tbs-finance/SKILL.md` — Finance modules
- `tbs-crm-lead/SKILL.md` — CRM + Lead management
- `tbs-approval-workflow/SKILL.md` — Approval workflows

### Architecture

Single Next.js app with client-side routing using a sidebar navigation layout.
All data operations use Inforact SDK via `lib/{entity}.ts` files with `createTable()` pattern.

### File Structure to Generate

```
tbs-erp/
├── lib/
│   ├── utils.ts                    # cn(), formatCurrency(), formatDate(), generateCode()
│   ├── leads.ts                    # createTable + CRUD
│   ├── lead-activities.ts
│   ├── customers.ts
│   ├── quotations.ts
│   ├── quotation-items.ts
│   ├── orders.ts
│   ├── order-items.ts
│   ├── order-history.ts
│   ├── contracts.ts
│   ├── warehouse-cn-receipts.ts
│   ├── containers.ts
│   ├── container-items.ts
│   ├── warehouse-vn-receipts.ts
│   ├── delivery-orders.ts
│   ├── payment-vouchers.ts
│   ├── wallet-transactions.ts
│   ├── accounts-receivable.ts
│   ├── accounts-payable.ts
│   ├── suppliers.ts
│   ├── approvals.ts
│   ├── quality-issues.ts
│   ├── exchange-rates.ts
│   └── employees.ts
├── components/
│   ├── sidebar.tsx                 # Main navigation sidebar matching TBS ERP screenshots
│   ├── status-badge.tsx            # Reusable status badge with color mapping
│   ├── page-header.tsx             # Title + description + action button
│   ├── data-table.tsx              # Reusable table with search, filters, pagination
│   ├── kpi-card.tsx                # Dashboard KPI card
│   ├── empty-state.tsx             # "Không có dữ liệu"
│   └── ui/                         # shadcn/ui components (generated as needed)
├── app/
│   ├── globals.css
│   ├── layout.tsx                  # Root layout with sidebar
│   ├── page.tsx                    # Dashboard (Tổng quan)
│   ├── leads/
│   │   ├── page.tsx                # Lead list with pipeline tabs
│   │   └── [id]/page.tsx           # Lead detail
│   ├── orders/
│   │   ├── page.tsx                # Order list with status tabs + expandable rows
│   │   ├── new/page.tsx            # Create order form
│   │   └── [id]/page.tsx           # Order detail with tabs (overview, items, finance, logistics, history)
│   ├── quotations/
│   │   ├── page.tsx
│   │   └── new/page.tsx
│   ├── contracts/
│   │   └── page.tsx
│   ├── customers/
│   │   ├── page.tsx                # Customer list with tier badges
│   │   └── [id]/page.tsx           # Customer 360 view
│   ├── warehouse-cn/
│   │   └── page.tsx                # Warehouse TQ with scan input
│   ├── containers/
│   │   └── page.tsx                # Container list with fill rate + inline actions
│   ├── customs/
│   │   └── page.tsx                # Customs declaration list
│   ├── tracking/
│   │   └── page.tsx                # Tracking search (by package + by container)
│   ├── warehouse-vn/
│   │   └── page.tsx                # Warehouse VN with scan input
│   ├── delivery/
│   │   └── page.tsx                # Delivery dispatch board
│   ├── accounts-receivable/
│   │   └── page.tsx                # AR list with aging colors + "Thu tiền" action
│   ├── accounts-payable/
│   │   └── page.tsx                # AP list
│   ├── payment-vouchers/
│   │   ├── page.tsx                # Voucher list (Phiếu thu + Phiếu chi tabs)
│   │   └── new/page.tsx            # Create voucher with anti-fraud validation
│   ├── wallet/
│   │   └── page.tsx                # Customer wallet management
│   ├── suppliers/
│   │   └── page.tsx                # Supplier list with rating stars
│   ├── employees/
│   │   └── page.tsx                # Employee list by department
│   ├── commission/
│   │   └── page.tsx                # Commission/hoa hồng with summary cards
│   ├── tasks/
│   │   └── page.tsx                # Task list with department filter chips
│   ├── approvals/
│   │   └── page.tsx                # Approval inbox
│   └── settings/
│       └── page.tsx                # Settings with profile + approval workflow config
```

### Implementation Order

Phase 1: Foundation
1. `lib/utils.ts`
2. All 23 `lib/{entity}.ts` files (follow tbs-erp-domain skill for table schemas)
3. `components/sidebar.tsx` (navigation matching screenshot structure)
4. `components/status-badge.tsx`, `page-header.tsx`, `data-table.tsx`, `kpi-card.tsx`, `empty-state.tsx`
5. `app/layout.tsx` with sidebar integration

Phase 2: Core Pages
6. `app/page.tsx` — Dashboard with KPI cards + charts + recent orders
7. `app/orders/page.tsx` — Order list (most complex — expandable rows, status tabs, filters)
8. `app/orders/[id]/page.tsx` — Order detail with tabs
9. `app/leads/page.tsx` — Lead pipeline
10. `app/customers/page.tsx` — Customer list with tiers

Phase 3: Logistics
11. Warehouse CN, Containers, Customs, Tracking, Warehouse VN, Delivery pages

Phase 4: Finance
12. AR, AP, Payment vouchers (with anti-fraud), Wallet, Commission pages

Phase 5: Operations
13. Suppliers, Employees, Tasks, Approvals, Settings

### Key Rules
- Follow `tbs-ui-patterns/SKILL.md` exactly for colors, layout, badges
- Use `"use server"` in all lib files
- Use `createTable()` pattern (no pre-existing tables)
- Client-side routing via sidebar links (Next.js App Router `<Link>`)
- Max 200 records per SDK request — paginate
- Equality-only SDK filters — complex filtering client-side
- Vietnamese labels throughout the UI
- Include loading states, empty states, error handling, toast feedback
- Use recharts for dashboard charts
- Use @tanstack/react-table for complex tables
- Use react-hook-form + zod for forms

### Start with Phase 1
Generate all foundation files first. After each phase, I'll review and we'll proceed to the next.
