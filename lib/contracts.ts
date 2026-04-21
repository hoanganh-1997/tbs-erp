"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'Contracts';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ContractCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'CustomerId', type: 'TEXT' },
  { name: 'CustomerName', type: 'TEXT' },
  { name: 'Title', type: 'TEXT' },
  { name: 'ContractValue', type: 'NUMBER' },
  { name: 'Currency', type: 'SINGLE_OPTION', options: [
    { name: 'VND' }, { name: 'CNY' }, { name: 'USD' }
  ]},
  { name: 'SignDate', type: 'DATE' },
  { name: 'StartDate', type: 'DATE' },
  { name: 'EndDate', type: 'DATE' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Nháp' }, { name: 'Chờ ký' }, { name: 'Đã ký' },
    { name: 'Đang thực hiện' }, { name: 'Hoàn thành' }, { name: 'Đã hủy' }
  ]},
  { name: 'SaleOwner', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface Contract {
  id: string;
  ContractCode?: string;
  OrderId?: string;
  OrderCode?: string;
  CustomerId?: string;
  CustomerName?: string;
  Title?: string;
  ContractValue?: number;
  Currency?: string;
  SignDate?: string;
  StartDate?: string;
  EndDate?: string;
  Status?: string;
  SaleOwner?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateContractInput = Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateContractInput = Partial<CreateContractInput>;

function mapRecord(record: any): Contract {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getContracts(options?: ListRecordsOptions): Promise<{ data: Contract[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getContract(id: string): Promise<Contract> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createContract(data: CreateContractInput): Promise<Contract> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateContract(id: string, data: UpdateContractInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteContract(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteContracts(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
