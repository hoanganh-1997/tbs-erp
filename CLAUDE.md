# TBS ERP on Inforact Base — App Builder

## Project Overview
ERP system for TBS Group — Logistics & Cross-border Trade (China → Vietnam).
Built using Inforact App Builder (Prompt-to-App), deployed to Vercel.

## Tech Stack
- **App Builder**: Generates Next.js 14 + React 18 + Tailwind CSS + shadcn/ui apps
- **Data Layer**: Inforact SDK (`lib/inforact-sdk.ts`) — auto-injected, "use server" calls
- **AI Backend**: V0 API (Vercel) for code generation
- **Auth**: Token-based (no per-user identity in generated apps)
- **Deploy**: `{appId}.inforact.app` via Vercel

## Critical App Builder Rules
1. **One `lib/{entity}.ts` per entity** — with `createTable()` + typed CRUD functions
2. **Naming convention**: `get{Plural}`, `get{Singular}`, `create{Singular}`, `update{Singular}`, `delete{Singular}`
3. **Import from lib files**, NOT from `@/lib/inforact-sdk` directly
4. **"use server"** directive in all lib files
5. **Valid field types**: TEXT, NUMBER, DATE, SINGLE_OPTION, MULTIPLE_OPTIONS, CHECKBOX, LINK, ATTACHMENT, IMAGE
6. **Use TEXT** for email, phone, URL, currency — EMAIL/PHONE/URL/CURRENCY types don't exist
7. **Max 200 records** per SDK request — must paginate
8. **Equality-only filters** — complex filtering done client-side
9. **No localStorage** — use SDK for all data
10. **Never define components inside other components** — extract to top-level

## Domain: TBS ERP
- 4 service types: VCT / MHH / UTXNK / LCLCN (affects order flow)
- 13-stage order lifecycle (some stages conditional by service type)
- 7 departments, multi-level approval workflows
- Multi-currency: CNY / USD / VND
- Wallet system per customer (VND + CNY + QR)
- Anti-fraud rules on payment vouchers

## Skills (read before any module work)
- `tbs-erp-domain/SKILL.md` — **ALWAYS read first** — domain knowledge, approval matrix, anti-fraud rules
- `tbs-ui-patterns/SKILL.md` — **ALWAYS read for UI work** — colors, layout, components, badges extracted from real ERP screenshots
- `tbs-order-management/SKILL.md` — Order table schema, status machine, conditional flow, quick actions
- `tbs-warehouse-logistics/SKILL.md` — Warehouse CN/VN, containers, delivery, tracking
- `tbs-finance/SKILL.md` — Payment vouchers, AR/AP, wallet, exchange rates, commission
- `tbs-crm-lead/SKILL.md` — Leads, customers, conversion, pipeline, customer 360
- `tbs-approval-workflow/SKILL.md` — Approval chains, SLA, escalation

## Commands
- `/tbs-module [name]` — Build a complete module (lib + pages + components)
- `/tbs-form [name]` — Create a validated form
- `/tbs-dashboard [role]` — Build role-specific dashboard
- `/tbs-approval [type]` — Implement approval workflow
- `/tbs-review [module]` — Review code against business rules
- `/tbs-plan [module]` — Plan module implementation

## SDK Workaround Patterns

### Complex filtering (dates, ranges)
```typescript
const { data } = await getRecords(); // fetch all
const filtered = data.filter(r => new Date(r.DueDate) < new Date()); // client-side
```

### Cross-table joins
```typescript
const [orders, customers] = await Promise.all([getOrders(), getCustomers()]);
const enriched = orders.data.map(o => ({
  ...o, customer: customers.data.find(c => c.id === o.CustomerId)
}));
```

### Aggregations
Use Base Queries (connected in App Builder settings) for pre-aggregated read-only data.

### Data isolation
No per-user auth available. Options:
1. Pass user filter as URL param from Base UI
2. Create separate apps per role
3. Use queries with pre-filtered data

## Available Libraries
shadcn/ui, lucide-react, recharts, date-fns, @tanstack/react-table,
react-hook-form + zod, zustand, sonner, framer-motion, lodash

## Design
Grayscale palette, shadcn semantic tokens, 8px spacing grid.
Target aesthetic: Vercel / Linear / Notion.
