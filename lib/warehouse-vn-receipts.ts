"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'WarehouseVnReceipts';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ReceiptCode', type: 'TEXT' },
  { name: 'ContainerId', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'Warehouse', type: 'SINGLE_OPTION', options: [
    { name: 'Đông Anh (HN)' }, { name: 'Hóc Môn (HCM)' }
  ]},
  { name: 'PackagesExpected', type: 'NUMBER' },
  { name: 'PackagesReceived', type: 'NUMBER' },
  { name: 'Discrepancy', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ dỡ' }, { name: 'Đã dỡ' }, { name: 'Đã kiểm' },
    { name: 'Trên kệ' }, { name: 'Đang pick' }, { name: 'Đã đóng gói' },
    { name: 'Chờ giao' }, { name: 'Đã giao' }
  ]},
  { name: 'Location', type: 'TEXT' },
  { name: 'Notes', type: 'TEXT' },
  { name: 'ReceivedBy', type: 'TEXT' },
  { name: 'QCStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Chưa kiểm' }, { name: 'Đạt' }, { name: 'Lỗi' }, { name: 'Chờ xử lý' },
  ]},
  { name: 'QCNotes', type: 'TEXT' },
  { name: 'ShelfZone', type: 'SINGLE_OPTION', options: [
    { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }, { name: 'VIP' }, { name: 'Tạm giữ' },
  ]},
  { name: 'ShelfRow', type: 'TEXT' },
  { name: 'PickedAt', type: 'DATE' },
  { name: 'PickedBy', type: 'TEXT' },
  { name: 'DeliveryOrderId', type: 'TEXT' },
  { name: 'DiscrepancyResolved', type: 'CHECKBOX' },
  { name: 'DiscrepancyNote', type: 'TEXT' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface WarehouseVnReceipt {
  id: string;
  ReceiptCode?: string;
  ContainerId?: string;
  OrderId?: string;
  OrderCode?: string;
  Warehouse?: string;
  PackagesExpected?: number;
  PackagesReceived?: number;
  Discrepancy?: number;
  WeightKg?: number;
  Status?: string;
  Location?: string;
  Notes?: string;
  ReceivedBy?: string;
  QCStatus?: string;
  QCNotes?: string;
  ShelfZone?: string;
  ShelfRow?: string;
  PickedAt?: string;
  PickedBy?: string;
  DeliveryOrderId?: string;
  DiscrepancyResolved?: boolean;
  DiscrepancyNote?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWarehouseVnReceiptInput = Omit<WarehouseVnReceipt, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseVnReceiptInput = Partial<CreateWarehouseVnReceiptInput>;

function mapRecord(record: any): WarehouseVnReceipt {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getWarehouseVnReceipts(options?: ListRecordsOptions): Promise<{ data: WarehouseVnReceipt[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getWarehouseVnReceipt(id: string): Promise<WarehouseVnReceipt> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createWarehouseVnReceipt(data: CreateWarehouseVnReceiptInput): Promise<WarehouseVnReceipt> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateWarehouseVnReceipt(id: string, data: UpdateWarehouseVnReceiptInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteWarehouseVnReceipt(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteWarehouseVnReceipts(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
