"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'AccountsPayable';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'APCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'SupplierId', type: 'TEXT' },
  { name: 'SupplierName', type: 'TEXT' },
  { name: 'InvoiceAmount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'PaidAmount', type: 'NUMBER' },
  { name: 'Remaining', type: 'NUMBER' },
  { name: 'DueDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Mở' }, { name: 'Đã duyệt' }, { name: 'Đã lên lịch' },
    { name: 'TT một phần' }, { name: 'Đã TT' }
  ]},
  { name: 'VoucherId', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface AccountPayable {
  id: string;
  APCode?: string;
  OrderId?: string;
  SupplierId?: string;
  SupplierName?: string;
  InvoiceAmount?: number;
  Currency?: string;
  PaidAmount?: number;
  Remaining?: number;
  DueDate?: string;
  Status?: string;
  VoucherId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAccountPayableInput = Omit<AccountPayable, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateAccountPayableInput = Partial<CreateAccountPayableInput>;

function mapRecord(record: any): AccountPayable {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getAccountsPayable(options?: ListRecordsOptions): Promise<{ data: AccountPayable[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getAccountPayable(id: string): Promise<AccountPayable> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createAccountPayable(data: CreateAccountPayableInput): Promise<AccountPayable> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateAccountPayable(id: string, data: UpdateAccountPayableInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteAccountPayable(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteAccountsPayable(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
