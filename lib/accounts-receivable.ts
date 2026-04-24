"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { listRecords, searchRecords, type ComplexFilter } from "@/lib/inforact-sdk-ext";
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

export interface ListAccountsReceivableOptions {
  filters?: ComplexFilter;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  skip?: number;
  take?: number;
}

export async function listAccountsReceivable(options: ListAccountsReceivableOptions = {}): Promise<{ data: AccountReceivable[]; total: number }> {
  const tableId = await getTableId();
  const result = await listRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function searchAccountsReceivable(query: string, filters?: ComplexFilter, extra?: { skip?: number; take?: number }): Promise<{ data: AccountReceivable[]; total: number }> {
  const tableId = await getTableId();
  const result = await searchRecords(tableId, {
    query,
    fields: ['InvoiceCode', 'CustomerName', 'CompanyName', 'Notes'],
    filters,
    skip: extra?.skip,
    take: extra?.take,
  });
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getAccountReceivable(id: string): Promise<AccountReceivable> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

function computeRemaining(invoice: unknown, paid: unknown): number | undefined {
  const inv = Number(invoice);
  const pd = Number(paid);
  if (!Number.isFinite(inv) || !Number.isFinite(pd)) return undefined;
  return inv - pd;
}

export async function createAccountReceivable(data: CreateAccountReceivableInput): Promise<AccountReceivable> {
  const tableId = await getTableId();
  const payload: Record<string, any> = { ...(data as Record<string, any>) };
  const remaining = computeRemaining(payload.InvoiceAmount, payload.PaidAmount);
  if (remaining !== undefined) payload.Remaining = remaining;
  return mapRecord(await createRecord(tableId, payload));
}

export async function updateAccountReceivable(id: string, data: UpdateAccountReceivableInput): Promise<void> {
  const tableId = await getTableId();
  const payload: Record<string, any> = { ...(data as Record<string, any>) };
  const touchesAmount = 'InvoiceAmount' in payload || 'PaidAmount' in payload;
  if (touchesAmount) {
    const current = await getRecord(tableId, id);
    const merged = { ...current.fields, ...payload };
    const remaining = computeRemaining(merged.InvoiceAmount, merged.PaidAmount);
    if (remaining !== undefined) payload.Remaining = remaining;
  }
  await updateRecord(tableId, id, payload);
}

export async function deleteAccountReceivable(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}
