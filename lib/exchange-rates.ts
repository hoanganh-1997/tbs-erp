"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'ExchangeRates';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'Date', type: 'DATE' },
  { name: 'FromCurrency', type: 'SINGLE_OPTION', options: [
    { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'ToCurrency', type: 'SINGLE_OPTION', options: [{ name: 'VND' }] },
  { name: 'Rate', type: 'NUMBER' },
  { name: 'SetBy', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface ExchangeRate {
  id: string;
  Date?: string;
  FromCurrency?: string;
  ToCurrency?: string;
  Rate?: number;
  SetBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateExchangeRateInput = Omit<ExchangeRate, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExchangeRateInput = Partial<CreateExchangeRateInput>;

function mapRecord(record: any): ExchangeRate {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getExchangeRates(options?: ListRecordsOptions): Promise<{ data: ExchangeRate[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getExchangeRate(id: string): Promise<ExchangeRate> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createExchangeRate(data: CreateExchangeRateInput): Promise<ExchangeRate> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateExchangeRate(id: string, data: UpdateExchangeRateInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteExchangeRate(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}
