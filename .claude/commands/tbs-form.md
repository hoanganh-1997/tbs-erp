Create a form for TBS ERP on Inforact App Builder.

Read the relevant TBS skill for field definitions and validation rules before writing code.

Form to create: $ARGUMENTS

Implementation checklist:
1. Define zod schema matching the table fields from the relevant skill
2. Use react-hook-form with zodResolver
3. Map field types to shadcn/ui components:
   - TEXT → Input
   - NUMBER → Input type="number"
   - DATE → date picker or Input type="date"
   - SINGLE_OPTION → Select with options from table definition
   - MULTIPLE_OPTIONS → multi-select checkboxes
   - CHECKBOX → Checkbox
   - TEXT (long) → Textarea
4. Auto-fill logic: populate fields from related records (customer → order, order → voucher)
5. Conditional fields based on service type or other selections
6. Validation: required fields, min lengths, business rules (e.g., reason ≥ 20 chars for vouchers)
7. Anti-fraud detection for payment vouchers (see tbs-finance skill)
8. Submit: call the create function from the appropriate lib file
9. Toast feedback on success/error
10. Redirect after successful creation

NEVER use HTML <form> tags. Use react-hook-form handlers on buttons.