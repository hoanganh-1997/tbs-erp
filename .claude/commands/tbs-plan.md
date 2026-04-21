Plan a TBS ERP module implementation for Inforact App Builder.

Read tbs-erp-domain/SKILL.md for business context.

Module to plan: $ARGUMENTS

Output a plan covering:
1. **Entities**: Which lib/{entity}.ts files to create, with field list
2. **Pages**: List of pages (list, detail, create, dashboard) with route structure
3. **Components**: Reusable components needed
4. **Business rules**: Validation, conditional logic, calculations
5. **Approval flows**: If any approvals are needed
6. **Cross-module dependencies**: Which other lib files to import
7. **SDK workarounds**: How to handle complex filters, aggregations, joins client-side
8. **Queries needed**: Any Base Queries to connect for aggregated/read-only data
9. **Estimated complexity**: Number of files, LOC estimate
10. **Build order**: Which files to create first (libs → pages → components)

Save plan to `.claude/plans/tbs-{module-name}.md`