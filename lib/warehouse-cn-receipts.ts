"use server";
import { getRecords, getRecord, createRecord, updateRecord, deleteRecord, deleteRecords } from "@/lib/inforact-sdk";
import type { ListRecordsOptions, CreateTableField } from "@/lib/inforact-sdk";
import { ensureTable } from "@/lib/table-registry";

const TABLE_NAME = 'WarehouseCnReceipts';
const TABLE_FIELDS: CreateTableField[] = [
  { name: 'ReceiptCode', type: 'TEXT' },
  { name: 'OrderId', type: 'TEXT' },
  { name: 'OrderCode', type: 'TEXT' },
  { name: 'TrackingCN', type: 'TEXT' },
  { name: 'PackagesExpected', type: 'NUMBER' },
  { name: 'PackagesReceived', type: 'NUMBER' },
  { name: 'TotalReceived', type: 'NUMBER' },
  { name: 'WeightKg', type: 'NUMBER' },
  { name: 'LengthCm', type: 'NUMBER' },
  { name: 'WidthCm', type: 'NUMBER' },
  { name: 'HeightCm', type: 'NUMBER' },
  { name: 'CBM', type: 'NUMBER' },
  { name: 'ChargeableWeight', type: 'NUMBER' },
  { name: 'QCStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Đạt' }, { name: 'Lỗi' }, { name: 'Chờ KH duyệt' }
  ]},
  { name: 'QCNotes', type: 'TEXT' },
  { name: 'LabelStatus', type: 'SINGLE_OPTION', options: [
    { name: 'Tem HQ OK' }, { name: 'Cần in bù' }, { name: 'Chỉ mã nội bộ' }
  ]},
  { name: 'InternalBarcode', type: 'TEXT' },
  { name: 'Status', type: 'SINGLE_OPTION', options: [
    { name: 'Chờ nhận' }, { name: 'Đã nhận' }, { name: 'Đã kiểm' },
    { name: 'Trên kệ' }, { name: 'Đang pick' }, { name: 'Đã đóng gói' },
    { name: 'Đã load' }, { name: 'Đã xuất' }
  ]},
  { name: 'ExtraServices', type: 'MULTIPLE_OPTIONS', options: [
    { name: 'Kiểm đếm' }, { name: 'Đóng gói lại' }, { name: 'Kiện gỗ' },
    { name: 'Ảnh chi tiết' }, { name: 'Video mở kiện' }
  ]},
  { name: 'ExtraServiceFee', type: 'NUMBER' },
  { name: 'IsUnidentified', type: 'CHECKBOX' },
  { name: 'Agent', type: 'TEXT' },
  { name: 'VerifiedBySale', type: 'CHECKBOX' },
  { name: 'VerifiedAt', type: 'DATE' },
];

let _tableId: string | null = null;
async function getTableId() {
  if (!_tableId) _tableId = await ensureTable(TABLE_NAME, TABLE_FIELDS);
  return _tableId;
}

export interface WarehouseCnReceipt {
  id: string;
  ReceiptCode?: string;
  OrderId?: string;
  OrderCode?: string;
  TrackingCN?: string;
  PackagesExpected?: number;
  PackagesReceived?: number;
  TotalReceived?: number;
  WeightKg?: number;
  LengthCm?: number;
  WidthCm?: number;
  HeightCm?: number;
  CBM?: number;
  ChargeableWeight?: number;
  QCStatus?: string;
  QCNotes?: string;
  LabelStatus?: string;
  InternalBarcode?: string;
  Status?: string;
  ExtraServices?: string[];
  ExtraServiceFee?: number;
  IsUnidentified?: boolean;
  Agent?: string;
  VerifiedBySale?: boolean;
  VerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateWarehouseCnReceiptInput = Omit<WarehouseCnReceipt, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateWarehouseCnReceiptInput = Partial<CreateWarehouseCnReceiptInput>;

function mapRecord(record: any): WarehouseCnReceipt {
  return { id: record.id, ...record.fields, createdAt: record.createdAt, updatedAt: record.updatedAt };
}

export async function getWarehouseCnReceipts(options?: ListRecordsOptions): Promise<{ data: WarehouseCnReceipt[]; total: number }> {
  const tableId = await getTableId();
  const result = await getRecords(tableId, options);
  return { data: result.records.map(mapRecord), total: result.total };
}

export async function getWarehouseCnReceipt(id: string): Promise<WarehouseCnReceipt> {
  const tableId = await getTableId();
  return mapRecord(await getRecord(tableId, id));
}

export async function createWarehouseCnReceipt(data: CreateWarehouseCnReceiptInput): Promise<WarehouseCnReceipt> {
  const tableId = await getTableId();
  return mapRecord(await createRecord(tableId, data as Record<string, any>));
}

export async function updateWarehouseCnReceipt(id: string, data: UpdateWarehouseCnReceiptInput): Promise<void> {
  const tableId = await getTableId();
  await updateRecord(tableId, id, data as Record<string, any>);
}

export async function deleteWarehouseCnReceipt(id: string): Promise<void> {
  const tableId = await getTableId();
  await deleteRecord(tableId, id);
}

export async function deleteWarehouseCnReceipts(ids: string[]): Promise<void> {
  const tableId = await getTableId();
  await deleteRecords(tableId, ids);
}
