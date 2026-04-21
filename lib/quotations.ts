"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Quotations';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'QuotationCode', type: 'TEXT' },
  { name: 'LeadId', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'ServiceTypes', type: 'MULTIPLE_OPTIONS', options: [
    { name: 'VCT' }, { name: 'MHH' }, { name: 'UTXNK' }, { name: 'LCLCN' }
  ]},
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Đã gửi' }, { name: 'Đã chốt' },
    { name: 'Từ chối' }, { name: 'Hết hạn' }
  ]},
  { name: 'IsFinal', type: 'CHECKBOX' },
  { name: 'TotalCNY', type: 'NUMBER' },
  { name: 'ServiceFeeVND', type: 'NUMBER' },
  { name: 'ShippingFeeVND', type: 'NUMBER' },
  { name: 'TotalVND', type: 'NUMBER' },
  { name: 'ExchangeRate', type: 'NUMBER' },
  { name: 'DiscountPercent', type: 'NUMBER' },
  { name: 'DiscountAmount', type: 'NUMBER' },
  { name: 'ValidUntil', type: 'DATE' },
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'Branch', type: 'SINGLE_OPTION', options: [{ name: 'HN' }, { name: 'HCM' }] },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Quotation {
  id: string;
  QuotationCode?: string;
  LeadId?: string;
  CustomerId?: string;
  CustomerName?: string;
  ServiceTypes?: string[];
  Status?: string;
  IsFinal?: boolean;
  TotalCNY?: number;
  ServiceFeeVND?: number;
  ShippingFeeVND?: number;
  TotalVND?: number;
  ExchangeRate?: number;
  DiscountPercent?: number;
  DiscountAmount?: number;
  ValidUntil?: string;
  SaleOwner?: string;
  Branch?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateQuotationInput = Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateQuotationInput = Partial<CreateQuotationInput>;

function mapRecord(record: any): Quotation {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getQuotations(options?: ListRecordsOptions): Promise<{ data: Quotation[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getQuotation(id: string): Promise<Quotation> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createQuotation(data: CreateQuotationInput): Promise<Quotation> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateQuotation(id: string, data: UpdateQuotationInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteQuotation(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteQuotations(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
