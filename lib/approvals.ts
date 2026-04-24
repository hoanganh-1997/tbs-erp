"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { listRecords, searchRecords, type ComplexFilter } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Approvals';
const TABLE_FIELDS: CreateTableField[] = [
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
  { name: 'CurrentApproverTitle', type: 'SINGLE_OPTION', options: [
    { name: 'LEADER' }, { name: 'VICE_LEADER' }, { name: 'MEMBER' }
  ]},
  { name: 'ApprovalChain', type: 'TEXT' },
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
  { name: 'EscalatedToTitle', type: 'SINGLE_OPTION', options: [
    { name: 'LEADER' }, { name: 'VICE_LEADER' }, { name: 'MEMBER' }
  ]},
  { name: 'Decision', type: 'SINGLE_OPTION', options: [
    { name: 'Chấp nhận' }, { name: 'Từ chối' }
  ]},
  { name: 'DecisionNote', type: 'TEXT' },
  { name: 'DecidedAt', type: 'DATE' },
  { name: 'Summary', type: 'TEXT' },
  { name: 'Amount', type: 'NUMBER' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Approval {
  id: string;
  ApprovalCode?: string;
  Type?: string;
  ReferenceType?: string;
  ReferenceId?: string;
  ReferenceCode?: string;
  RequestedBy?: string;
  CurrentApprover?: string;
  CurrentApproverTitle?: 'LEADER' | 'VICE_LEADER' | 'MEMBER';
  ApprovalChain?: string;
  CurrentStep?: number;
  TotalSteps?: number;
  Status?: string;
  SLAHours?: number;
  SLADeadline?: string;
  IsOverdue?: boolean;
  EscalatedTo?: string;
  EscalatedToTitle?: 'LEADER' | 'VICE_LEADER' | 'MEMBER' | null;
  Decision?: string;
  DecisionNote?: string;
  DecidedAt?: string;
  Summary?: string;
  Amount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateApprovalInput = Omit<Approval, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateApprovalInput = Partial<CreateApprovalInput>;

function mapRecord(record: any): Approval {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getApprovals(options?: ListRecordsOptions): Promise<{ data: Approval[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export interface ListApprovalsOptions {
  filters?: ComplexFilter;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  skip?: number;
  take?: number;
}

export async function listApprovals(options: ListApprovalsOptions = {}): Promise<{ data: Approval[]; total: number }> {
  const tableId = await getTableId();
  const result = await listRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function searchApprovals(query: string, filters?: ComplexFilter, extra?: { skip?: number; take?: number }): Promise<{ data: Approval[]; total: number }> {
  const tableId = await getTableId();
  const result = await searchRecords(tableId, {
    query,
    fields: ['ApprovalCode', 'ReferenceCode', 'CurrentApprover', 'Summary'],
    filters,
    skip: extra?.skip,
    take: extra?.take,
  });
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getApproval(id: string): Promise<Approval> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createApproval(data: CreateApprovalInput): Promise<Approval> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateApproval(id: string, data: UpdateApprovalInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteApproval(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteApprovals(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
