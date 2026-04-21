"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'QualityIssues';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'IssueCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'IssueType', type: 'SINGLE_OPTION', options: [
    { name: 'Thiếu hàng' }, { name: 'Hàng lỗi' }, { name: 'Sai hàng' },
    { name: 'Hàng hư hỏng' }, { name: 'Chậm giao' }, { name: 'Khác' }
  ]},
  { name: 'Description', type: 'TEXT' },
  { name: 'Severity', type: 'SINGLE_OPTION', options: [
    { name: 'Thấp' }, { name: 'Trung bình' }, { name: 'Cao' }, { name: 'Nghiêm trọng' }
  ]},
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mở' }, { name: 'Đang xử lý' }, { name: 'Chờ KH xác nhận' },
    { name: 'Đã giải quyết' }, { name: 'Đã đóng' }
  ]},
  { name: 'Resolution', type: 'TEXT' },
  { name: 'CompensationAmount', type: 'NUMBER' },
  { name: 'ReportedBy', type: 'TEXT' },
  { name: 'AssignedTo', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface QualityIssue {
  id: string;
  IssueCode?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  IssueType?: string;
  Description?: string;
  Severity?: string;
  Status?: string;
  Resolution?: string;
  CompensationAmount?: number;
  ReportedBy?: string;
  AssignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateQualityIssueInput = Omit<QualityIssue, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateQualityIssueInput = Partial<CreateQualityIssueInput>;

function mapRecord(record: any): QualityIssue {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getQualityIssues(options?: ListRecordsOptions): Promise<{ data: QualityIssue[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getQualityIssue(id: string): Promise<QualityIssue> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createQualityIssue(data: CreateQualityIssueInput): Promise<QualityIssue> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateQualityIssue(id: string, data: UpdateQualityIssueInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteQualityIssue(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteQualityIssues(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
