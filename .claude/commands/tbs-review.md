Review TBS ERP module code for correctness against business rules.

Read ALL TBS skills before reviewing.

Module to review: $ARGUMENTS

Checklist:
1. **App Builder conventions**: One lib file per entity? "use server"? Correct naming pattern?
2. **Field types**: Using TEXT for email/phone/URL? SINGLE_OPTION for statuses? Valid types only?
3. **SDK usage**: Importing from lib files (not @/lib/inforact-sdk directly)? Pagination for >200 records?
4. **Business rules**: Anti-fraud for vouchers? Conditional flow by service type? Deposit logic? AR aging?
5. **Approval matrix**: Correct chain for discount levels? Cancel flow matches stage? Voucher thresholds?
6. **Calculations**: CBM formula correct? Exchange rate handling? Commission calculation?
7. **Status options**: Match Vietnamese names from domain skill? All statuses covered?
8. **Error handling**: try/catch on SDK calls? Loading/empty/error states? Toast feedback?
9. **Cross-entity links**: OrderId stored as TEXT? Consistent ID referencing?
10. **UX**: Quick actions match current status? Next-step suggestions? Color-coded badges?

Output: Issues found with severity (Critical/Warning/Info) and fix suggestions.