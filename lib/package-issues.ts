"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'PackageIssues';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'IssueCode', type: 'TEXT' },
  { name: 'ReceiptId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'IssueType', type: 'SINGLE_OPTION', options: [
    { name: 'Thiếu kiện' }, { name: 'Sai hàng' }, { name: 'Hàng hư hỏng' },
    { name: 'Kiện không xác định' }, { name: 'Sai kích thước' }, { name: 'Nhãn sai' }
  ]},
  { name: 'Description', type: 'TEXT' },
  { name: 'Severity', type: 'SINGLE_OPTION', options: [
    { name: 'Nhẹ' }, { name: 'Trung bình' }, { name: 'Nặng' }, { name: 'Nghiêm trọng' }
  ]},
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mở' }, { name: 'Đang xử lý' }, { name: 'Chờ KH' },
    { name: 'Đã giải quyết' }, { name: 'Đã đóng' }
  ]},
  { name: 'Resolution', type: 'TEXT' },
  { name: 'ReportedBy', type: 'TEXT' },
  { name: 'AssignedTo', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface PackageIssue {
  id: string;
  IssueCode?: string;
  ReceiptId?: string;
  OrderId?: string;
  OrderCode?: string;
  IssueType?: string;
  Description?: string;
  Severity?: string;
  Status?: string;
  Resolution?: string;
  ReportedBy?: string;
  AssignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreatePackageIssueInput = Omit<PackageIssue, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePackageIssueInput = Partial<CreatePackageIssueInput>;

function mapRecord(record: any): PackageIssue {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getPackageIssues(options?: ListRecordsOptions): Promise<{ data: PackageIssue[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getPackageIssue(id: string): Promise<PackageIssue> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createPackageIssue(data: CreatePackageIssueInput): Promise<PackageIssue> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updatePackageIssue(id: string, data: UpdatePackageIssueInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deletePackageIssue(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deletePackageIssues(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
