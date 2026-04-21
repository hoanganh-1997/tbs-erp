"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'CustomsDeclarationItems';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'DeclarationId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'ProductDescription', type: 'TEXT' },
  { name: 'HSCode', type: 'TEXT' },
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'ValueCNY', type: 'NUMBER' },
  { name: 'ImportTaxRate', type: 'NUMBER' },
  { name: 'ImportTaxVND', type: 'NUMBER' },
  { name: 'VATRate', type: 'NUMBER' },
  { name: 'VATAmount', type: 'NUMBER' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface CustomsDeclarationItem {
  id: string;
  DeclarationId?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerName?: string;
  ProductDescription?: string;
  HSCode?: string;
  Quantity?: number;
  WeightKg?: number;
  CBM?: number;
  ValueCNY?: number;
  ImportTaxRate?: number;
  ImportTaxVND?: number;
  VATRate?: number;
  VATAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateCustomsDeclarationItemInput = Omit<CustomsDeclarationItem, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCustomsDeclarationItemInput = Partial<CreateCustomsDeclarationItemInput>;

function mapRecord(record: any): CustomsDeclarationItem {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getCustomsDeclarationItems(options?: ListRecordsOptions): Promise<{ data: CustomsDeclarationItem[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getCustomsDeclarationItem(id: string): Promise<CustomsDeclarationItem> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createCustomsDeclarationItem(data: CreateCustomsDeclarationItemInput): Promise<CustomsDeclarationItem> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateCustomsDeclarationItem(id: string, data: UpdateCustomsDeclarationItemInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteCustomsDeclarationItem(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteCustomsDeclarationItems(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
