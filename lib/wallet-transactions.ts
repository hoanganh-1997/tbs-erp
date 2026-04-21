"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'WalletTransactions';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'TxCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'Type', type: 'SINGLE_OPTION', options: [
    { name: 'Nạp VND' }, { name: 'Nạp CNY' }, { name: 'Phân bổ cọc' },
    { name: 'Phân bổ trả nợ' }, { name: 'Đổi tệ' }, { name: 'Hoàn tiền' }
  ]},
  { name: 'Amount', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'BalanceAfter', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ KT duyệt' }, { name: 'Đã duyệt' }, { name: 'Từ chối' }
  ]},
  { name: 'RejectReason', type: 'TEXT' },
  { name: 'CreatedBy', type: 'TEXT' },
  { name: 'ApprovedBy', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface WalletTransaction {
  id: string;
  TxCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  Type?: string;
  Amount?: number;
  Currency?: string;
  ExchangeRate?: number;
  OrderId?: string;
  OrderCode?: string;
  BalanceAfter?: number;
  Status?: string;
  RejectReason?: string;
  CreatedBy?: string;
  ApprovedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWalletTransactionInput = Omit<WalletTransaction, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWalletTransactionInput = Partial<CreateWalletTransactionInput>;

function mapRecord(record: any): WalletTransaction {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getWalletTransactions(options?: ListRecordsOptions): Promise<{ data: WalletTransaction[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getWalletTransaction(id: string): Promise<WalletTransaction> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createWalletTransaction(data: CreateWalletTransactionInput): Promise<WalletTransaction> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateWalletTransaction(id: string, data: UpdateWalletTransactionInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteWalletTransaction(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteWalletTransactions(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
