"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'WarehouseServices';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ServiceCode', type: 'TEXT' },
  { name: 'ReceiptId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'ServiceType', type: 'SINGLE_OPTION', options: [
    { name: 'Kiểm đếm' }, { name: 'Đóng gói lại' }, { name: 'Kiện gỗ' },
    { name: 'Ảnh chi tiết' }, { name: 'Video mở kiện' }
  ]},
  { name: 'Quantity', type: 'NUMBER' },
  { name: 'UnitPrice', type: 'NUMBER' },
  { name: 'TotalFee', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ xử lý' }, { name: 'Đang xử lý' }, { name: 'Hoàn thành' }, { name: 'Đã tính phí' }
  ]},
  { name: 'CompletedBy', type: 'TEXT' },
  { name: 'CompletedAt', type: 'DATE' },
  { name: 'Notes', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface WarehouseService {
  id: string;
  ServiceCode?: string;
  ReceiptId?: string;
  OrderId?: string;
  OrderCode?: string;
  ServiceType?: string;
  Quantity?: number;
  UnitPrice?: number;
  TotalFee?: number;
  Status?: string;
  CompletedBy?: string;
  CompletedAt?: string;
  Notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWarehouseServiceInput = Omit<WarehouseService, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseServiceInput = Partial<CreateWarehouseServiceInput>;

function mapRecord(record: any): WarehouseService {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getWarehouseServices(options?: ListRecordsOptions): Promise<{ data: WarehouseService[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getWarehouseService(id: string): Promise<WarehouseService> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createWarehouseService(data: CreateWarehouseServiceInput): Promise<WarehouseService> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateWarehouseService(id: string, data: UpdateWarehouseServiceInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteWarehouseService(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteWarehouseServices(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
