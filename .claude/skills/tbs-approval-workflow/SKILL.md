---
name: tbs-approval-workflow
description: "Build guide for TBS approval workflow module on Inforact App Builder. Use when implementing multi-level approvals for: discounts, order cancellation, payment vouchers, container plans, warehouse releases, credit extensions, or any action requiring manager sign-off. Also trigger for: SLA timers, auto-escalation, approval chain logic, pending approval queues, and delegation. Covers lib/approvals.ts."
---

# TBS Approval Workflow — App Builder Guide

## Table Definition

### `lib/approvals.ts`
```typescript
const TABLE_ID_PROMISE = createTable('Approvals', [
  { name: 'ApprovalCode', type: 'TEXT' },
  { name: 'Type', type: 'SINGLE_OPTION', options: [
    { name: 'Giảm giá' }, { name: 'Hủy đơn' }, { name: 'Phiếu chi' },
    { name: 'Container plan' }, { name: 'Xuất kho' }, { name: 'Ân hạn' }, { name: 'Miễn cọc' }
  ]},
  { name: 'ReferenceType', type: 'SINGLE_OPTION', options: [
    { name: 'order' }, { name: 'quotation' }, { name: 'payment_voucher' },
    { name: 'container' }, { name: 'delivery_order' }
  ]},
  { name: 'ReferenceId', type: 'TEXT' },
  { name: 'ReferenceCode', type: 'TEXT' },
  { name: 'RequestedBy', type: 'TEXT' },
  { name: 'CurrentApprover', type: 'TEXT' },
  { name: 'ApprovalChain', type: 'TEXT' }, // JSON string: ["Leader", "KT TT", "GĐ KD"]
  { name: 'CurrentStep', type: 'NUMBER' },
  { name: 'TotalSteps', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ duyệt' }, { name: 'Đã duyệt' }, { name: 'Từ chối' },
    { name: 'Đã leo thang' }, { name: 'Đã ủy quyền' }
  ]},
  { name: 'SLAHours', type: 'NUMBER' },
  { name: 'SLADeadline', type: 'DATE' },
  { name: 'IsOverdue', type: 'CHECKBOX' },
  { name: 'EscalatedTo', type: 'TEXT' },
  { name: 'Decision', type: 'SINGLE_OPTION', options: [
    { name: 'Chấp nhận' }, { name: 'Từ chối' }
  ]},
  { name: 'DecisionNote', type: 'TEXT' },
  { name: 'DecidedAt', type: 'DATE' },
  { name: 'Summary', type: 'TEXT' }, // Human-readable summary of what's being approved
  { name: 'Amount', type: 'NUMBER' }, // For financial approvals
]);
```

## Approval Chain Builder

```typescript
interface ApprovalChainConfig {
  steps: string[];   // Role names in order
  slaHours: number[];  // SLA per step
}

function buildApprovalChain(type: string, context: Record<string, any>): ApprovalChainConfig {
  switch (type) {
    case 'Giảm giá': {
      const discountPercent = context.discountPercent || 0;
      const orderAmount = context.orderAmount || 0;
      if (discountPercent <= 3) {
        return { steps: ['Leader', 'KT TT'], slaHours: [2, 2] }; // Co-approve
      }
      if (discountPercent <= 5) {
        return { steps: ['Leader', 'KT TT', 'GĐ KD'], slaHours: [2, 2, 4] };
      }
      // >5% or >100M
      return { steps: ['Leader', 'KT TT', 'GĐ KD', 'BGĐ'], slaHours: [2, 2, 4, 8] };
    }
    
    case 'Hủy đơn': {
      const hasDeposit = context.depositPaid > 0;
      const hasPurchased = context.stageNumber >= 4;
      if (!hasDeposit) return { steps: ['Leader'], slaHours: [24] };
      if (!hasPurchased) return { steps: ['Leader', 'GĐ KD'], slaHours: [24, 24] };
      return { steps: ['GĐ KD', 'BGĐ'], slaHours: [24, 48] };
    }
    
    case 'Phiếu chi': {
      const amount = context.amount || 0;
      if (amount <= 50_000_000) {
        return { steps: ['KT TT', 'BGĐ'], slaHours: [2, 4] };
      }
      return { steps: ['KT TT', 'KT TH', 'BGĐ'], slaHours: [2, 24, 48] };
    }
    
    case 'Container plan':
      return { steps: ['NV XNK', 'TP XNK', 'COO'], slaHours: [24, 24, 48] };
    
    case 'Xuất kho':
      return { steps: ['NV kho', 'Trưởng kho'], slaHours: [12, 24] };
    
    case 'Ân hạn':
      return { steps: ['Sale', 'CFO', 'CEO'], slaHours: [24, 48, 48] };
    
    case 'Miễn cọc':
      return { steps: ['Leader', 'BGĐ'], slaHours: [24, 48] };
    
    default:
      return { steps: ['Leader'], slaHours: [24] };
  }
}
```

## Create Approval Request

```typescript
async function createApprovalRequest(
  type: string,
  referenceType: string,
  referenceId: string,
  referenceCode: string,
  summary: string,
  requestedBy: string,
  context: Record<string, any>
): Promise<Approval> {
  const chain = buildApprovalChain(type, context);
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + chain.slaHours[0] * 60 * 60 * 1000);
  
  return createApproval({
    ApprovalCode: `APR-${Date.now()}`,
    Type: type,
    ReferenceType: referenceType,
    ReferenceId: referenceId,
    ReferenceCode: referenceCode,
    RequestedBy: requestedBy,
    CurrentApprover: chain.steps[0],
    ApprovalChain: JSON.stringify(chain.steps),
    CurrentStep: 1,
    TotalSteps: chain.steps.length,
    Status: 'Chờ duyệt',
    SLAHours: chain.slaHours[0],
    SLADeadline: slaDeadline.toISOString(),
    IsOverdue: false,
    Summary: summary,
    Amount: context.amount || 0,
  });
}
```

## Process Approval Decision

```typescript
async function processDecision(
  approvalId: string,
  decision: 'Chấp nhận' | 'Từ chối',
  note: string,
  decidedBy: string
) {
  const approval = await getApproval(approvalId);
  const chain = JSON.parse(approval.ApprovalChain || '[]') as string[];
  
  if (decision === 'Từ chối') {
    await updateApproval(approvalId, {
      Status: 'Từ chối',
      Decision: 'Từ chối',
      DecisionNote: note,
      DecidedAt: new Date().toISOString(),
    });
    // Update reference record status back
    return;
  }
  
  // Accepted — check if more steps
  const currentStep = approval.CurrentStep || 1;
  if (currentStep >= chain.length) {
    // Final approval — complete
    await updateApproval(approvalId, {
      Status: 'Đã duyệt',
      Decision: 'Chấp nhận',
      DecisionNote: note,
      DecidedAt: new Date().toISOString(),
    });
    // Update reference record to approved status
    return;
  }
  
  // Advance to next step
  const chainConfig = buildApprovalChain(approval.Type || '', { amount: approval.Amount });
  const nextSLA = chainConfig.slaHours[currentStep] || 24;
  const nextDeadline = new Date(Date.now() + nextSLA * 60 * 60 * 1000);
  
  await updateApproval(approvalId, {
    CurrentStep: currentStep + 1,
    CurrentApprover: chain[currentStep],
    SLAHours: nextSLA,
    SLADeadline: nextDeadline.toISOString(),
    DecisionNote: `Step ${currentStep} approved by ${decidedBy}: ${note}`,
  });
}
```

## Pending Approvals Queue UI

```tsx
// Approval inbox — filtered by current user's role
async function getPendingApprovals(currentRole: string) {
  const { data } = await getApprovals({ filters: { Status: 'Chờ duyệt' } });
  
  // Client-side filter: only approvals where CurrentApprover matches role
  return data.filter(a => a.CurrentApprover === currentRole);
}

// Approval card
function ApprovalCard({ approval }: { approval: Approval }) {
  const isOverdue = approval.SLADeadline && new Date(approval.SLADeadline) < new Date();
  
  return (
    <Card className={cn(isOverdue && "border-red-300 bg-red-50")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <Badge>{approval.Type}</Badge>
            <p className="font-medium mt-1">{approval.Summary}</p>
            <p className="text-sm text-muted-foreground">
              {approval.ReferenceCode} — Yêu cầu bởi {approval.RequestedBy}
            </p>
            {approval.Amount ? (
              <p className="text-sm font-medium mt-1">
                {new Intl.NumberFormat('vi-VN').format(approval.Amount)} ₫
              </p>
            ) : null}
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground">
              Bước {approval.CurrentStep}/{approval.TotalSteps}
            </span>
            {isOverdue && (
              <Badge variant="destructive" className="ml-2">Quá hạn</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => handleDecision(approval.id, 'Chấp nhận')}>
            <Check className="w-4 h-4 mr-1" /> Duyệt
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDecision(approval.id, 'Từ chối')}>
            <X className="w-4 h-4 mr-1" /> Từ chối
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## SLA Overdue Check

```typescript
// Run periodically (or on page load) to flag overdue approvals
async function checkOverdueApprovals() {
  const { data } = await getApprovals({ filters: { Status: 'Chờ duyệt' } });
  const now = new Date();
  
  for (const approval of data) {
    if (approval.SLADeadline && new Date(approval.SLADeadline) < now && !approval.IsOverdue) {
      await updateApproval(approval.id, { IsOverdue: true });
      // In a full system, this would trigger notification to escalation target
    }
  }
}
```
