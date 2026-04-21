Build a TBS ERP module for Inforact App Builder.

Before writing any code:
1. Read `tbs-erp-domain/SKILL.md` for business context
2. Read the relevant module skill (tbs-order-management, tbs-warehouse-logistics, tbs-finance, tbs-crm-lead, tbs-approval-workflow)
3. Follow Inforact App Builder conventions:
   - One `lib/{entity-name}.ts` per entity with `createTable()` + typed CRUD
   - Use `"use server"` directive in all lib files
   - Naming: `get{Plural}`, `get{Singular}`, `create{Singular}`, `update{Singular}`, `delete{Singular}`
   - Import from lib files, NOT from `@/lib/inforact-sdk` directly
   - Valid field types: TEXT, NUMBER, DATE, SINGLE_OPTION, MULTIPLE_OPTIONS, CHECKBOX, LINK, ATTACHMENT, IMAGE
   - Use TEXT for email/phone/URL/currency fields
   - Max 200 records per SDK request — implement pagination

Module to build: $ARGUMENTS

Create:
1. `lib/{entity}.ts` files — table schema + typed CRUD functions
2. `app/page.tsx` or `app/{module}/page.tsx` — list view with filters, search, pagination
3. `app/{module}/[id]/page.tsx` — detail view with tabs
4. `app/{module}/new/page.tsx` — create form with zod validation
5. Reusable components in `components/` as needed

Use: shadcn/ui components, lucide-react icons, recharts for charts, react-hook-form + zod for forms, sonner for toasts, date-fns for dates.
Always include loading states, empty states, error boundaries, and toast feedback.