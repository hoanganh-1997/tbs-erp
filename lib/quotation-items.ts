"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'QuotationItems';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'QuotationId', type: 'TEXT' },
  { name: 'ProductName', type: 'TEXT' },
  { name: 'ProductLink', type: 'TEXT' },
  { name: 'SKU', type: 'TEXT' },
  { name: 'Attributes', type: 'TEXT' },
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'UnitPriceCNY', type: 'NUMBER' },
  { name: 'TotalCNY', type: 'NUMBER' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface QuotationItem {
  id: string;
  QuotationId?: string;
  ProductName?: string;
  ProductLink?: string;
  SKU?: string;
  Attributes?: string;
  Quantity?: number;
  UnitPriceCNY?: number;
  TotalCNY?: number;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateQuotationItemInput = Omit<QuotationItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateQuotationItemInput = Partial<CreateQuotationItemInput>;

function mapRecord(record: any): QuotationItem {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getQuotationItems(options?: ListRecordsOptions): Promise<{ data: QuotationItem[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getQuotationItem(id: string): Promise<QuotationItem> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createQuotationItem(data: CreateQuotationItemInput): Promise<QuotationItem> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateQuotationItem(id: string, data: UpdateQuotationItemInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteQuotationItem(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteQuotationItems(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
