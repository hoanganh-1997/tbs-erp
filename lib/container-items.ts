"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'ContainerItems';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'ReceiptId', type: 'TEXT' },
  { name: 'Packages', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'LoadedAt', type: 'DATE' },
  { name: 'ScanVerified', type: 'CHECKBOX' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface ContainerItem {
  id: string;
  ContainerId?: string;
  OrderId?: string;
  OrderCode?: string;
  ReceiptId?: string;
  Packages?: number;
  WeightKg?: number;
  CBM?: number;
  LoadedAt?: string;
  ScanVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateContainerItemInput = Omit<ContainerItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateContainerItemInput = Partial<CreateContainerItemInput>;

function mapRecord(record: any): ContainerItem {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getContainerItems(options?: ListRecordsOptions): Promise<{ data: ContainerItem[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getContainerItem(id: string): Promise<ContainerItem> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createContainerItem(data: CreateContainerItemInput): Promise<ContainerItem> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateContainerItem(id: string, data: UpdateContainerItemInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteContainerItem(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteContainerItems(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
