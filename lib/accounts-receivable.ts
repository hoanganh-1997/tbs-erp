"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'AccountsReceivable';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ARCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'InvoiceAmount', type: 'NUMBER' },
  { name: 'PaidAmount', type: 'NUMBER' },
  { name: 'Remaining', type: 'NUMBER' },
  { name: 'DueDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa thu' }, { name: 'Thu một phần' }, { name: 'Quá hạn' },
    { name: 'Đã thu' }, { name: 'Xóa nợ' }
  ]},
  { name: 'CollectionNotes', type: 'TEXT' },
  { name: 'SaleOwner', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface AccountReceivable {
  id: string;
  ARCode?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  InvoiceAmount?: number;
  PaidAmount?: number;
  Remaining?: number;
  DueDate?: string;
  Status?: string;
  CollectionNotes?: string;
  SaleOwner?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAccountReceivableInput = Omit<AccountReceivable, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAccountReceivableInput = Partial<CreateAccountReceivableInput>;

function mapRecord(record: any): AccountReceivable {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getAccountsReceivable(options?: ListRecordsOptions): Promise<{ data: AccountReceivable[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getAccountReceivable(id: string): Promise<AccountReceivable> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createAccountReceivable(data: CreateAccountReceivableInput): Promise<AccountReceivable> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateAccountReceivable(id: string, data: UpdateAccountReceivableInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteAccountReceivable(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}
