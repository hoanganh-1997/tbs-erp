Implement an approval workflow for TBS ERP on Inforact App Builder.

Read tbs-approval-workflow/SKILL.md for the full approval chain logic.

Approval type: $ARGUMENTS

Implementation:
1. Import from `lib/approvals.ts`
2. Use `buildApprovalChain()` to determine the correct chain based on type + context
3. Create approval record with SLA deadline
4. Build approval inbox UI: pending items filtered by current approver role
5. Decision UI: Approve/Reject buttons with required reason field
6. On approve: advance to next step or complete
7. On reject: update status, notify requester
8. SLA check: flag overdue items with red badge
9. Show approval progress: "Step 2/3 — Chờ GĐ KD duyệt"