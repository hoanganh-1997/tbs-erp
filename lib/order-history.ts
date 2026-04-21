"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'OrderHistory';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'OrderId', type: 'TEXT' },
  { name: 'FromStatus', type: 'TEXT' },
  { name: 'ToStatus', type: 'TEXT' },
  { name: 'Action', type: 'TEXT' },
  { name: 'Note', type: 'TEXT' },
  { name: 'PerformedBy', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface OrderHistoryEntry {
  id: string;
  OrderId?: string;
  FromStatus?: string;
  ToStatus?: string;
  Action?: string;
  Note?: string;
  PerformedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrderHistoryInput = Omit<OrderHistoryEntry, 'id' | 'createdAt' | 'updatedAt'>;

function mapRecord(record: any): OrderHistoryEntry {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getOrderHistories(options?: ListRecordsOptions): Promise<{ data: OrderHistoryEntry[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getOrderHistory(id: string): Promise<OrderHistoryEntry> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createOrderHistory(data: CreateOrderHistoryInput): Promise<OrderHistoryEntry> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}
